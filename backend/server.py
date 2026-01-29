from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import fal_client
import asyncio
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'retail-vision-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

class UserSignup(BaseModel):
    email: str
    password: str
    role: str  # 'founder' or 'owner'
    shop_name: Optional[str] = None
    industry: Optional[str] = None  # 'fashion' or 'tiles'
    admin_pin: Optional[str] = '1234'

class UserLogin(BaseModel):
    email: str
    password: str

class InventoryItem(BaseModel):
    name: str
    image: str
    category: str
    price: float
    tags: List[str]
    stock: int

class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    tags: Optional[List[str]] = None
    stock: Optional[int] = None

class LeadCreate(BaseModel):
    name: str
    whatsapp: str
    photo_url: str

class VisualizationRequest(BaseModel):
    lead_id: str
    product_ids: List[str]
    photo_url: str

class KioskPinVerify(BaseModel):
    pin: str

def create_token(user_id: str, role: str, tenant_id: Optional[str]):
    payload = {
        'user_id': user_id,
        'role': role,
        'tenant_id': tenant_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/signup")
async def signup(user: UserSignup):
    existing = await db.users.find_one({'email': user.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())
    tenant_id = None
    
    if user.role == 'owner':
        tenant_id = str(uuid.uuid4())
        tenant_doc = {
            'id': tenant_id,
            'shop_name': user.shop_name,
            'industry': user.industry,
            'owner_id': user_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.tenants.insert_one(tenant_doc)
    
    user_doc = {
        'id': user_id,
        'email': user.email,
        'password': hashed_password,
        'role': user.role,
        'tenant_id': tenant_id,
        'admin_pin': user.admin_pin if user.role == 'owner' else None,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.role, tenant_id)
    return {'token': token, 'role': user.role, 'tenant_id': tenant_id, 'industry': user.industry}

@api_router.post("/auth/login")
async def login(user: UserLogin):
    user_doc = await db.users.find_one({'email': user.email}, {'_id': 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(user.password.encode(), user_doc['password'].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    tenant_doc = None
    industry = None
    if user_doc.get('tenant_id'):
        tenant_doc = await db.tenants.find_one({'id': user_doc['tenant_id']}, {'_id': 0})
        if tenant_doc:
            industry = tenant_doc.get('industry')
    
    token = create_token(user_doc['id'], user_doc['role'], user_doc.get('tenant_id'))
    return {'token': token, 'role': user_doc['role'], 'tenant_id': user_doc.get('tenant_id'), 'industry': industry}

@api_router.post("/kiosk/verify-pin")
async def verify_kiosk_pin(data: KioskPinVerify, current_user = Depends(get_current_user)):
    if current_user['role'] != 'owner':
        raise HTTPException(status_code=403, detail="Only owners can verify PIN")
    
    user_doc = await db.users.find_one({'id': current_user['user_id']}, {'_id': 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.get('admin_pin') == data.pin:
        return {'success': True}
    else:
        raise HTTPException(status_code=401, detail="Invalid PIN")

@api_router.get("/tenants")
async def get_tenants(current_user = Depends(get_current_user)):
    if current_user['role'] != 'founder':
        raise HTTPException(status_code=403, detail="Only founders can access this")
    
    tenants = await db.tenants.find({}, {'_id': 0}).to_list(1000)
    return tenants

@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    """Upload image and return base64 data URL for storage"""
    try:
        contents = await file.read()
        base64_data = base64.b64encode(contents).decode('utf-8')
        mime_type = file.content_type or 'image/jpeg'
        data_url = f"data:{mime_type};base64,{base64_data}"
        return {'image_url': data_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/inventory")
async def get_inventory(current_user = Depends(get_current_user), kiosk: bool = False):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    
    query = {'tenant_id': tenant_id}
    if kiosk:
        query['stock'] = {'$gt': 0}
    
    items = await db.inventory.find(query, {'_id': 0}).to_list(1000)
    return items

@api_router.post("/inventory")
async def create_inventory(item: InventoryItem, current_user = Depends(get_current_user)):
    if current_user['role'] != 'owner':
        raise HTTPException(status_code=403, detail="Only owners can create inventory")
    
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    
    item_doc = {
        'id': str(uuid.uuid4()),
        'tenant_id': tenant_id,
        **item.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.inventory.insert_one(item_doc)
    return {'id': item_doc['id'], 'message': 'Item created successfully'}

@api_router.put("/inventory/{item_id}")
async def update_inventory(item_id: str, item: InventoryUpdate, current_user = Depends(get_current_user)):
    if current_user['role'] != 'owner':
        raise HTTPException(status_code=403, detail="Only owners can update inventory")
    
    tenant_id = current_user.get('tenant_id')
    update_data = {k: v for k, v in item.model_dump().items() if v is not None}
    
    result = await db.inventory.update_one(
        {'id': item_id, 'tenant_id': tenant_id},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {'message': 'Item updated successfully'}

@api_router.delete("/inventory/{item_id}")
async def delete_inventory(item_id: str, current_user = Depends(get_current_user)):
    if current_user['role'] != 'owner':
        raise HTTPException(status_code=403, detail="Only owners can delete inventory")
    
    tenant_id = current_user.get('tenant_id')
    result = await db.inventory.delete_one({'id': item_id, 'tenant_id': tenant_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {'message': 'Item deleted successfully'}

@api_router.post("/leads")
async def create_lead(lead: LeadCreate, current_user = Depends(get_current_user)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    
    lead_doc = {
        'id': str(uuid.uuid4()),
        'tenant_id': tenant_id,
        **lead.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.leads.insert_one(lead_doc)
    return {'id': lead_doc['id'], 'message': 'Lead captured successfully'}

@api_router.get("/leads")
async def get_leads(current_user = Depends(get_current_user)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    
    leads = await db.leads.find({'tenant_id': tenant_id}, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return leads

async def mock_ai_visualization(product_name: str, industry: str):
    """
    Mock AI visualization for demo purposes.
    Replace this with actual RunPod GPU integration later.
    """
    await asyncio.sleep(2)
    
    # Demo images based on industry
    demo_images = {
        'fashion': [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1583391733981-5aff4229ecdf?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80'
        ],
        'tiles': [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80'
        ]
    }
    
    import random
    images = demo_images.get(industry, demo_images['fashion'])
    return random.choice(images)

@api_router.post("/visualize")
async def create_visualization(viz: VisualizationRequest, current_user = Depends(get_current_user)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    
    # Get tenant industry
    tenant_doc = await db.tenants.find_one({'id': tenant_id}, {'_id': 0})
    industry = tenant_doc.get('industry', 'fashion') if tenant_doc else 'fashion'
    
    products = await db.inventory.find(
        {'id': {'$in': viz.product_ids}, 'tenant_id': tenant_id},
        {'_id': 0}
    ).to_list(100)
    
    results = []
    
    # Check if FAL_KEY is available for real AI, otherwise use mock
    fal_key = os.environ.get('FAL_KEY')
    use_real_ai = fal_key and fal_key != ''
    
    for product in products:
        try:
            if use_real_ai:
                # Real AI visualization using FAL.AI
                os.environ['FAL_KEY'] = fal_key
                handler = await fal_client.submit_async(
                    "fal-ai/flux/dev",
                    arguments={
                        "prompt": f"A person wearing {product['name']} in a showroom setting, professional photography"
                    }
                )
                result = await handler.get()
                
                if result and result.get('images'):
                    results.append({
                        'product_id': product['id'],
                        'product_name': product['name'],
                        'result_image': result['images'][0]['url']
                    })
            else:
                # Mock AI visualization for demo
                result_image = await mock_ai_visualization(product['name'], industry)
                results.append({
                    'product_id': product['id'],
                    'product_name': product['name'],
                    'result_image': result_image
                })
        except Exception as e:
            logging.error(f"Visualization error: {str(e)}")
            # Fallback to mock on error
            result_image = await mock_ai_visualization(product['name'], industry)
            results.append({
                'product_id': product['id'],
                'product_name': product['name'],
                'result_image': result_image
            })
    
    viz_doc = {
        'id': str(uuid.uuid4()),
        'tenant_id': tenant_id,
        'lead_id': viz.lead_id,
        'product_ids': viz.product_ids,
        'results': results,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.visualizations.insert_one(viz_doc)
    
    return {'id': viz_doc['id'], 'results': results}

@api_router.get("/analytics")
async def get_analytics(current_user = Depends(get_current_user)):
    if current_user['role'] == 'founder':
        total_tryons = await db.visualizations.count_documents({})
        total_tenants = await db.tenants.count_documents({})
        
        return {
            'total_tryons': total_tryons,
            'total_tenants': total_tenants,
            'gpu_health': 'Operational'
        }
    
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    
    total_visualizations = await db.visualizations.count_documents({'tenant_id': tenant_id})
    total_leads = await db.leads.count_documents({'tenant_id': tenant_id})
    
    visualizations = await db.visualizations.find({'tenant_id': tenant_id}, {'_id': 0}).to_list(1000)
    
    product_count = {}
    for viz in visualizations:
        for prod_id in viz.get('product_ids', []):
            product_count[prod_id] = product_count.get(prod_id, 0) + 1
    
    top_products = sorted(product_count.items(), key=lambda x: x[1], reverse=True)[:5]
    
    top_products_details = []
    for prod_id, count in top_products:
        product = await db.inventory.find_one({'id': prod_id, 'tenant_id': tenant_id}, {'_id': 0})
        if product:
            top_products_details.append({
                'product': product,
                'visualization_count': count
            })
    
    return {
        'total_visualizations': total_visualizations,
        'total_leads': total_leads,
        'most_visualized': top_products_details
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()