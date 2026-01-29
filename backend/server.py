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
    """Generate AI visualization using Google Gemini Image Generation"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        # Get API key - prioritize user's Google key, fallback to Emergent
        api_key = os.getenv('GOOGLE_API_KEY') or os.getenv('EMERGENT_LLM_KEY')
        
        if not api_key:
            return VisualizationResult(
                product_name=product_name,
                status="failed",
                error="No API key configured"
            )
        
        # Create unique session
        session_id = f"viz-{os.urandom(8).hex()}"
        
        # Build the prompt based on industry
        if industry == 'fashion':
            prompt = f"""You are an expert fashion AI stylist. 
            
I'm providing two images:
1. First image: A customer's photo showing their face and body
2. Second image: A clothing item called "{product_name}"

Your task: Create a realistic visualization showing the customer WEARING the clothing item from the second image. 

CRITICAL REQUIREMENTS:
- Keep the customer's face, hairstyle, and body type EXACTLY the same
- The clothing should fit naturally on their body
- Maintain realistic lighting and shadows
- The result should look like a professional fashion photo
- Only replace/add the clothing, keep everything else about the person identical

Generate the visualization image now."""
        else:
            prompt = f"""You are an expert interior design AI.
            
I'm providing two images:
1. First image: A room or space photo
2. Second image: A tile design called "{product_name}"

Your task: Create a realistic visualization showing the tile from the second image applied to the floor or wall in the room from the first image.

CRITICAL REQUIREMENTS:
- Keep the room layout, furniture, and lighting the same
- Apply the tile pattern realistically with proper perspective
- Maintain proper scale and proportions
- The result should look like a professional interior design render

Generate the visualization image now."""

        chat = LlmChat(
            api_key=api_key, 
            session_id=session_id, 
            system_message="You are an expert fashion visualization AI that creates realistic product try-on images."
        )
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        # Create message with both images
        msg = UserMessage(
            text=prompt,
            file_contents=[
                ImageContent(customer_photo_base64),
                ImageContent(product_image_base64)
            ]
        )
        
        # Generate visualization
        text_response, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            # Return the first generated image as base64 data URL
            img = images[0]
            result_image = f"data:{img.get('mime_type', 'image/png')};base64,{img['data']}"
            return VisualizationResult(
                product_name=product_name,
                result_image=result_image,
                status="success",
                model="Google Gemini",
                description=text_response[:200] if text_response else None
            )
        else:
            return VisualizationResult(
                product_name=product_name,
                status="failed",
                error="No image generated"
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
