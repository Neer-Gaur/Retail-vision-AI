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
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return base64.b64encode(response.content).decode('utf-8')

async def generate_visualization(
    customer_photo_base64: str,
    product_image_base64: str,
    product_name: str,
    industry: str
) -> VisualizationResult:
    """Generate AI visualization using Google Gemini"""
    try:
        # Get API key
        api_key = os.getenv('GOOGLE_API_KEY')
        
        if not api_key or "your-google-api-key" in api_key.lower():
            return VisualizationResult(
                product_name=product_name,
                status="failed",
                error="No Google API Key configured. Please set GOOGLE_API_KEY in backend/.env"
            )
        
        genai.configure(api_key=api_key)
        
        # Build the prompt
        if industry == 'fashion':
            prompt = f"You are a fashion stylist AI. Look at the person in the first image and the {product_name} in the second image. Describe how the person would look wearing this product. Note: This model cannot generate new images yet, returning description."
        else:
            prompt = f"You are an interior design AI. Look at the room in the first image and the {product_name} in the second image. Describe how the room would look with this product installed. Note: This model cannot generate new images yet, returning description."

        # Load images
        customer_img = Image.open(io.BytesIO(base64.b64decode(customer_photo_base64)))
        product_img = Image.open(io.BytesIO(base64.b64decode(product_image_base64)))
        
        # Use Gemini 1.5 Flash (efficient multimodal)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        response = model.generate_content([prompt, customer_img, product_img])
        text_response = response.text
        
        # NOTE: Standard Gemini API returns text, not images. 
        # For a real implementation of Virtual Try-On, you'd need a specialized image generation model (like Imagen 2/3 on Vertex AI)
        # or a diff-rendering pipeline.
        # For now, we return the ORIGINAL customer image as the 'result' so the UI doesn't break, 
        # but we attach the AI's description.
        
        return VisualizationResult(
            product_name=product_name,
            result_image=f"data:image/jpeg;base64,{customer_photo_base64}", # Fallback to original
            status="success",
            model="Google Gemini 1.5 Flash (Description Only)",
            description=text_response
        )
            
    except Exception as e:
        return VisualizationResult(
            product_name=product_name,
            status="failed",
            error=str(e)
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
