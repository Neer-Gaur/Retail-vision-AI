# RunPod GPU Integration Guide

## Current Setup (Demo Mode)

The application currently uses a **mock visualization service** for demo purposes. This simulates AI-generated results using placeholder images without requiring any API key.

### Mock Implementation Location
- **File**: `/app/backend/server.py`
- **Function**: `mock_ai_visualization()`
- **Endpoint**: `/api/visualize`

## Switching to RunPod GPU

When you're ready to connect your custom GPU in RunPod, follow these steps:

### Step 1: Deploy Your Model on RunPod

1. Create a RunPod serverless endpoint with your AI model
2. Configure your model to accept:
   - `prompt`: Text description
   - `image` (optional): Base64 or URL of user photo
3. Ensure the endpoint returns an image URL or base64 string

### Step 2: Update Backend Code

Replace the visualization endpoint in `/app/backend/server.py`:

```python
import httpx

async def runpod_visualization(product_name: str, user_photo_url: str, industry: str):
    """
    Connect to your RunPod GPU endpoint
    """
    runpod_endpoint = os.environ.get('RUNPOD_ENDPOINT')
    runpod_api_key = os.environ.get('RUNPOD_API_KEY')
    
    # Customize prompt based on industry
    if industry == 'fashion':
        prompt = f"Professional photo of a person wearing {product_name}, full body shot, showroom lighting"
    else:  # tiles
        prompt = f"Interior design visualization showing {product_name} installed on floor/wall, architectural photography"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            runpod_endpoint,
            headers={
                'Authorization': f'Bearer {runpod_api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'prompt': prompt,
                'image': user_photo_url,
                # Add any other parameters your model needs
            },
            timeout=60.0
        )
        
        result = response.json()
        return result['output']['image_url']  # Adjust based on your response structure

@api_router.post("/visualize")
async def create_visualization(viz: VisualizationRequest, current_user = Depends(get_current_user)):
    # ... existing validation code ...
    
    for product in products:
        try:
            result_image = await runpod_visualization(
                product['name'],
                viz.photo_url,
                industry
            )
            results.append({
                'product_id': product['id'],
                'product_name': product['name'],
                'result_image': result_image
            })
        except Exception as e:
            logging.error(f"RunPod visualization error: {str(e)}")
            # Fallback to mock if RunPod fails
            result_image = await mock_ai_visualization(product['name'], industry)
            results.append({
                'product_id': product['id'],
                'product_name': product['name'],
                'result_image': result_image
            })
    
    # ... rest of the code ...
```

### Step 3: Add Environment Variables

Update `/app/backend/.env`:

```
RUNPOD_ENDPOINT="https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run"
RUNPOD_API_KEY="your-runpod-api-key"
```

### Step 4: Install Additional Dependencies (if needed)

```bash
cd /app/backend
pip install httpx
pip freeze > requirements.txt
```

### Step 5: Restart Backend

```bash
sudo supervisorctl restart backend
```

## Alternative: Using FAL.AI

If you want to use FAL.AI instead of RunPod:

1. Get your API key from https://fal.ai/dashboard/keys
2. Add to `/app/backend/.env`:
   ```
   FAL_KEY="your-fal-api-key"
   ```
3. Restart backend: `sudo supervisorctl restart backend`

The code automatically detects the FAL_KEY and switches from mock to real AI.

## Testing

After integration, test the visualization flow:

1. Login as shop owner
2. Click "Launch Kiosk"
3. Complete the customer journey
4. Verify AI-generated results are returned

## Architecture Notes

- All AI logic is centralized in the `/api/visualize` endpoint
- Frontend remains unchanged (calls same API)
- Tenant isolation is maintained (tenant_id in all queries)
- Results are stored in MongoDB for analytics

## Performance Considerations

- RunPod cold starts: First request may be slower
- Consider implementing result caching
- Monitor GPU usage in RunPod dashboard
- Set appropriate timeout values (currently 60s)
