import json
import numpy as np
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import uuid
import re

@dataclass
class NutritionInfo:
    calories: int
    protein: str
    carbs: str
    fat: str

@dataclass
class Food:
    category: str
    food_name: str
    nutrition: NutritionInfo

@dataclass
class Restaurant:
    location: str
    restaurant_name: str
    description: str
    foods: List[Food]

class FoodRecommendationAgent:
    def __init__(self, qdrant_host: str = "localhost", qdrant_port: int = 6333):
        """
        Initialize the Food Recommendation Agent
        
        Args:
            qdrant_host: Qdrant server host
            qdrant_port: Qdrant server port
        """
        self.client = QdrantClient(host=qdrant_host, port=qdrant_port)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.restaurant_collection = "restaurants"
        self.food_collection = "foods"
        
        # Create collections if they don't exist
        self._create_collections()
    
    def _create_collections(self):
        """Create Qdrant collections for restaurants and foods"""
        try:
            # Create restaurant collection
            self.client.recreate_collection(
                collection_name=self.restaurant_collection,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
            
            # Create food collection
            self.client.recreate_collection(
                collection_name=self.food_collection,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
            print("Collections created successfully!")
        except Exception as e:
            print(f"Error creating collections: {e}")
    
    def _parse_nutrition(self, nutrition_data: Dict[str, Any]) -> NutritionInfo:
        """Parse nutrition information from JSON"""
        return NutritionInfo(
            calories=nutrition_data.get("calories", 0),
            protein=nutrition_data.get("protein", "0g"),
            carbs=nutrition_data.get("carbs", "0g"),
            fat=nutrition_data.get("fat", "0g")
        )
    
    def _parse_foods(self, foods_data: List[Dict[str, Any]]) -> List[Food]:
        """Parse foods from JSON data"""
        foods = []
        for food_data in foods_data:
            nutrition = self._parse_nutrition(food_data.get("nutrition", {}))
            food = Food(
                category=food_data.get("category", ""),
                food_name=food_data.get("foodName", ""),
                nutrition=nutrition
            )
            foods.append(food)
        return foods
    
    def load_data_from_json(self, json_data: Dict[str, Any]):
        """
        Load restaurant and food data from JSON and store in Qdrant
        
        Args:
            json_data: JSON data containing restaurants and foods
        """
        restaurants_data = json_data.get("restaurants", [])
        
        restaurant_points = []
        food_points = []
        
        for restaurant_data in restaurants_data:
            # Parse restaurant data
            restaurant = Restaurant(
                location=restaurant_data.get("location", ""),
                restaurant_name=restaurant_data.get("restaurantName", ""),
                description=restaurant_data.get("description", ""),
                foods=self._parse_foods(restaurant_data.get("foods", []))
            )
            
            # Create restaurant embedding
            restaurant_text = f"{restaurant.restaurant_name} {restaurant.location} {restaurant.description}"
            restaurant_embedding = self.model.encode(restaurant_text).tolist()
            
            restaurant_id = str(uuid.uuid4())
            
            # Create restaurant point
            restaurant_point = PointStruct(
                id=restaurant_id,
                vector=restaurant_embedding,
                payload={
                    "type": "restaurant",
                    "name": restaurant.restaurant_name,
                    "location": restaurant.location,
                    "description": restaurant.description,
                    "food_count": len(restaurant.foods)
                }
            )
            restaurant_points.append(restaurant_point)
            
            # Create food points
            for food in restaurant.foods:
                food_text = f"{food.food_name} {food.category} {restaurant.restaurant_name}"
                food_embedding = self.model.encode(food_text).tolist()
                
                food_point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=food_embedding,
                    payload={
                        "type": "food",
                        "name": food.food_name,
                        "category": food.category,
                        "restaurant_id": restaurant_id,
                        "restaurant_name": restaurant.restaurant_name,
                        "restaurant_location": restaurant.location,
                        "calories": food.nutrition.calories,
                        "protein": food.nutrition.protein,
                        "carbs": food.nutrition.carbs,
                        "fat": food.nutrition.fat
                    }
                )
                food_points.append(food_point)
        
        # Upload points to Qdrant
        if restaurant_points:
            self.client.upsert(
                collection_name=self.restaurant_collection,
                points=restaurant_points
            )
            print(f"Uploaded {len(restaurant_points)} restaurants to Qdrant")
        
        if food_points:
            self.client.upsert(
                collection_name=self.food_collection,
                points=food_points
            )
            print(f"Uploaded {len(food_points)} food items to Qdrant")
    
    def recommend_restaurants(self, query: str, limit: int = 5, location: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Recommend restaurants based on user query
        
        Args:
            query: User's search query
            limit: Number of recommendations to return
            location: Optional location filter
            
        Returns:
            List of recommended restaurants
        """
        # Create query embedding
        query_embedding = self.model.encode(query).tolist()
        
        # Create filter if location is specified
        search_filter = None
        if location:
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="location",
                        match=MatchValue(value=location)
                    )
                ]
            )
        
        # Search for similar restaurants
        search_results = self.client.search(
            collection_name=self.restaurant_collection,
            query_vector=query_embedding,
            query_filter=search_filter,
            limit=limit
        )
        
        recommendations = []
        for result in search_results:
            recommendations.append({
                "restaurant_name": result.payload["name"],
                "location": result.payload["location"],
                "description": result.payload["description"],
                "food_count": result.payload["food_count"],
                "similarity_score": result.score
            })
        
        return recommendations
    
    def recommend_dishes(self, query: str, limit: int = 5, category: Optional[str] = None, 
                        max_calories: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Recommend dishes based on user query
        
        Args:
            query: User's search query
            limit: Number of recommendations to return
            category: Optional category filter (e.g., "Main Course", "Starter")
            max_calories: Optional maximum calories filter
            
        Returns:
            List of recommended dishes
        """
        # Create query embedding
        query_embedding = self.model.encode(query).tolist()
        
        # Create filters
        filters = []
        if category:
            filters.append(
                FieldCondition(
                    key="category",
                    match=MatchValue(value=category)
                )
            )
        
        if max_calories:
            filters.append(
                FieldCondition(
                    key="calories",
                    range={
                        "lte": max_calories
                    }
                )
            )
        
        search_filter = Filter(must=filters) if filters else None
        
        # Search for similar dishes
        search_results = self.client.search(
            collection_name=self.food_collection,
            query_vector=query_embedding,
            query_filter=search_filter,
            limit=limit
        )
        
        recommendations = []
        for result in search_results:
            recommendations.append({
                "dish_name": result.payload["name"],
                "category": result.payload["category"],
                "restaurant_name": result.payload["restaurant_name"],
                "restaurant_location": result.payload["restaurant_location"],
                "nutrition": {
                    "calories": result.payload["calories"],
                    "protein": result.payload["protein"],
                    "carbs": result.payload["carbs"],
                    "fat": result.payload["fat"]
                },
                "similarity_score": result.score
            })
        
        return recommendations
    
    def get_restaurant_menu(self, restaurant_name: str) -> List[Dict[str, Any]]:
        """
        Get all dishes from a specific restaurant
        
        Args:
            restaurant_name: Name of the restaurant
            
        Returns:
            List of dishes from the restaurant
        """
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="restaurant_name",
                    match=MatchValue(value=restaurant_name)
                )
            ]
        )
        
        search_results = self.client.scroll(
            collection_name=self.food_collection,
            scroll_filter=search_filter,
            limit=100
        )[0]  # Get the points from the scroll result
        
        menu = []
        for result in search_results:
            menu.append({
                "dish_name": result.payload["name"],
                "category": result.payload["category"],
                "nutrition": {
                    "calories": result.payload["calories"],
                    "protein": result.payload["protein"],
                    "carbs": result.payload["carbs"],
                    "fat": result.payload["fat"]
                }
            })
        
        return menu
    
    def search_by_nutrition(self, max_calories: int = None, min_protein: str = None) -> List[Dict[str, Any]]:
        """
        Search dishes by nutritional criteria
        
        Args:
            max_calories: Maximum calories
            min_protein: Minimum protein (as string like "20g")
            
        Returns:
            List of dishes matching criteria
        """
        filters = []
        
        if max_calories:
            filters.append(
                FieldCondition(
                    key="calories",
                    range={"lte": max_calories}
                )
            )
        
        # Note: For protein filtering, we'd need to parse the string values
        # This is a simplified version
        search_filter = Filter(must=filters) if filters else None
        
        search_results = self.client.scroll(
            collection_name=self.food_collection,
            scroll_filter=search_filter,
            limit=50
        )[0]
        
        results = []
        for result in search_results:
            results.append({
                "dish_name": result.payload["name"],
                "category": result.payload["category"],
                "restaurant_name": result.payload["restaurant_name"],
                "restaurant_location": result.payload["restaurant_location"],
                "nutrition": {
                    "calories": result.payload["calories"],
                    "protein": result.payload["protein"],
                    "carbs": result.payload["carbs"],
                    "fat": result.payload["fat"]
                }
            })
        
        return results

# Example usage and demo
def demo_agent():
    """Demo function showing how to use the agent"""
    
    # Sample JSON data
    sample_data = {
        "restaurants": [
            {
                "location": "Banani, Dhaka",
                "restaurantName": "Spice Garden",
                "description": "Authentic Bangladeshi and Indian cuisine specializing in spicy curries and tandoori dishes.",
                "foods": [
                    {
                        "category": "Main Course",
                        "foodName": "Chicken Curry",
                        "nutrition": {
                            "calories": 320,
                            "protein": "28g",
                            "carbs": "15g",
                            "fat": "18g"
                        }
                    },
                    {
                        "category": "Starter",
                        "foodName": "Vegetable Samosa",
                        "nutrition": {
                            "calories": 150,
                            "protein": "4g",
                            "carbs": "20g",
                            "fat": "7g"
                        }
                    },
                    {
                        "category": "Main Course",
                        "foodName": "Tandoori Chicken",
                        "nutrition": {
                            "calories": 275,
                            "protein": "35g",
                            "carbs": "8g",
                            "fat": "12g"
                        }
                    }
                ]
            },
            {
                "location": "Dhanmondi, Dhaka",
                "restaurantName": "Bengal Bites",
                "description": "Traditional Bengali restaurant serving fish curry, rice dishes, and sweets.",
                "foods": [
                    {
                        "category": "Main Course",
                        "foodName": "Fish Curry",
                        "nutrition": {
                            "calories": 280,
                            "protein": "35g",
                            "carbs": "12g",
                            "fat": "14g"
                        }
                    },
                    {
                        "category": "Dessert",
                        "foodName": "Rasgulla",
                        "nutrition": {
                            "calories": 186,
                            "protein": "4g",
                            "carbs": "36g",
                            "fat": "4g"
                        }
                    },
                    {
                        "category": "Main Course",
                        "foodName": "Hilsa Fish Rice",
                        "nutrition": {
                            "calories": 350,
                            "protein": "32g",
                            "carbs": "25g",
                            "fat": "16g"
                        }
                    }
                ]
            },
            {
                "location": "Gulshan, Dhaka",
                "restaurantName": "Healthy Greens",
                "description": "Modern healthy restaurant focusing on fresh salads, grilled items, and low-calorie options.",
                "foods": [
                    {
                        "category": "Starter",
                        "foodName": "Caesar Salad",
                        "nutrition": {
                            "calories": 180,
                            "protein": "12g",
                            "carbs": "8g",
                            "fat": "12g"
                        }
                    },
                    {
                        "category": "Main Course",
                        "foodName": "Grilled Salmon",
                        "nutrition": {
                            "calories": 250,
                            "protein": "40g",
                            "carbs": "5g",
                            "fat": "8g"
                        }
                    },
                    {
                        "category": "Dessert",
                        "foodName": "Greek Yogurt Berry Bowl",
                        "nutrition": {
                            "calories": 120,
                            "protein": "15g",
                            "carbs": "18g",
                            "fat": "2g"
                        }
                    }
                ]
            }
        ]
    }
    
    # Initialize agent (make sure to set your OpenAI API key)
    print("Initializing Food Recommendation Agent with OpenAI...")
    try:
        agent = FoodRecommendationAgent()
    except ValueError as e:
        print(f"Error: {e}")
        print("Please set your OpenAI API key as an environment variable: export OPENAI_API_KEY='your-key'")
        return
    
    # Load data
    print("Loading sample data...")
    agent.load_data_from_json(sample_data)
    
    # Demo natural language interface
    print("\n=== Natural Language Recommendations ===")
    
    queries = [
        "I want some spicy Indian food in Banani",
        "Find me healthy low-calorie dishes under 200 calories",
        "Show me traditional Bengali restaurants",
        "I'm looking for high-protein main courses",
        "What desserts do you have?"
    ]
    
    for query in queries:
        print(f"\nUser Query: '{query}'")
        response = agent.recommend_restaurants(query)
        print(response)
        print("-" * 80)
    
    # Demo traditional search methods
    print("\n=== Traditional Search Methods ===")
    
    # Demo restaurant recommendations
    print("\n--- Restaurant Recommendations ---")
    restaurants = agent.recommend_restaurants("spicy Indian food")
    for restaurant in restaurants[:2]:  # Show top 2
        print(f"Restaurant: {restaurant['restaurant_name']}")
        print(f"Location: {restaurant['location']}")
        print(f"Description: {restaurant['description']}")
        print(f"Similarity Score: {restaurant['similarity_score']:.3f}")
        print("-" * 40)
    
    # Demo dish recommendations
    print("\n--- Dish Recommendations ---")
    dishes = agent.recommend_dishes("healthy grilled", max_calories=300)
    for dish in dishes[:3]:  # Show top 3
        print(f"Dish: {dish['dish_name']}")
        print(f"Category: {dish['category']}")
        print(f"Restaurant: {dish['restaurant_name']} ({dish['restaurant_location']})")
        print(f"Calories: {dish['nutrition']['calories']}")
        print(f"Similarity Score: {dish['similarity_score']:.3f}")
        print("-" * 40)
    
    # Demo menu retrieval
    print("\n--- Restaurant Menu ---")
    menu = agent.get_restaurant_menu("Spice Garden")
    for item in menu[:2]:  # Show first 2 items
        print(f"Dish: {item['dish_name']}")
        print(f"Category: {item['category']}")
        print(f"Nutrition: {item['nutrition']}")
        print("-" * 40)

if __name__ == "__main__":
    # Run demo
    demo_agent()