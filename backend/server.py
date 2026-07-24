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



def ensure_white_background(image_bytes: bytes) -> bytes:
    """If the image has transparency (alpha channel), paste it onto a solid white background."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            background = Image.new("RGBA", img.size, (255, 255, 255, 255))
            background.paste(img, (0, 0), img)
            img = background.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return buf.getvalue()
    except Exception as e:
        print(f"Error converting transparent background to white: {e}")
    return image_bytes

async def download_image_as_base64(url: str) -> str:
    """Download image from URL and convert to base64 (no data: prefix), or extract base64 directly from data URLs."""
    if url.startswith("data:"):
        return url.split(",", 1)[1] if "," in url else url
    content = await download_image_bytes(url)
    return base64.b64encode(content).decode('utf-8')

async def download_product_image_as_base64(url: str) -> str:
    """Download product cutout image, paste on white background if transparent, and encode as base64."""
    content = await download_image_bytes(url)
    content = ensure_white_background(content)
    return base64.b64encode(content).decode('utf-8')

async def download_image_bytes(url: str) -> bytes:
    """Download image from URL and return bytes, or decode base64 directly from data URLs."""
    if url.startswith("data:"):
        b64 = url.split(",", 1)[1] if "," in url else url
        return base64.b64decode(b64)
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


async def generate_visualization_local(
    customer_photo_base64: str,
    product_image_base64: str,
    product_name: str,
    industry: str
) -> VisualizationResult:
    """Generate AI visualization locally using ComfyUI API."""
    import uuid
    import json

    comfyui_url = os.getenv("COMFYUI_API_URL", "http://127.0.0.1:8188")
    comfyui_headers_raw = os.getenv("COMFYUI_HEADERS", "{}")
    try:
        comfyui_headers = json.loads(comfyui_headers_raw)
    except Exception:
        comfyui_headers = {}
    
    comfyui_api_key = os.getenv("COMFYUI_API_KEY")
    if comfyui_api_key:
        comfyui_headers["Authorization"] = f"Bearer {comfyui_api_key}"
    
    unet_name = os.getenv("COMFYUI_UNET_NAME", "qwen_image_edit_fp8_e4m3fn.safetensors")
    clip_name = os.getenv("COMFYUI_CLIP_NAME", "qwen_2.5_vl_7b_fp8_scaled.safetensors")
    vae_name = os.getenv("COMFYUI_VAE_NAME", "qwen_image_vae.safetensors")
    lora_extract_name = os.getenv("COMFYUI_LORA_EXTRACT_NAME", "extract-outfit_v3.safetensors")
    lora_transfer_name = os.getenv("COMFYUI_LORA_TRANSFER_NAME", "clothtransfer.safetensors")
    
    try:
        import random
        seed1 = random.randint(1, 1125899906842624)
        seed2 = random.randint(1, 1125899906842624)

        # Decode helper
        def b64_to_bytes(b64_str: str) -> bytes:
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            return base64.b64decode(b64_str)

        customer_bytes = b64_to_bytes(customer_photo_base64)
        product_bytes = b64_to_bytes(product_image_base64)
        
        # Load pose reference bytes
        pose_ref_path = ROOT_DIR / "pose_ref.png"
        if pose_ref_path.exists():
            pose_bytes = pose_ref_path.read_bytes()
        else:
            raise Exception("pose_ref.png is missing from the backend directory.")

        # Generate unique filenames
        run_id = str(uuid.uuid4())[:8]
        cust_filename = f"cust_{run_id}.png"
        prod_filename = f"prod_{run_id}.png"
        pose_filename = f"pose_{run_id}.png"

        # Upload images to ComfyUI
        async with httpx.AsyncClient(timeout=30.0, headers=comfyui_headers) as client:
            # Upload customer image
            resp = await client.post(
                f"{comfyui_url}/upload/image",
                files={"image": (cust_filename, customer_bytes, "image/png")},
                data={"overwrite": "true"}
            )
            if resp.status_code != 200:
                raise Exception(f"Failed to upload customer image to ComfyUI: {resp.text}")
            cust_uploaded_name = resp.json()["name"]

            # Upload product image
            resp = await client.post(
                f"{comfyui_url}/upload/image",
                files={"image": (prod_filename, product_bytes, "image/png")},
                data={"overwrite": "true"}
            )
            if resp.status_code != 200:
                raise Exception(f"Failed to upload product image to ComfyUI: {resp.text}")
            prod_uploaded_name = resp.json()["name"]

            # Upload pose reference image
            resp = await client.post(
                f"{comfyui_url}/upload/image",
                files={"image": (pose_filename, pose_bytes, "image/png")},
                data={"overwrite": "true"}
            )
            if resp.status_code != 200:
                raise Exception(f"Failed to upload pose reference image to ComfyUI: {resp.text}")
            pose_uploaded_name = resp.json()["name"]

        # Map product name to segment prompt
        p_lower = product_name.lower()
        if "saree" in p_lower or "sari" in p_lower:
            segment_prompt = "saree"
            garment_desc = "saree"
        elif "dress" in p_lower:
            segment_prompt = "dress"
            garment_desc = "dress"
        elif "shirt" in p_lower or "t-shirt" in p_lower or "tshirt" in p_lower:
            segment_prompt = "shirt"
            garment_desc = "shirt"
        elif "top" in p_lower or "blouse" in p_lower:
            segment_prompt = "top"
            garment_desc = "top"
        elif "suit" in p_lower or "blazer" in p_lower or "jacket" in p_lower:
            segment_prompt = "jacket"
            garment_desc = "jacket"
        else:
            segment_prompt = "clothing"
            garment_desc = "clothing"

        # ── Qwen Image Edit Outfit Transfer Workflow ────────────────────────────
        # Stage 1: Extract outfit from garment image onto white background
        # Stage 2: Transfer extracted outfit onto the person photo
        # Models: Qwen2.5-VL 7B fp8 + extract-outfit_v3 LoRA + clothtransfer LoRA
        prompt = {
            # ── Model Loaders ──────────────────────────────────────────────────
            "1": {  # Load base UNet
                "inputs": {
                    "unet_name": unet_name,
                    "weight_dtype": "fp8_e4m3fn"
                },
                "class_type": "UNETLoader"
            },
            "2": {  # Load CLIP / text encoder
                "inputs": {
                    "clip_name": clip_name,
                    "type": "qwen_image",
                    "device": "default"
                },
                "class_type": "CLIPLoader"
            },
            "3": {  # Load VAE
                "inputs": { "vae_name": vae_name },
                "class_type": "VAELoader"
            },
            # ── Image Inputs ──────────────────────────────────────────────────
            "4": {  # Garment image (clothing to extract)
                "inputs": { "image": prod_uploaded_name, "upload": "image" },
                "class_type": "LoadImage"
            },
            "5": {  # Person / customer image
                "inputs": { "image": cust_uploaded_name, "upload": "image" },
                "class_type": "LoadImage"
            },
            "21": {  # Pose reference skeleton image
                "inputs": { "image": pose_uploaded_name, "upload": "image" },
                "class_type": "LoadImage"
            },
            # ── Stage 1: Outfit Extraction ────────────────────────────────────
            # Apply extract-outfit LoRA to base model
            "6": {
                "inputs": {
                    "model": ["1", 0],
                    "lora_name": lora_extract_name,
                    "strength_model": 1.0
                },
                "class_type": "LoraLoaderModelOnly"
            },
            # Encode stage 1 prompt: garment photo as image1, pose skeleton as image2
            "7": {
                "inputs": {
                    "clip": ["2", 0],
                    "vae": ["3", 0],
                    "image1": ["4", 0],
                    "image2": ["21", 0],
                    "prompt": "extract the full body and the full outfit from front and from back onto a white background."
                },
                "class_type": "TextEncodeQwenImageEditPlus"
            },
            "8": {  # Zero-out conditioning for CFG-free sampling
                "inputs": { "conditioning": ["7", 0] },
                "class_type": "ConditioningZeroOut"
            },
            "9": {  # Empty latent for stage 1
                "inputs": { "width": 1024, "height": 1024, "batch_size": 1 },
                "class_type": "EmptyLatentImage"
            },
            "10": {  # KSampler stage 1 (extract outfit)
                "inputs": {
                    "model": ["6", 0],
                    "positive": ["7", 0],
                    "negative": ["8", 0],
                    "latent_image": ["9", 0],
                    "seed": seed1,
                    "steps": 8,
                    "cfg": 1,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "denoise": 1.0
                },
                "class_type": "KSampler"
            },
            "11": {  # Decode stage 1 latent
                "inputs": { "samples": ["10", 0], "vae": ["3", 0] },
                "class_type": "VAEDecode"
            },
            # ── Stage 2: Outfit Transfer ──────────────────────────────────────
            # Apply cloth transfer LoRA to base model
            "12": {
                "inputs": {
                    "model": ["1", 0],
                    "lora_name": lora_transfer_name,
                    "strength_model": 1.0
                },
                "class_type": "LoraLoaderModelOnly"
            },
            # Scale person image to ~1MP for consistent resolution
            "13": {
                "inputs": {
                    "image": ["5", 0],
                    "upscale_method": "lanczos",
                    "megapixels": 1.0,
                    "resolution_steps": 64
                },
                "class_type": "ImageScaleToTotalPixels"
            },
            # Get dimensions of scaled person image
            "14": {
                "inputs": { "image": ["13", 0] },
                "class_type": "GetImageSize"
            },
            # Encode stage 2 prompt: extracted outfit + scaled person + pose reference
            "15": {
                "inputs": {
                    "clip": ["2", 0],
                    "vae": ["3", 0],
                    "image1": ["11", 0],
                    "image2": ["13", 0],
                    "image3": ["21", 0],
                    "prompt": "Transfer the outfit."
                },
                "class_type": "TextEncodeQwenImageEditPlus"
            },
            "16": {  # Zero-out for stage 2
                "inputs": { "conditioning": ["15", 0] },
                "class_type": "ConditioningZeroOut"
            },
            "17": {  # Empty latent matching person image dimensions
                "inputs": {
                    "width": ["14", 0],
                    "height": ["14", 1],
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "18": {  # KSampler stage 2 (transfer outfit)
                "inputs": {
                    "model": ["12", 0],
                    "positive": ["15", 0],
                    "negative": ["16", 0],
                    "latent_image": ["17", 0],
                    "seed": seed2,
                    "steps": 8,
                    "cfg": 1,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "denoise": 1.0
                },
                "class_type": "KSampler"
            },
            "19": {  # Decode final result
                "inputs": { "samples": ["18", 0], "vae": ["3", 0] },
                "class_type": "VAEDecode"
            },
            "20": {  # Save final result
                "inputs": {
                    "images": ["19", 0],
                    "filename_prefix": f"try_on_{run_id}"
                },
                "class_type": "SaveImage"
            }
        }

        # Queue prompt
        async with httpx.AsyncClient(timeout=30.0, headers=comfyui_headers) as client:
            resp = await client.post(f"{comfyui_url}/prompt", json={"prompt": prompt})
            if resp.status_code != 200:
                raise Exception(f"Failed to queue prompt in ComfyUI: {resp.text}")
            prompt_id = resp.json()["prompt_id"]

        # Poll for completion
        history_data = None
        timeout_seconds = 900.0  # 15 minutes — Qwen 9GB model needs time to load on first run
        poll_interval = 3.0
        start_time = asyncio.get_event_loop().time()
        
        async with httpx.AsyncClient(timeout=30.0, headers=comfyui_headers) as client:
            while True:
                resp = await client.get(f"{comfyui_url}/history/{prompt_id}")
                if resp.status_code == 200:
                    history = resp.json()
                    if prompt_id in history:
                        history_data = history[prompt_id]
                        break
                
                if asyncio.get_event_loop().time() - start_time > timeout_seconds:
                    raise TimeoutError("Local virtual try-on execution timed out in ComfyUI.")
                
                await asyncio.sleep(poll_interval)

        # Retrieve output image filename
        outputs = history_data.get("outputs", {})
        save_node_output = outputs.get("20", {})  # Final try-on output node (SaveImage)
        images = save_node_output.get("images", [])
        if not images:
            raise Exception("No output images found in ComfyUI prompt history.")

        filename = images[0]["filename"]
        subfolder = images[0].get("subfolder", "")
        image_type = images[0].get("type", "output")

        # Download result
        async with httpx.AsyncClient(timeout=30.0, headers=comfyui_headers) as client:
            resp = await client.get(
                f"{comfyui_url}/view",
                params={"filename": filename, "subfolder": subfolder, "type": image_type}
            )
            if resp.status_code != 200:
                raise Exception(f"Failed to download generated image: {resp.text}")
            result_bytes = resp.content

        # Convert to base64 Data URL
        encoded = base64.b64encode(result_bytes).decode('utf-8')
        mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
        result_url = f"data:{mime};base64,{encoded}"

        return VisualizationResult(
            product_name=product_name,
            result_image=result_url,
            status="success",
            model="Local ComfyUI (IDM-VTON)",
            description=f"Generated virtual try-on locally using IDM-VTON model for product: {product_name}"
        )

    except Exception as e:
        return VisualizationResult(
            product_name=product_name,
            status="failed",
            error=f"Local ComfyUI Error: {str(e)}"
        )


async def generate_visualization_openai(
    customer_photo_base64: str,
    product_image_base64: str,
    product_name: str,
    industry: str
) -> VisualizationResult:
    """Generate try-on image using OpenAI GPT-4o to describe and DALL-E 3 to generate."""
    import json
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        return VisualizationResult(
            product_name=product_name,
            status="failed",
            error="OpenAI API Key not configured."
        )

    # Format base64 to ensure it has correct prefix if needed, or remove prefix for GPT-4o input
    def clean_base64(b64: str) -> str:
        if "," in b64:
            return b64.split(",", 1)[1]
        return b64

    cust_b64 = clean_base64(customer_photo_base64)
    prod_b64 = clean_base64(product_image_base64)

    # Step 1: Call GPT-4o to describe and generate a prompt for DALL-E 3
    gpt_prompt = (
        "You are an expert fashion stylist and AI image prompt generator.\n"
        "We want to perform a virtual try-on: dressing the customer in Image 1 (Customer Photo) with the exact garment shown in Image 2 (Garment Photo).\n\n"
        "Please analyze both images:\n"
        "1. Image 1 (Customer): Observe their gender, face details, hair style, skin tone, body pose, framing, and setting/background.\n"
        f"2. Image 2 (Garment): Observe the garment '{product_name}'. Analyze its exact category (e.g. Saree, Suit, Kurti, Top, Dress), colors, patterns, embroidery, silhouette, texture, and how it drapes.\n\n"
        "TASK: Write a single, highly detailed, descriptive image prompt for DALL-E 3 to generate a photorealistic image.\n"
        "The DALL-E 3 prompt must describe:\n"
        "- The EXACT same customer from Image 1 (same facial features, hair, skin tone, gender, pose) to maintain identity consistency.\n"
        "- The customer wearing the EXACT same garment from Image 2 (same design features, pattern, neckline, drape, embroidery, and colors).\n"
        "- The same pose, camera framing, and background setting as Image 1 to maintain continuity.\n\n"
        "IMPORTANT: Output ONLY the descriptive prompt text for DALL-E 3. Do not include any introductory or concluding text, no quotes, and no markdown."
    )

    if industry != 'fashion':
        gpt_prompt = (
            "You are an expert interior designer and AI image prompt generator.\n"
            f"We want to apply the tile pattern shown in Image 2 (Tile Pattern) into the room shown in Image 1 (Room Photo). Product: '{product_name}'.\n\n"
            "Write a single, highly detailed, descriptive prompt for DALL-E 3 to generate a photorealistic image showing the exact room from Image 1 but with its floor/walls replaced with the tile pattern from Image 2.\n"
            "Maintain the exact layout, perspective, furniture, and lighting of the room.\n"
            "IMPORTANT: Output ONLY the descriptive prompt text for DALL-E 3. Do not include any introductory or concluding text."
        )

    headers = {
        "Authorization": f"Bearer {openai_key}",
        "Content-Type": "application/json"
    }

    try:
        # Request to GPT-4o
        async with httpx.AsyncClient(timeout=60.0) as client:
            gpt_payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": gpt_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{cust_b64}"
                                }
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{prod_b64}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.2
            }
            
            resp = await client.post("https://api.openai.com/v1/chat/completions", json=gpt_payload, headers=headers)
            if resp.status_code != 200:
                return VisualizationResult(
                    product_name=product_name,
                    status="failed",
                    error=f"GPT-4o prompt generation failed (HTTP {resp.status_code}): {resp.text}"
                )
            
            gpt_data = resp.json()
            dalle_prompt = gpt_data["choices"][0]["message"]["content"].strip()
            # Clean up potential markdown formatting
            if dalle_prompt.startswith("```"):
                dalle_prompt = dalle_prompt.split("\n", 1)[1].rsplit("\n", 1)[0]
            dalle_prompt = dalle_prompt.strip('"').strip("'").strip()

            # Step 2: Call DALL-E 3 with the generated prompt
            dalle_payload = {
                "model": "dall-e-3",
                "prompt": dalle_prompt,
                "n": 1,
                "size": "1024x1024",
                "response_format": "b64_json"
            }

            resp_dalle = await client.post("https://api.openai.com/v1/images/generations", json=dalle_payload, headers=headers)
            if resp_dalle.status_code != 200:
                return VisualizationResult(
                    product_name=product_name,
                    status="failed",
                    error=f"DALL-E 3 generation failed (HTTP {resp_dalle.status_code}): {resp_dalle.text}"
                )

            dalle_data = resp_dalle.json()
            b64_output = dalle_data["data"][0]["b64_json"]
            
            return VisualizationResult(
                product_name=product_name,
                result_image=f"data:image/png;base64,{b64_output}",
                status="success",
                model="OpenAI GPT-4o + DALL-E 3",
                description=dalle_prompt
            )

    except Exception as e:
        return VisualizationResult(
            product_name=product_name,
            status="failed",
            error=f"OpenAI Try-On failed: {str(e)}"
        )


def generate_visualization_fallback_pil(
    customer_photo_base64: str,
    product_image_base64: str,
    product_name: str
) -> VisualizationResult:
    """Generate overlay visualization locally using PIL if AI APIs fail."""
    try:
        import io
        import base64
        from PIL import Image

        def b64_to_img(b64_str: str) -> Image.Image:
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            return Image.open(io.BytesIO(base64.b64decode(b64_str)))

        customer_img = b64_to_img(customer_photo_base64).convert("RGBA")
        product_img = b64_to_img(product_image_base64).convert("RGBA")

        # Resize product image to fit a reasonable portion of the customer photo
        target_width = int(customer_img.width * 0.45)
        aspect_ratio = product_img.height / product_img.width
        target_height = int(target_width * aspect_ratio)

        product_resized = product_img.resize((target_width, target_height), Image.Resampling.LANCZOS)

        # Place lower chest area (centered horizontally, 35% down vertically)
        x_offset = int((customer_img.width - target_width) / 2)
        y_offset = int(customer_img.height * 0.35)

        composite = Image.new("RGBA", customer_img.size)
        composite.paste(customer_img, (0, 0))
        composite.paste(product_resized, (x_offset, y_offset), product_resized)

        buf = io.BytesIO()
        composite.convert("RGB").save(buf, format="JPEG", quality=80)
        b64_result = base64.b64encode(buf.getvalue()).decode('utf-8')

        return VisualizationResult(
            product_name=product_name,
            result_image=f"data:image/jpeg;base64,{b64_result}",
            status="success",
            model="Local Overlay Fallback",
            description="AI API was unavailable. Generated a smart local preview overlay."
        )
    except Exception as e:
        return VisualizationResult(
            product_name=product_name,
            status="failed",
            error=f"Local fallback generation failed: {str(e)}"
        )


def resize_base64_image(b64_str: str, max_size: int = 512) -> str:
    """Resize base64 image down to max_size maintaining aspect ratio."""
    try:
        import io
        import base64
        from PIL import Image
        
        # Remove data url prefix if present
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
            
        img = Image.open(io.BytesIO(base64.b64decode(b64_str)))
        width, height = img.size
        if width > max_size or height > max_size:
            if width > height:
                height = int((height * max_size) / width)
                width = max_size
            else:
                width = int((width * max_size) / height)
                height = max_size
            img = img.resize((width, height), Image.Resampling.LANCZOS)
            
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error resizing base64 image: {e}")
        return b64_str


async def generate_visualization(
    customer_photo_base64: str,
    product_image_base64: str,
    product_name: str,
    industry: str
) -> VisualizationResult:
    """Generate an output image using OpenAI, ComfyUI, Gemini, or PIL local fallback."""
    
    # Try OpenAI if key is present
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key.strip() and not openai_key.startswith("your-"):
        res = await generate_visualization_openai(
            customer_photo_base64=customer_photo_base64,
            product_image_base64=product_image_base64,
            product_name=product_name,
            industry=industry
        )
        if res.status == "success":
            return res
        print(f"OpenAI Try-On failed (e.g. quota/invalid key): {res.error}. Falling back to other models...")

    # Try Local ComfyUI if configured
    use_local = os.getenv("USE_LOCAL_COMFYUI", "false").lower() == "true"
    if use_local:
        res = await generate_visualization_local(
            customer_photo_base64=customer_photo_base64,
            product_image_base64=product_image_base64,
            product_name=product_name,
            industry=industry
        )
        if res.status == "success":
            return res
        print(f"Local ComfyUI Try-On failed: {res.error}. Falling back to Google Gemini...")

    # Try Google AI Studio
    api_key = os.getenv('GOOGLE_API_KEY') or os.getenv('EMERGENT_LLM_KEY')
    if api_key and not any(k in api_key.lower() for k in ["your-google-api-key", "your-emergent-key"]):
        cust_resized = resize_base64_image(customer_photo_base64, 512)
        prod_resized = resize_base64_image(product_image_base64, 512)
        model_id = os.getenv('GEMINI_IMAGE_MODEL') or "gemini-3-pro-image-preview"

        if industry == 'fashion':
            prompt = (
                "HIGH-END VIRTUAL TRY-ON (PROFESSIONAL GARMENT DRAPING & FITTING)\n\n"
                "INPUTS:\n"
                "1) CUSTOMER image: A real person whose face, hair, posture, hands, and background MUST be fully preserved.\n"
                "2) PRODUCT image: A target garment (e.g. saree, dress, shirt) to drape onto the customer.\n\n"
                "DRAPING & FITTING INSTRUCTIONS:\n"
                "- Replace all of the customer's current clothing with the new garment from the PRODUCT image.\n"
                "- Do NOT simply overlap or slap the garment image on top. The garment must fold, curve, crease, and drape naturally around the customer's specific body shape, posture, and shoulders.\n"
                "- Match the lighting, highlights, and shadows of the customer's photo so that the garment looks like it was photographed in that exact scene.\n"
                "- Blend the necklines, sleeves, and borders seamlessly with the customer's skin and posture. Adjust the drape logically based on gender, body type, and pose.\n"
                "- Preserve 100% of the garment details from the PRODUCT image: colors, fabric texture, embroidery patterns, and border designs.\n"
                "- If the product is a saree, drape the pallu realistically over the customer's shoulder and wrap it around the torso, blending it under the suit/jacket if the customer wears one, or replacing the suit/jacket entirely if needed for a proper traditional fit.\n\n"
                "IMAGE QUALITY RULES:\n"
                "- Output MUST be a single photorealistic, high-resolution final image.\n"
                "- Keep the customer's exact face, facial features, skin tone, hair, hands, and scene background.\n"
                "- Absolutely no text, labels, watermarks, borders, or artifacts.\n"
                f"Garment Product Name: {product_name}."
            )
        else:
            prompt = (
                "Apply the tile/material pattern from the PRODUCT image into the ROOM image. "
                f"Product name: {product_name}. "
                "Keep perspective/layout/lighting consistent. Output ONE final image. No text."
            )

        def as_part_image(b64: str, mime: str = "image/jpeg"):
            return {"inlineData": {"mimeType": mime, "data": b64}}

        candidate_model_names = [
            "nano-banana-pro-preview",
            "gemini-3-pro-image-preview"
        ]

        last_error = None
        async with httpx.AsyncClient(timeout=90.0) as client:
            for m in candidate_model_names:
                try:
                    url = f"{GOOGLE_GENAI_BASE}/models/{m}:generateContent?key={api_key}"
                    body = {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [
                                    {"text": prompt},
                                    as_part_image(cust_resized),
                                    as_part_image(prod_resized),
                                ],
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.2,
                            "responseModalities": ["IMAGE"],
                        },
                        "safetySettings": [
                            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "BLOCK_NONE"}
                        ]
                    }

                    resp = await client.post(url, json=body)
                    data = resp.json()
                    print(f"[Gemini Debug] Model: {m}, Status: {resp.status_code}")
                    if resp.status_code != 200 or "error" in data:
                        print(f"[Gemini Debug] Error: {data}")
                    elif "candidates" not in data or len(data["candidates"]) == 0:
                        print(f"[Gemini Debug] Response JSON (No Candidates): {data}")
                    else:
                        cand = data["candidates"][0]
                        print(f"[Gemini Debug] Candidate structure: {cand.keys()}")
                        if "finishReason" in cand:
                            print(f"[Gemini Debug] Finish Reason: {cand['finishReason']}")
                        if "safetyRatings" in cand:
                            print(f"[Gemini Debug] Safety Ratings: {cand['safetyRatings']}")

                    if resp.status_code >= 400:
                        last_error = data.get("error", {}).get("message") or str(data)
                        continue

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
                                    model=f"Google AI Studio ({m})",
                                    description=None,
                                )
                    last_error = f"Model {m} returned no image candidate."
                except Exception as e:
                    last_error = str(e)
                    continue

        print(f"Google Gemini Try-On failed: {last_error}. Using PIL local composite fallback...")

    # Default fallback: PIL local overlay composite (always succeeds and allows local validation/kiosk operation)
    return generate_visualization_fallback_pil(
        customer_photo_base64=customer_photo_base64,
        product_image_base64=product_image_base64,
        product_name=product_name
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
            product_base64 = await download_product_image_as_base64(product_url)
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
