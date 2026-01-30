# Retail-Vision AI - Virtual Try-On SaaS Platform

## 🎯 Overview

**Retail-Vision AI** is a cutting-edge SaaS platform designed for Saree and Tile showrooms, enabling customers to virtually try on products using AI-powered visualization. The platform features a dual interface: an **Owner Dashboard** for business management and a **Kiosk Mode** for in-store customer engagement.

Built with modern technologies, this application seamlessly integrates AI image generation, real-time data management, and an intuitive user experience to revolutionize retail visualization.

---

## 🚀 Key Features

### 1. **Owner Dashboard**
Complete business management interface with:
- **Shop Management**: Configure shop details, industry type, and admin PIN
- **Inventory Management**: Full CRUD operations for products with image uploads
- **Analytics Dashboard**: Visualizations over time, most-viewed products, peak usage hours
- **Leads Management**: Track customer contacts with WhatsApp integration
- **Trial & Subscription**: 3-product trial, upgrade path for unlimited products

### 2. **Kiosk Mode**
Customer-facing fullscreen interface with:
- **Lead Capture**: Collect customer name and WhatsApp number
- **Photo Upload**: Camera or file upload for customer photos
- **Product Gallery**: Browse inventory with filters (price, category, tags)
- **AI Visualization**: Generate realistic try-on images using Google Gemini
- **Smart Fallback**: Client-side preview when AI is unavailable
- **Social Sharing**: QR code and WhatsApp sharing for results

### 3. **AI-Powered Visualization**
Three-tier approach for reliability:
1. **Google Gemini 3 Pro Image Preview** (Primary) - High-quality AI generation
2. **Emergent LLM Key Fallback** (Secondary) - Backup AI service
3. **Client-Side Preview** (Tertiary) - Instant composite generation (FREE, always works)

### 4. **Multi-Industry Support**
- **Fashion**: Sarees, Suits, Lehengas, Dresses, Jeans, Tops, etc.
- **Tiles**: Floor, Wall, Bathroom, Kitchen, Outdoor, Marble, Granite, etc.

---

## 🏗️ Technology Stack

### **Frontend**
- **React 19** - Latest React with modern hooks
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Shadcn UI** - Beautiful component library
- **Zustand** - Lightweight state management
- **React Query** - Data fetching and caching
- **Supabase Client** - Real-time database and auth
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

### **Backend**
- **FastAPI** - High-performance Python API
- **Python 3.11+** - Modern Python features
- **Emergent Integrations** - LLM integration library
- **Google Gemini API** - AI image generation
- **Requests** - HTTP client for image processing
- **CORS Middleware** - Cross-origin support
- **dotenv** - Environment variable management

### **Database & Storage**
- **Supabase (PostgreSQL)** - Main database
- **Supabase Storage** - File storage with buckets:
  - `customer-uploads` - User photos
  - `inventory-images` - Product images
  - `visualized_uploads` - AI-generated results

### **Infrastructure**
- **Supervisor** - Process management
- **Nginx** - Reverse proxy
- **MongoDB** - Legacy support (optional)

---

## 📊 Database Schema

### **shops**
```sql
- id (uuid, primary key)
- owner_email (text, unique)
- shop_name (text)
- industry (text) - 'fashion' or 'tiles'
- admin_pin (text)
- subscription_status (text) - 'trial' or 'active'
- created_at (timestamp)
```

### **inventory**
```sql
- id (uuid, primary key)
- shop_id (uuid, foreign key)
- name (text)
- category (text)
- price (numeric)
- stock_count (integer)
- tags (text[])
- image_url (text)
- created_at (timestamp)
```

### **leads**
```sql
- id (uuid, primary key)
- shop_id (uuid, foreign key)
- customer_name (text)
- whatsapp_number (text)
- created_at (timestamp)
```

### **visualizations**
```sql
- id (uuid, primary key)
- shop_id (uuid, foreign key)
- lead_id (uuid, foreign key)
- input_photo_url (text) - Customer photo
- result_photo_url (text) - AI visualization
- items_compared (uuid[]) - Product IDs
- created_at (timestamp)
```

---

## 🎨 User Flow

### **Owner Flow**

```
1. Sign Up / Login
   ↓
2. Configure Shop (Name, Industry, PIN)
   ↓
3. Dashboard Home
   - View stats (products, leads, visualizations)
   - Quick actions (Add Product, Launch Kiosk, View Analytics)
   ↓
4. Manage Inventory
   - Add products with images
   - Edit/Delete products
   - Organize by categories and tags
   ↓
5. View Analytics
   - Visualizations over time
   - Most viewed products
   - Peak usage hours
   ↓
6. Manage Leads
   - View customer contacts
   - WhatsApp integration
   - Track engagement
   ↓
7. Launch Kiosk Mode
   - Long-press logo + enter PIN
   - Hands-free customer experience
```

### **Customer Flow (Kiosk Mode)**

```
1. Welcome Screen
   - Shop branding
   ↓
2. Lead Capture
   - Enter name
   - Enter WhatsApp number
   ↓
3. Photo Upload
   - Camera capture or
   - Upload from device
   ↓
4. Product Gallery
   - Browse inventory
   - Apply filters (price, category)
   - Search products
   ↓
5. Select Product
   - Click to select (one at a time)
   - View product details
   ↓
6. Visualize
   - Click "Visualize Now"
   - Customer photo shows instantly (left)
   - AI processing in background
   ↓
7. Results Screen (Futuristic Mirror UI)
   - Original photo (left, blue frame)
   - AI visualization (right, violet frame with effects)
   - Product info below (name, price, category)
   ↓
8. Share or Try Another
   - Share to WhatsApp (QR code)
   - Try Another Item (keeps photo, selects new product)
   - Exit Session (clears all data, returns to welcome)
```

---

## 🔧 Setup Instructions

### **Prerequisites**
- Node.js 18+ and Yarn
- Python 3.11+
- Supabase account and project
- Google AI Studio API key (optional, for AI features)

### **1. Clone Repository**
```bash
git clone <repository-url>
cd retail-vision-ai
```

### **2. Supabase Setup**

**Create Tables:**
Run the following SQL in Supabase SQL Editor:

```sql
-- shops table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT UNIQUE NOT NULL,
  shop_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  admin_pin TEXT DEFAULT '1234',
  subscription_status TEXT DEFAULT 'trial',
  created_at TIMESTAMP DEFAULT NOW()
);

-- inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock_count INTEGER DEFAULT 0,
  tags TEXT[],
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- visualizations table
CREATE TABLE visualizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  input_photo_url TEXT,
  result_photo_url TEXT,
  items_compared UUID[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Create Storage Buckets:**
1. Go to Storage in Supabase
2. Create three PUBLIC buckets:
   - `customer-uploads`
   - `inventory-images`
   - `visualized_uploads`
3. Set policies for each bucket:
   - Allow public SELECT (read)
   - Allow authenticated INSERT (upload)

**Row Level Security (RLS):**
Enable RLS and add policies as needed for your use case.

### **3. Environment Variables**

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `/app/backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_db"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=your-emergent-key-here
GOOGLE_API_KEY=your-google-api-key-here
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
```

Edit `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Get Supabase credentials:**
1. Go to Supabase Project Settings → API
2. Copy Project URL and anon/public key
3. Update frontend `.env` file

**Get Google API Key (Optional):**
1. Visit: https://aistudio.google.com/apikey
2. Create API key
3. Add to backend `.env` as `GOOGLE_API_KEY`

### **4. Install Dependencies**

**Backend:**
```bash
cd /app/backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd /app/frontend
yarn install
```

### **5. Start Services**

**Using Supervisor (Recommended):**
```bash
sudo supervisorctl restart all
sudo supervisorctl status
```

**Manual (Development):**

Terminal 1 - Backend:
```bash
cd /app/backend
python server.py
```

Terminal 2 - Frontend:
```bash
cd /app/frontend
yarn start
```

### **6. Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

---

## 🎯 Key Integrations

### **1. Google Gemini Image Generation**
- Model: `gemini-3-pro-image-preview`
- Purpose: High-quality AI visualizations
- Fallback: Emergent LLM Key → Client-side preview
- Free tier: 1,500 requests/day

### **2. Supabase**
- Authentication: Email/Password
- Database: PostgreSQL with real-time subscriptions
- Storage: Image uploads with public URLs
- RLS: Row-level security for data protection

### **3. Emergent Integrations**
- Custom library for LLM integrations
- Supports: OpenAI, Anthropic, Google Gemini
- Installation: `pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`

---

## 📱 API Endpoints

### **Health Check**
```http
GET /api/health
```
Response:
```json
{
  "status": "healthy",
  "service": "Retail-Vision AI API"
}
```

### **AI Visualization**
```http
POST /api/visualize
```
Request Body:
```json
{
  "customer_photo_url": "https://...",
  "product_image_urls": ["https://..."],
  "product_names": ["Product Name"],
  "industry": "fashion"
}
```
Response:
```json
{
  "results": [{
    "product": "Product Name",
    "result_image": "data:image/jpeg;base64,...",
    "status": "success",
    "model": "Google Gemini",
    "description": "Generated visualization..."
  }]
}
```

---

## 🎨 UI Components

### **Futuristic Mirror (Results Screen)**
- **Original Photo Card**: Blue-themed frame with customer photo
- **Visualization Card**: Violet-themed frame with:
  - Corner decorations
  - Scanning animation
  - Holographic overlay
  - Grid pattern
  - Shimmer effect
  - Status badge (AI/Preview)
- **Product Info Card**: Separate card below with name, price, category
- **Actions**: QR code, WhatsApp share, Try Another Item

### **Color Scheme**
- **Primary**: Violet (#8b5cf6), Fuchsia, Purple
- **Accents**: Blue (original photo), Green (success), Orange (preview)
- **Backgrounds**: Slate-900, Slate-800 (dark theme for kiosk)
- **Text**: White, Slate-300 (for dark backgrounds)

---

## 🔐 Security Features

### **Authentication**
- Supabase Auth with email/password
- Session management with Zustand
- Protected routes with PrivateRoute component
- Automatic session refresh

### **Kiosk Security**
- Admin exit: Long-press logo (5 seconds) + PIN entry
- Customer exit: Red "Exit Session" button (top-right)
- Session isolation: Each customer session is separate
- Data clearing: Exit clears all customer data

### **Data Protection**
- Row Level Security (RLS) in Supabase
- Owner can only access their shop data
- API keys stored in environment variables
- Server-side only (not exposed to frontend)

---

## 📈 Monitoring & Analytics

### **Dashboard Metrics**
- Total products in inventory
- Total leads captured
- Total visualizations generated
- Products in stock

### **Analytics Charts**
- Visualizations over time (7-day chart)
- Most visualized products (bar chart)
- Peak usage hours (heat map)
- Conversion rates

### **Usage Tracking**
- Google Cloud Console for API usage
- Supabase Dashboard for database metrics
- Browser DevTools for frontend debugging

---

## 🐛 Troubleshooting

### **Shop Data Not Loading**
```bash
# Check browser console for:
"Fetching shop for email: your-email"
"Shop loaded: {shop_object}"

# If null:
1. Verify Supabase connection
2. Check shops table has matching owner_email
3. Clear browser cache and refresh
4. Call refreshShop() manually
```

### **Inventory Stuck Loading**
```bash
# Check console for errors
# Verify shop.id is available
# Check Supabase RLS policies
# Ensure inventory table has shop_id column
```

### **AI Visualization Failing**
```bash
# Check API keys in backend/.env
# Verify Google API quota not exceeded
# Check backend logs: tail -f /var/log/supervisor/backend.*.log
# Fallback to preview mode should work
```

### **Image Upload Failing**
```bash
# Check Supabase Storage policies
# Verify bucket is PUBLIC
# Check authenticated user can INSERT
# Verify file size < 50MB
```

---

## 🚀 Deployment

### **Production Checklist**
- [ ] Update Supabase URLs to production
- [ ] Configure production API keys
- [ ] Set up custom domain
- [ ] Enable Supabase RLS policies
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure environment variables
- [ ] Test all features end-to-end
- [ ] Set up monitoring and alerts
- [ ] Backup database regularly

### **Recommended Hosting**
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Backend**: AWS EC2, DigitalOcean, or Railway
- **Database**: Supabase (managed)
- **Storage**: Supabase Storage (managed)

---

## 📝 Development Notes

### **Code Structure**
```
/app
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities (Supabase client)
│   │   ├── store/        # Zustand state management
│   │   └── App.js        # Root component
│   ├── package.json      # Node dependencies
│   └── .env              # Environment variables
└── README.md             # This file
```

### **Best Practices**
- Use `refreshShop()` to ensure shop data is loaded
- Add console logs for debugging data flow
- Use toast notifications for user feedback
- Implement loading states for all async operations
- Handle errors gracefully with fallbacks
- Test with actual images (URLs, not base64 in code)

### **Known Issues**
- React hook dependency warnings (cosmetic, doesn't affect functionality)
- Preview mode is lower quality than AI (expected)
- Large images may take time to process (optimize before upload)

---

## 🎓 Learning Resources

### **Technologies Used**
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase Docs](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Framer Motion](https://www.framer.com/motion/)

### **AI Image Generation**
- Emergent Integrations Library (pre-installed)
- Google AI Studio: https://aistudio.google.com
- Gemini models: https://ai.google.dev/models/gemini

---

## 📄 License

This project was built using Emergent Agent. Please refer to your Emergent subscription terms for usage rights.

---

## 🤝 Contributing

This is a custom SaaS application. If you're an Emergent user continuing this project:

1. Read through this README completely
2. Verify all environment variables are set
3. Test the basic flow (signup → add product → kiosk mode)
4. Check browser console for any errors
5. Review the PRD in `/app/memory/PRD.md`

---

## 📞 Support

For Emergent Agent support:
- Use the support_agent in the Emergent chat
- Check documentation at your Emergent dashboard
- Review system logs: `/var/log/supervisor/*.log`

---

## ✨ Credits

Built with ❤️ using:
- Emergent Agent (AI-powered development)
- Modern web technologies
- Google Gemini AI
- Supabase platform

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Industry**: Retail SaaS / Fashion Tech
