from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
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

# Optional: background removal for product preprocessing
try:
    from rembg import remove as rembg_remove
except Exception:
    rembg_remove = None

import numpy as np


GOOGLE_GENAI_BASE = "https://generativelanguage.googleapis.com/v1beta"

ROOT_DIR = Path(__file__).parent
# Load environment variables
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="RetailVision AI API")

# CORS
# Render/production: set CORS_ORIGINS="https://retailvision.in,https://www.retailvision.in"
# Local dev: you can leave it empty to allow all.
origins_raw = os.getenv("CORS_ORIGINS", "").strip()
origins = [o.strip() for o in origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
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

class ProductAssetExtractRequest(BaseModel):
    product_image_url: str
    category: Optional[str] = None

class ProductAssetExtractResponse(BaseModel):
    status: str  # success|failed
    cutout_image: Optional[str] = None  # data:image/png;base64,...
    mask_image: Optional[str] = None    # data:image/png;base64,...
    error: Optional[str] = None


# ============ AI Service ============

async def download_image_as_base64(url: str) -> str:
    """Download image from URL and convert to base64 (no data: prefix)."""
    content = await download_image_bytes(url)
    return base64.b64encode(content).decode('utf-8')

async def download_image_bytes(url: str) -> bytes:
    """Download image from URL and return bytes."""
    headers = {
        "User-Agent": "RetailVisionAI/1.0 (+https://retailvision.in)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }
    async with httpx.AsyncClient(follow_redirects=True, headers=headers) as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return response.content

def pil_to_data_url(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    mime = "image/png" if fmt.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"

def alpha_to_mask_data_url(img_rgba: Image.Image) -> str:
    # Create binary-ish mask from alpha channel
    if img_rgba.mode != 'RGBA':
        img_rgba = img_rgba.convert('RGBA')
    alpha = img_rgba.split()[-1]
    # boost mask contrast
    mask = alpha.point(lambda a: 255 if a > 10 else 0)
    return pil_to_data_url(mask.convert('L'), fmt='PNG')


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
            "VIRTUAL TRY-ON (GARMENT TRANSFER)\n\n"
            "INPUTS: Two images are provided.\n"
            "1) CUSTOMER image: a real person wearing ANY outfit.\n"
            "2) PRODUCT image: the target garment. The garment may be photographed alone OR worn by a model/mannequin.\n\n"
            "TASK: Extract the exact garment from the PRODUCT image and dress the CUSTOMER with that garment.\n"
            "This is NOT a texture swap. It must be a full garment replacement with correct cut and silhouette.\n\n"
            "GARMENT EXTRACTION RULES (from PRODUCT image):\n"
            "- Identify the garment only (ignore the product model/mannequin body, skin, face, hair, background).\n"
            "- Preserve key design details: color, pattern, embroidery/borders, neckline, sleeves/straps, length, and overall silhouette.\n"
            "- If the product image shows only part of the garment, infer the missing parts realistically while keeping design consistent.\n\n"
            "APPLICATION RULES (to CUSTOMER image):\n"
            "- Replace the CUSTOMER's current clothing in the relevant region completely with the extracted garment.\n"
            "- Keep CUSTOMER identity unchanged: face, hair, skin tone, body shape, pose, hands, jewelry, and background must remain the same.\n"
            "- Ensure realistic fit, drape, folds, and lighting/shadows consistent with the CUSTOMER photo.\n"
            "- Do not change camera angle, framing, or add extra accessories.\n\n"
            f"Product name: {product_name}.\n"
            "OUTPUT: Return exactly ONE photorealistic final image only. No text, no watermark."
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

@api_router.post("/product-assets/extract", response_model=ProductAssetExtractResponse)
async def extract_product_assets(request: ProductAssetExtractRequest):
    """Extract garment cutout + mask from an inventory image.

    This is called when the owner uploads/updates an inventory image. The frontend
    can then upload returned assets to Supabase Storage and store URLs in DB.
    """
    if not request.product_image_url:
        return ProductAssetExtractResponse(status="failed", error="product_image_url is required")

    if rembg_remove is None:
        return ProductAssetExtractResponse(
            status="failed",
            error="rembg is not available on this backend. Deploy backend with updated requirements.txt."
        )

    try:
        raw = await download_image_bytes(request.product_image_url)
        # rembg returns bytes with alpha
        out = rembg_remove(raw)
        img = Image.open(io.BytesIO(out)).convert('RGBA')

        # Optional: small resize to keep asset sizes reasonable
        max_w = 1024
        if img.width > max_w:
            ratio = max_w / float(img.width)
            img = img.resize((max_w, int(img.height * ratio)), Image.LANCZOS)

        cutout = pil_to_data_url(img, fmt='PNG')
        mask = alpha_to_mask_data_url(img)
        return ProductAssetExtractResponse(status="success", cutout_image=cutout, mask_image=mask)

    except Exception as e:
        return ProductAssetExtractResponse(status="failed", error=str(e))


@api_router.post("/visualize", response_model=VisualizationResponse)
async def create_visualization(request: VisualizationRequest):
    """Generate AI visualizations for products"""

    try:
        customer_photo_base64 = await download_image_as_base64(request.customer_photo_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download customer photo: {str(e)}")

    results = []

    for product_url, product_name in zip(request.product_image_urls, request.product_names):
        try:
            product_base64 = await download_image_as_base64(product_url)
            result = await generate_visualization(
                customer_photo_base64=customer_photo_base64,
                product_image_base64=product_base64,
                product_name=product_name,
                industry=request.industry
            )
            results.append(result)
        except Exception as e:
            results.append(VisualizationResult(product_name=product_name, status="failed", error=str(e)))

    return VisualizationResponse(results=results)

# Include router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
