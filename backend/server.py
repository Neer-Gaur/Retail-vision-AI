from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
import os
import base64
import asyncio
import httpx
from pathlib import Path
import google.generativeai as genai
import io
from PIL import Image

GOOGLE_GENAI_BASE = "https://generativelanguage.googleapis.com/v1beta"

ROOT_DIR = Path(__file__).parent
# Load environment variables
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="RetailVision AI API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ============ Models ============

class VisualizationRequest(BaseModel):
    customer_photo_url: str
    product_image_urls: List[str]
    product_names: List[str]
    industry: str  # 'fashion' or 'tiles'

class VisualizationResult(BaseModel):
    product_name: str
    result_image: Optional[str] = None
    status: str  # 'success', 'failed', 'pending'
    error: Optional[str] = None
    model: Optional[str] = None
    description: Optional[str] = None

class VisualizationResponse(BaseModel):
    results: List[VisualizationResult]

# ============ AI Service ============

async def download_image_as_base64(url: str) -> str:
    """Download image from URL and convert to base64"""
    headers = {
        "User-Agent": "RetailVisionAI/1.0 (+https://retailvision.in)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }
    async with httpx.AsyncClient(follow_redirects=True, headers=headers) as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return base64.b64encode(response.content).decode('utf-8')

async def generate_visualization(
    customer_photo_base64: str,
    product_image_base64: str,
    product_name: str,
    industry: str
) -> VisualizationResult:
    """Generate an output image using Google AI Studio (Gemini image model).

    We call the Generative Language REST API directly because different Python SDK versions
    can behave inconsistently with image models.

    Expected behavior:
    - Send 2 images + a prompt
    - Receive an edited/generated image as inlineData

    If the model returns no image, we return FAILED (no more "input image" fallback).
    """

    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key or "your-google-api-key" in api_key.lower():
        return VisualizationResult(
            product_name=product_name,
            status="failed",
            error="No Google API Key configured. Please set GOOGLE_API_KEY in backend/.env"
        )

    model_id = os.getenv('GEMINI_IMAGE_MODEL') or "gemini-3-pro-image-preview"

    if industry == 'fashion':
        prompt = (
            "Apply the clothes/garment from the PRODUCT image onto the PERSON in the CUSTOMER photo. "
            f"Product name: {product_name}. "
            "Keep the customer's face, identity, pose, body shape and background unchanged. "
            "Photorealistic saree drape, correct scale and lighting. Output ONE final image. No text."
        )
    else:
        prompt = (
            "Apply the tile/material pattern from the PRODUCT image into the ROOM image. "
            f"Product name: {product_name}. "
            "Keep perspective/layout/lighting consistent. Output ONE final image. No text."
        )

    def as_part_image(b64: str, mime: str = "image/jpeg"):
        return {"inlineData": {"mimeType": mime, "data": b64}}

    # Some APIs want model names prefixed with "models/"
    candidate_model_names = [
        model_id,
        f"models/{model_id}" if not str(model_id).startswith("models/") else model_id,
    ]

    last_error = None

    async with httpx.AsyncClient(timeout=90.0) as client:
        for m in candidate_model_names:
            try:
                url = f"{GOOGLE_GENAI_BASE}/models/{m.split('models/')[-1]}:generateContent?key={api_key}"

                body = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": prompt},
                                as_part_image(customer_photo_base64),
                                as_part_image(product_image_base64),
                            ],
                        }
                    ],
                    # If supported by the image model, this nudges it to return an image.
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseModalities": ["IMAGE", "TEXT"],
                    },
                }

                resp = await client.post(url, json=body)
                data = resp.json()

                if resp.status_code >= 400:
                    last_error = data.get("error", {}).get("message") or str(data)
                    continue

                # Parse inline image
                candidates = data.get("candidates", [])
                for c in candidates:
                    content = c.get("content", {})
                    for p in content.get("parts", []) or []:
                        inline = p.get("inlineData")
                        if inline and inline.get("data"):
                            mime = inline.get("mimeType") or "image/png"
                            b64 = inline.get("data")
                            return VisualizationResult(
                                product_name=product_name,
                                result_image=f"data:{mime};base64,{b64}",
                                status="success",
                                model=f"Google AI Studio ({model_id})",
                                description=None,
                            )

                # no image
                last_error = "Model returned no image. Check model id/access and whether it supports image output for this prompt."

            except Exception as e:
                last_error = str(e)
                continue

    return VisualizationResult(
        product_name=product_name,
        status="failed",
        error=last_error or "Unknown error"
    )

# ============ Endpoints ============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "RetailVision AI"}

@api_router.post("/visualize", response_model=VisualizationResponse)
async def create_visualization(request: VisualizationRequest):
    """Generate AI visualizations for products"""
    
    try:
        # Download customer photo
        customer_photo_base64 = await download_image_as_base64(request.customer_photo_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download customer photo: {str(e)}")
    
    results = []
    
    # Process each product
    for i, (product_url, product_name) in enumerate(zip(request.product_image_urls, request.product_names)):
        try:
            # Download product image
            product_base64 = await download_image_as_base64(product_url)
            
            # Generate visualization
            result = await generate_visualization(
                customer_photo_base64=customer_photo_base64,
                product_image_base64=product_base64,
                product_name=product_name,
                industry=request.industry
            )
            results.append(result)
            
        except Exception as e:
            results.append(VisualizationResult(
                product_name=product_name,
                status="failed",
                error=str(e)
            ))
    
    return VisualizationResponse(results=results)

# Include router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
