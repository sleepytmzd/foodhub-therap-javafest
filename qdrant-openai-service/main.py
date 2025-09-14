# pip install qdrant-client openai
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, Range
)
from openai import OpenAI
import uuid
from fastapi import FastAPI, Query
import uvicorn
from pydantic import BaseModel

# --- setup ---
qdrant = QdrantClient("http://localhost:6333")
openai_client = OpenAI()
app = FastAPI()

COLLECTION = "food-rec-db"
DIM = 1536  # text-embedding-3-small


class Restaurant(BaseModel):
    name: str
    category: str
    location: str
    db_id: str 

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


try:
    qdrant.get_collection(COLLECTION)
    print(f"Collection '{COLLECTION}' already exists ✅")
except:  # raised if collection is missing
    print(f"Collection '{COLLECTION}' not found. Creating...")
    qdrant.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE),
    )




def embed(text: str):
    e = openai_client.embeddings.create(
        input=text, model="text-embedding-3-small"
    ).data[0].embedding
    assert len(e) == DIM
    return e


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
        must.append(FieldCondition(key="type", match=MatchValue(value=type)))

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
def get_recommendations(query_text: str, types: str | None = None, max_price: int | None = None, restaurant: str | None = None, category: str | None = None):
    semantic_hits = semantic_search(query_text, 5, types, max_price, restaurant, category)["results"]
    print(semantic_hits)

    response = openai_client.responses.parse(
        model="gpt-4o-2024-08-06",
        input=[
            {"role": "system", "content": "Recommend top 10 Restaurant and Food for the Query. You will be given some semantic hits but don't care about the score. Try to understand what the user wants and provide them what they want. Also there might be same restaurants or foods with different db_id. Only Recommend one if there's multiple of same food/restaurants."},
            {
                "role": "user",
                "content": f"{query_text}. Only recommend from these Restaurants and Foods: {semantic_hits}. Every food has a restaurant mentioned as well. If you recommend that food, also recommend that corresponding restaurant as well.",
            },
        ],
        text_format=AIResponse
    )

    

    return response.output_parsed




def main():
    uvicorn.run("main:app", host="127.0.0.1", port=8020, reload=True)

if __name__ == "__main__":
    main()

 