# Retail-Vision AI - Product Requirements Document

## Overview
Retail-Vision AI is a multi-tenant SaaS platform for Saree and Tile showrooms, enabling AI-powered virtual try-on visualization.

## Technology Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Shadcn/UI

## Supabase Configuration
- **Project URL**: https://dnhcnqtimkyrxueuylnm.supabase.co
- **Storage Buckets**: 
  - `inventory-images` - Product images
  - `customer-uploads` - Customer photos for visualization

## Database Schema

### shops
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| owner_email | text | Shop owner email |
| shop_name | text | Shop name |
| industry | text | 'fashion' or 'tiles' |
| admin_pin | text | 4-digit PIN for kiosk exit |
| logo_url | text | Shop logo URL |
| brand_color | text | Shop brand color |
| subscription_status | text | 'trial', 'active', etc. |

### inventory
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| shop_id | uuid | FK to shops |
| name | text | Product name |
| category | text | Product category |
| price | numeric | Price in INR |
| stock_count | integer | Available stock |
| image_url | text | Product image URL |
| tags | text[] | Product tags/materials |
| created_at | timestamp | Creation date |

### leads
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| shop_id | uuid | FK to shops |
| customer_name | text | Customer name |
| whatsapp_number | text | WhatsApp number |
| created_at | timestamp | Creation date |

### visualizations
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| shop_id | uuid | FK to shops |
| lead_id | uuid | FK to leads |
| input_photo_url | text | Customer photo URL |
| result_photo_url | text | AI result URL |
| items_compared | uuid[] | List of product IDs |
| created_at | timestamp | Creation date |

## Implemented Features (P0)

### ✅ Landing Page
- Premium marketing page with hero section
- Feature highlights (AI Visualization, Kiosk Mode, Multi-Tenant)
- Stats section, testimonials, CTA

### ✅ Authentication (Supabase Auth)
- Email/Password signup with shop creation
- Industry selection (Fashion/Tiles)
- 4-digit Kiosk PIN configuration
- Login with session persistence

### ✅ Owner Dashboard
- **Shop Name Display**: Prominent gradient text with industry badge and status indicator
- **Inventory Management**: Full CRUD for products
  - Image upload to Supabase Storage
  - Category dropdown (industry-specific)
  - Price (₹), stock count, tags
- **Analytics Hub**: 
  - Visualizations over time chart
  - Most visualized products
  - Peak usage hours
- **Leads Table**: Customer contact list with WhatsApp links
- **Launch Kiosk** button

### ✅ Kiosk Mode
- Fullscreen locked-down mode
- Lead capture (Name, WhatsApp) → saves to `leads` table
- Camera capture OR photo upload → saves to `customer-uploads` bucket
- Product gallery with filters:
  - Price range slider
  - Category filter
  - Tags/Materials filter
  - Sort by name/price
- Select up to 3 products for visualization
- Hidden exit: 5-second long-press on logo + PIN verification
- QR code and WhatsApp share link on results

### ✅ AI Visualization (Nano Banana Integration)
- Backend endpoint `/api/visualize` using Emergent LLM Key
- Gemini Nano Banana model (`gemini-3-pro-image-preview`)
- Industry-specific prompts (Fashion: virtual try-on, Tiles: room visualization)
- Graceful fallback to product preview if AI fails

## Pending/Future Features

### P1 - Enhanced Features
- [ ] WhatsApp API integration for auto-messaging
- [ ] Email notifications for leads
- [ ] Founder God-View Dashboard

### P2 - Polish
- [ ] 43-inch vertical kiosk responsive optimization
- [ ] Dark theme variant
- [ ] RLS policies in Supabase for multi-tenant isolation

## File Structure
```
/app/frontend/
├── src/
│   ├── lib/
│   │   └── supabase.js    # Supabase client + API helpers
│   ├── store/
│   │   └── authStore.js   # Zustand auth state
│   ├── pages/
│   │   ├── Landing.js     # Marketing page
│   │   ├── Login.js       # Login form
│   │   ├── Signup.js      # Signup form
│   │   ├── Dashboard.js   # Owner dashboard
│   │   └── Kiosk.js       # Kiosk mode
│   └── App.js             # Routes
```

## Important Notes for Developers

1. **Supabase Email Confirmation**: By default, Supabase requires email confirmation. Users need to verify email before login works.

2. **Storage Buckets**: Ensure buckets `inventory-images` and `customer-uploads` exist and have public access policies.

3. **Row Level Security (RLS)**: Configure RLS policies in Supabase dashboard for data isolation between shops.

4. **Currency**: All prices are in INR (₹)

5. **AI Integration**: The visualization feature is MOCKED. Real implementation requires:
   - Supabase Edge Function
   - Emergent LLM Key for Nano Banana API
   - Proper prompt engineering

---
Last Updated: January 29, 2025

## Changelog

### Jan 29, 2025 - Major Rewrite Complete
- Complete rewrite from FastAPI+MongoDB to React+Supabase
- New modern dark theme with 3D animations
- New table structure in Supabase with proper schema
- Modern signup form with success animation
- Dashboard with shop name, industry badge, subscription status
- Fixed empty inventory state (shows "No Products Yet" instead of loading)
- Kiosk mode with customer photo upload to Supabase storage
- AI visualization integration with Nano Banana API
