from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import json
import os
import uvicorn
from typing import Optional

app = FastAPI(title="Gemini Sentiment Analysis API", version="1.0.0")

class GeminiClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
    async def analyze_sentiment(self, text: str) -> dict:
        """
        Analyze sentiment using Gemini API
        """
        headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': self.api_key
        }
        
        
        prompt = f"""Analyze the sentiment of the following text and respond with ONLY a word from POSITIVE/NEGATIVE/NEUTRAL .
                     Text to analyze: "{text}" """
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 200
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                
                result = response.json()
                generated_text = result['candidates'][0]['content']['parts'][0]['text']
                
             
                text_lower = generated_text.lower()
                if "positive" in text_lower:
                    sentiment = "positive"
                elif "negative" in text_lower:
                    sentiment = "negative"
                else:
                    sentiment = "neutral"
                
                return {
                    "sentiment": sentiment,
                    "confidence": "medium",
                    "explanation": "Parsed from text response",
                    "raw_response": generated_text
                }   
            except httpx.TimeoutException:
                raise HTTPException(status_code=408, detail="Request to Gemini API timed out")
            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=e.response.status_code, detail=f"Gemini API error: {e.response.text}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error calling Gemini API: {str(e)}")


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY environment variable not set!")
    GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"

gemini_client = GeminiClient(GEMINI_API_KEY)

@app.post("/analyze-sentiment")
async def analyze_text_sentiment(text_input):
    """
    Analyze sentiment of the provided text using Gemini API
    Returns whether the text is positive, negative, or neutral
    """
    if not text_input.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty")
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        result = await gemini_client.analyze_sentiment(text_input)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Gemini-powered Sentiment Analysis API",
        "usage": "POST /analyze-sentiment with JSON body: {'text': 'your text here'}",
        "note": "Make sure to set GEMINI_API_KEY environment variable"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    api_key_status = "configured" if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE" else "not configured"
    return {
        "status": "healthy",
        "gemini_api_key": api_key_status
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8021)