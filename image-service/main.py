import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import uvicorn

# Pydantic models for request/response
class ImageUploadRequest(BaseModel):
    image_url: str
    public_id: str

class ImageTransformRequest(BaseModel):
    public_id: str
    width: int = 500
    height: int = 500

class ImageResponse(BaseModel):
    url: str
    public_id: str

# TODO: Fix this environment variable issue



# Configuration from environment variables
cloudinary.config( 
    cloud_name = "-=-", 
    api_key = "--", 
    api_secret = "--", # Click 'View API Keys' above to copy your API secret
    secure=True
)

app = FastAPI(
    title="Cloudinary Image Service",
    description="A FastAPI service for uploading and transforming images using Cloudinary",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"message": "Cloudinary Image Service is running!"}

@app.post("/upload", response_model=ImageResponse)
async def upload_image(request: ImageUploadRequest):
    """Upload an image to Cloudinary from URL"""
    try:
        # if not os.getenv("CLOUDINARY_API_SECRET"):
        #     raise HTTPException(status_code=500, detail="CLOUDINARY_API_SECRET environment variable not set")
        
        upload_result = cloudinary.uploader.upload(
            request.image_url,
            public_id=request.public_id
        )
        
        return ImageResponse(
            url=upload_result["secure_url"],
            public_id=upload_result["public_id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/upload-file", response_model=ImageResponse)
async def upload_file(
    file: UploadFile = File(...),
    public_id: Optional[str] = Form(None)
):
    """Upload an image file directly to Cloudinary"""
    try:
        # if not os.getenv("CLOUDINARY_API_SECRET"):
        #     raise HTTPException(status_code=500, detail="CLOUDINARY_API_SECRET environment variable not set")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Cloudinary
        upload_params = {}
        if public_id:
            upload_params["public_id"] = public_id
        
        upload_result = cloudinary.uploader.upload(
            file_content,
            **upload_params
        )
        
        return ImageResponse(
            url=upload_result["secure_url"],
            public_id=upload_result["public_id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.get("/optimize/{public_id}")
async def optimize_image(public_id: str):
    """Get optimized version of an image with auto-format and auto-quality"""
    try:
        optimize_url, _ = cloudinary_url(
            public_id, 
            fetch_format="auto", 
            quality="auto"
        )
        
        return {"optimized_url": optimize_url, "public_id": public_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/transform")
async def transform_image(request: ImageTransformRequest):
    """Transform image with auto-crop to square aspect ratio"""
    try:
        auto_crop_url, _ = cloudinary_url(
            request.public_id,
            width=request.width,
            height=request.height,
            crop="auto",
            gravity="auto"
        )
        
        return {
            "transformed_url": auto_crop_url,
            "public_id": request.public_id,
            "width": request.width,
            "height": request.height
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transformation failed: {str(e)}")

@app.get("/image/{public_id}")
async def get_image_urls(public_id: str):
    """Get all versions of an image (original, optimized, and transformed)"""
    try:
        # Original URL
        original_url, _ = cloudinary_url(public_id)
        
        # Optimized URL
        optimize_url, _ = cloudinary_url(
            public_id, 
            fetch_format="auto", 
            quality="auto"
        )
        
        # Transformed URL (auto-crop square)
        transform_url, _ = cloudinary_url(
            public_id,
            width=500,
            height=500,
            crop="auto",
            gravity="auto"
        )
        
        return {
            "public_id": public_id,
            "original_url": original_url,
            "optimized_url": optimize_url,
            "transformed_url": transform_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate URLs: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Cloudinary configuration
        if not os.getenv("CLOUDINARY_API_SECRET"):
            return {"status": "unhealthy", "error": "CLOUDINARY_API_SECRET not configured"}
        
        return {"status": "healthy", "cloudinary_configured": True}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8081,
        reload=True
    )