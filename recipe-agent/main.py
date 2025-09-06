from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from openai import OpenAI
import base64
import io
from PIL import Image
import os
import requests
from typing import Optional
import json

app = FastAPI(title="Handmade Recipe Analyzer", version="1.0.0")

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class RecipeAnalysisResponse(BaseModel):
    novelty_points: int
    short_description: str
    probable_recipe_method: str

class ImageUrlRequest(BaseModel):
    image_url: str

def download_image_from_url(url: str) -> bytes:
    """Download image from URL and return as bytes"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Check if content is actually an image
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
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Resize if image is too large (OpenAI has size limits)
        max_size = (1024, 1024)
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
        # Convert to base64
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

def analyze_handmade_recipe(image_base64: str) -> dict:
    """Analyze handmade recipe image for novelty and method"""
    
    prompt = """
    Analyze this handmade recipe/food image and provide a detailed assessment. Return your response in the following JSON format:
    
    {
        "novelty_points": 85,
        "short_description": "Brief one-line description of the dish and what makes it unique",
        "probable_recipe_method": "Detailed step-by-step method to recreate this dish"
    }
    
    Guidelines for scoring novelty_points (1-100):
    - 90-100: Extremely creative, never-seen-before combination or technique
    - 80-89: Very innovative with unique twists on traditional recipes
    - 70-79: Creative variation with interesting elements
    - 60-69: Some creative elements but mostly traditional
    - 50-59: Standard recipe with minor variations
    - 40-49: Common dish with basic preparation
    - 30-39: Very common/basic dish
    - 20-29: Extremely simple preparation
    - 10-19: Basic ingredients, minimal preparation
    - 1-9: No creativity, most basic form
    
    Consider these factors for novelty scoring:
    - Unique ingredient combinations
    - Creative presentation/plating
    - Innovative cooking techniques
    - Fusion of different cuisines
    - Unusual color combinations
    - Creative use of textures
    - Non-traditional preparation methods
    - Artistic presentation elements
    
    For the recipe method:
    - Provide detailed step-by-step instructions
    - Include estimated cooking times
    - Mention specific techniques observed
    - List probable ingredients based on visual analysis
    - Include preparation tips for achieving similar results
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
            max_tokens=800,
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON from the response
        try:
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            json_str = content[start_idx:end_idx]
            parsed_data = json.loads(json_str)
            
            # Validate novelty_points is within range
            if 'novelty_points' in parsed_data:
                novelty_points = parsed_data['novelty_points']
                if not isinstance(novelty_points, int) or novelty_points < 1 or novelty_points > 100:
                    parsed_data['novelty_points'] = 50  # Default value
            
            return parsed_data
            
        except (json.JSONDecodeError, ValueError):
            return {
                "novelty_points": 50,
                "short_description": "Could not analyze recipe creativity from image",
                "probable_recipe_method": "Unable to determine recipe method from the provided image. Please ensure the image shows a clear view of the prepared dish."
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing recipe: {str(e)}")

@app.post("/analyze-recipe-file", response_model=RecipeAnalysisResponse)
async def analyze_recipe_from_file(image: UploadFile = File(...)):
    """
    Upload a handmade recipe image file and get novelty analysis
    """
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Check file size (limit to 10MB)
    if image.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed.")
    
    try:
        # Convert image to base64
        image_base64 = encode_image_to_base64(image)
        
        # Analyze recipe
        recipe_data = analyze_handmade_recipe(image_base64)
        
        return RecipeAnalysisResponse(**recipe_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/analyze-recipe-url", response_model=RecipeAnalysisResponse)
async def analyze_recipe_from_url(request: ImageUrlRequest):
    """
    Provide a handmade recipe image URL and get novelty analysis
    """
    
    try:
        # Download image from URL
        image_data = download_image_from_url(request.image_url)
        
        # Process image and convert to base64
        image_base64 = process_image_bytes(image_data)
        
        # Analyze recipe
        recipe_data = analyze_handmade_recipe(image_base64)
        
        return RecipeAnalysisResponse(**recipe_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Legacy endpoint for backward compatibility
@app.post("/analyze-recipe", response_model=RecipeAnalysisResponse)
async def analyze_recipe_legacy(image: UploadFile = File(...)):
    """Legacy endpoint - redirects to file upload endpoint"""
    return await analyze_recipe_from_file(image)

@app.get("/")
async def root():
    return {
        "message": "Handmade Recipe Analyzer API", 
        "version": "1.0.0",
        "description": "Analyze handmade recipes for novelty, description, and cooking methods",
        "endpoints": {
            "file_upload": "/analyze-recipe-file",
            "image_url": "/analyze-recipe-url",
            "legacy": "/analyze-recipe"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/example")
async def example_response():
    """Returns an example of the expected response format"""
    return {
        "novelty_points": 85,
        "short_description": "Creative rainbow layer cake with natural fruit coloring and edible flower decorations",
        "probable_recipe_method": "1. Prepare vanilla sponge cake batter and divide into 6 portions. 2. Color each portion using natural ingredients (beetroot for red, turmeric for yellow, spirulina for green, etc.). 3. Bake layers separately at 350°F for 12-15 minutes. 4. Prepare cream cheese frosting with vanilla. 5. Layer cakes with frosting between each colored layer. 6. Apply smooth outer frosting coat. 7. Decorate with fresh edible flowers and a light dusting of edible glitter. 8. Chill for 2 hours before serving to set layers."
    }

@app.get("/novelty-guide")
async def novelty_scoring_guide():
    """Returns the novelty scoring guidelines"""
    return {
        "novelty_scoring_guide": {
            "90-100": "Extremely creative, never-seen-before combination or technique",
            "80-89": "Very innovative with unique twists on traditional recipes", 
            "70-79": "Creative variation with interesting elements",
            "60-69": "Some creative elements but mostly traditional",
            "50-59": "Standard recipe with minor variations",
            "40-49": "Common dish with basic preparation",
            "30-39": "Very common/basic dish", 
            "20-29": "Extremely simple preparation",
            "10-19": "Basic ingredients, minimal preparation",
            "1-9": "No creativity, most basic form"
        },
        "factors_considered": [
            "Unique ingredient combinations",
            "Creative presentation/plating", 
            "Innovative cooking techniques",
            "Fusion of different cuisines",
            "Unusual color combinations",
            "Creative use of textures",
            "Non-traditional preparation methods",
            "Artistic presentation elements"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)  # Different port to avoid conflicts