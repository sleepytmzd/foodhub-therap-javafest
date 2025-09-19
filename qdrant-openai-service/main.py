
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, Range
)
from openai import OpenAI
import uuid
from fastapi import FastAPI, Query, HTTPException
import uvicorn
from pydantic import BaseModel
import requests
import os
from pymongo import MongoClient
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware



qdrant = QdrantClient(os.getenv("QDRANT_URL"))     # "http://qdrant:6333"

openai_client = OpenAI()
app = FastAPI()

COLLECTION = "food-rec-db"
DIM = 1536  

API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
MONGODB5_URL = os.getenv("MONGODB5_URL")

MONGO_CONFIG = {
    "host": "localhost",
    "port": 27021,
    "username": "root",
    "password": "password",
    "database": "recommendation-service"
}

@app.get("/")
def root():
    return {"message": "Recommendation service is running ✅"}

frontend_origins = os.getenv("FRONTEND_URL", "")
origins = [
    "http://localhost:7000", 
    "http://127.0.0.1:7000",   
    frontend_origins,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],         # allow all HTTP methods
    allow_headers=["*"],         # allow all headers
)

# conn_uri = f"mongodb://{MONGO_CONFIG['username']}:{MONGO_CONFIG['password']}@{MONGO_CONFIG['host']}:{MONGO_CONFIG['port']}/{MONGO_CONFIG['database']}?authSource=admin"
# connection_string = f"{MONGODB5_URL}:mongodb://root:password@localhost:27021/recommendation-service?authSource=admin"
# connection_string = f"{MONGODB5_URL}:mongodb://root:password@localhost:27021/recommendation-service?authSource=admin"

class Restaurant(BaseModel):
    name: str
    category: str
    location: str
    db_id: str 

class RestaurantGoogle(BaseModel):
    name: str
    category: str
    location: str

class Food(BaseModel):
    name: str
    category: str
    restaurant: str 
    price: int
    db_id: str 

class AIResponse(BaseModel):
    query: str
    recommended_restaurants: list[Restaurant]
    recommended_foods: list[Food]
    nearby_restaurants: list[RestaurantGoogle]


try:
    qdrant.get_collection(COLLECTION)
    print(f"Collection '{COLLECTION}' already exists ✅")
except:  
    print(f"Collection '{COLLECTION}' not found. Creating...")
    qdrant.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE),
    )

def get_mongo_client():
    # connection_string = f"mongodb://{MONGO_CONFIG['username']}:{MONGO_CONFIG['password']}@{MONGO_CONFIG['host']}:{MONGO_CONFIG['port']}/{MONGO_CONFIG['database']}?authSource=admin"
    return MongoClient(MONGODB5_URL)

def save_recommendation_response(response_data: Dict[Any, Any], user_id: str = None):
    client = get_mongo_client()
    
    try:
        
        db = client[MONGO_CONFIG['database']]
        collection = db['recommendations']  
        
        
        document = {
            "query": response_data.get("query"),
            "recommended_restaurants": response_data.get("recommended_restaurants", []),
            "recommended_foods": response_data.get("recommended_foods", []),
            "nearby_restaurants": response_data.get("nearby_restaurants", []),
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        
        result = collection.insert_one(document)
        
        print(f"Recommendation saved successfully with ID: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Error saving recommendation: {str(e)}")
        raise e
    
    finally:
        client.close()


def embed(text: str):
    e = openai_client.embeddings.create(
        input=text, model="text-embedding-3-small"
    ).data[0].embedding
    assert len(e) == DIM
    return e

@app.get("/recommendations", response_model=dict)
def get_all_recommendations(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    query_text: Optional[str] = Query(None, description="Filter by query text"),
    limit: int = Query(50, ge=1, le=500, description="Number of recommendations to return"),
    skip: int = Query(0, ge=0, description="Number of recommendations to skip"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order")
):
    """
    Get all recommendations with optional filtering and pagination
    """
    client = get_mongo_client()
    
    try:
        db = client[MONGO_CONFIG['database']]
        collection = db['recommendations']
        
        
        filter_query = {}
        if user_id:
            filter_query["user_id"] = user_id
        if session_id:
            filter_query["session_id"] = session_id
        if query_text:
            filter_query["query"] = {"$regex": query_text, "$options": "i"}  
        
        
        sort_direction = -1 if sort_order == "desc" else 1
        
        
        total_count = collection.count_documents(filter_query)
        
        
        recommendations = list(collection.find(filter_query)
                             .sort(sort_by, sort_direction)
                             .skip(skip)
                             .limit(limit))
        
        
        for rec in recommendations:
            rec["_id"] = str(rec["_id"])
        
        return {
            "success": True,
            "data": recommendations,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "skip": skip,
                "has_more": skip + limit < total_count
            },
            "filters_applied": {
                "user_id": user_id,
                "session_id": session_id,
                "query_text": query_text,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving recommendations: {str(e)}")
    
    finally:
        client.close()
    
@app.post("/add-point-food")
def add_point_food(name: str = Query(...), description: str = Query(...), category: str = Query(...), nutrition_table: str = Query(...), price: str = Query(...), restaurant: str = Query(...), db_id: str = Query(...)):
    point_id = str(uuid.uuid4())
    
    combined = f"About {name}: {description}. Category: {category} and nutritions are of amount {nutrition_table}. It costs {price} taka. It is in Restaurant: {restaurant}."
    
    qdrant.upsert(
        collection_name=COLLECTION,
        points=[
            PointStruct(
                id=point_id,
                vector=embed(combined),
                payload={
                    "name" : name,
                    "db_id": db_id,  
                    "type": "food",
                    "price": int(price),
                    "category": category,
                    "restaurant": restaurant
                }
            )
        ]
    )

    return {"Message" : f"{point_id} has been created in {COLLECTION}"}  

@app.post("/add-point-restaurant")
def add_point_restaurant(name: str = Query(...), description: str = Query(...), location: str = Query(...), category: str = Query(...), db_id: str = Query(...)):
    point_id = str(uuid.uuid4())
    
    combined = f"About {name}: {description}. Category: {category} and It is located in {location}"
    
    qdrant.upsert(
        collection_name=COLLECTION,
        points=[
            PointStruct(
                id=point_id,
                vector=embed(combined),
                payload={
                    "type": "restaurant",
                    "category": category,
                    "name": name, 
                    "location" : location,
                    "db_id": db_id
                }
            )
        ]
    )

    return {"Message" : f"{point_id} has been created in {COLLECTION}"}  

@app.post("/semantic-search")
def semantic_search(query_text: str, top_k: int = 10, type: str | None = None, max_price: int | None = None, restaurant: str | None = None, category: str | None = None):
    qvec = embed(query_text)

    must = []
    if type:
        must.append(FieldCondition(key="type", match=MatchValue(value=type)))
    if max_price is not None:
        must.append(FieldCondition(key="price", range=Range(lte=max_price)))
    if restaurant:
        must.append(FieldCondition(key="restaurant", match=MatchValue(value=restaurant)))
    if category:
        must.append(FieldCondition(key="type", match=MatchValue(value=category)))

    flt = Filter(must=must) if must else None

    hits = qdrant.search(
        collection_name=COLLECTION,
        query_vector=qvec,
        limit=top_k,
        query_filter=flt,
        with_payload=True,
    )
    return {
            "results": [
                {
                    "score": round(hit.score, 4),
                    "payload": hit.payload or {},
                    "id": getattr(hit, 'id', None)
                }
                for hit in hits
            ],
            "total_results": len(hits),
            "query": query_text,
            "filters_applied": {k: v for k, v in {
                "type": type,
                "max_price": max_price,
                "restaurant": restaurant,
                "category": category
            }.items() if v is not None}
        }


@app.post("/get-recommendation")
def get_recommendations(query_text: str, types: str | None = None, max_price: int | None = None, restaurant: str | None = None, category: str | None = None, place: str | None = None):
    semantic_hits = semantic_search(query_text, 5, types, max_price, restaurant, category)["results"]
    print(semantic_hits)
    
    place = place or "Dhanmondi Dhaka"

    nearby_places_json = search_places(f"{query_text} restaurants in {place}")
    print(nearby_places_json)

    response = openai_client.responses.parse(
        model="gpt-4o-2024-08-06",
        input=[
            {"role": "system", "content": "You will be given two json. Restaurants/Foods from database (Put them against recommended_restaurants and recommended_foods) and Nearby Places Restaurants (put them against nearby_restaurants). Based on the user query. Recommend 20 foods, restaurants and nearby place restaurants. If same restaurant is in database and also nearby places. Recommend it against recommended_restaurants. Also restaurants with same name and same location, only recommend one."},
            {
                "role": "user",
                "content": f"{query_text}. From database: {semantic_hits}. Nearby Places JSON: {nearby_places_json}",
            },
        ],
        text_format=AIResponse
    )
        
    if hasattr(response, 'output_parsed'):
        response_obj = response.output_parsed
        
        
        if hasattr(response_obj, 'model_dump'):
            
            response_dict = response_obj.model_dump()
        elif hasattr(response_obj, 'dict'):
            
            response_dict = response_obj.dict()
        elif hasattr(response_obj, '__dict__'):
            
            response_dict = response_obj.__dict__
        else:
            
            response_dict = dict(response_obj) if hasattr(response_obj, '__iter__') else {}
    else:
        response_dict = response if isinstance(response, dict) else {}

    save_recommendation_response(response_dict)

    

    return response.output_parsed


def search_places(query):
    
    url = "https://places.googleapis.com/v1/places:searchText"
    
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress'
    }
    
    
    payload = {
        "textQuery": query
    }
    
    try:
        
        response = requests.post(url, headers=headers, json=payload)
        
        
        response.raise_for_status()
        
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")
        return None



def main():
    uvicorn.run("main:app", host="127.0.0.1", port=8020, reload=True)

if __name__ == "__main__":
    main()
    
    

 