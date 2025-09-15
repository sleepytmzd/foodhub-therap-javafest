from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from openai import OpenAI
import base64
import io
from PIL import Image
import os
import requests
from typing import Optional, Union
import json

'''
API Endpoints:

/analyze-nutrition-file - Upload image files
key = image
/analyze-nutrition-url - Send image URLs
{
  "image_url": "https://media.istockphoto.com/id/2193637073/photo/tabby-cat-close-up-telephoto.jpg?s=2048x2048&w=is&k=20&c=u49EfMdb-25rZDKKqYMFy8-3LP1l3st512EiQdBtCRA="
}
'''

app = FastAPI(title="Food Nutrition Analyzer", version="1.0.0")


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class NutritionResponse(BaseModel):
    food_description: str
    carbohydrates: str
    proteins: str
    fats: str
    total_calories: str

class ImageUrlRequest(BaseModel):
    image_url: str
    
def download_image_from_url(url: str) -> bytes:
    """Download image from URL and return as bytes"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        
        content_type = response.headers.get('content-type', '').lower()
        if not content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="URL does not point to a valid image")
            
        return response.content
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image from URL: {str(e)}")

def process_image_bytes(image_data: bytes) -> str:
    """Process image bytes and return base64 string"""
    try:
        image = Image.open(io.BytesIO(image_data))
        
        
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        
        max_size = (1024, 1024)
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
        
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='JPEG', quality=85)
        image_data = img_buffer.getvalue()
        
        return base64.b64encode(image_data).decode('utf-8')
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

def encode_image_to_base64(image_file: UploadFile) -> str:
    """Convert uploaded image to base64 string"""
    image_data = image_file.file.read()
    return process_image_bytes(image_data)

def analyze_food_nutrition(image_base64: str) -> dict:
    """Analyze food image and estimate nutritional information"""
    
    prompt = """
    Analyze this food image and provide nutritional estimates. Return your response in the following JSON format:
    
    {
        "food_description": "Brief one-line description of the food items visible",
        "carbohydrates": "X kcal (or 0 kcal if minimal/none)",
        "proteins": "X kcal (or 0 kcal if minimal/none)", 
        "fats": "X kcal (or 0 kcal if minimal/none)",
        "total_calories": "X kcal (sum of all macronutrients)"
    }
    
    Guidelines:
    - Provide realistic calorie estimates based on visible portion sizes
    - If you can't clearly identify food items, mention this in the description
    - Round calories to nearest 10
    - Consider typical serving sizes for the foods visible
    - Be conservative with estimates if uncertain about portions
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        
        
        try:
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            json_str = content[start_idx:end_idx]
            return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            return {
                "food_description": "Could not parse nutritional information from image",
                "carbohydrates": "0 kcal",
                "proteins": "0 kcal",
                "fats": "0 kcal",
                "total_calories": "0 kcal"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.post("/analyze-nutrition-file", response_model=NutritionResponse)
async def analyze_nutrition_from_file(image: UploadFile = File(...)):
    """
    Upload a food image file and get estimated nutritional information
    """
    
    
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    
    if image.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed.")
    
    try:
        
        image_base64 = encode_image_to_base64(image)
        
        
        nutrition_data = analyze_food_nutrition(image_base64)
        
        return NutritionResponse(**nutrition_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/analyze-nutrition-url", response_model=NutritionResponse)
async def analyze_nutrition_from_url(request: ImageUrlRequest):
    """
    Provide an image URL and get estimated nutritional information
    """
    
    try:
        
        image_data = download_image_from_url(request.image_url)
        
        
        image_base64 = process_image_bytes(image_data)
        
        
        nutrition_data = analyze_food_nutrition(image_base64)
        
        return NutritionResponse(**nutrition_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/analyze-nutrition", response_model=NutritionResponse)
async def analyze_nutrition_legacy(image: UploadFile = File(...)):
    """Legacy endpoint - redirects to file upload endpoint"""
    return await analyze_nutrition_from_file(image)

@app.get("/")
async def root():
    return {
        "message": "Food Nutrition Analyzer API", 
        "version": "1.0.0",
        "endpoints": {
            "file_upload": "/analyze-nutrition-file",
            "image_url": "/analyze-nutrition-url",
            "legacy": "/analyze-nutrition"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/example")
async def example_response():
    """Returns an example of the expected response format"""
    return {
        "food_description": "Grilled chicken breast with steamed broccoli and brown rice",
        "carbohydrates": "45 kcal",
        "proteins": "140 kcal", 
        "fats": "25 kcal",
        "total_calories": "210 kcal"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8022)