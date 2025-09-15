# 🚗 RP cars - Premium Car Rental Platform

A modern, full-stack car rental platform built with React, TypeScript, and Supabase. Features real-time booking, secure payments, admin dashboard, and WhatsApp integration.

## ✨ Features

### 🌟 **User Features**
- **Modern Car Catalog**: Browse cars with multi-image galleries and detailed specifications
- **Smart Booking System**: Duration validation with 12/24-hour minimum requirements
- **Secure Payments**: Razorpay (India) and Stripe (International) integration
- **Promo Code System**: Apply discount codes with real-time validation
- **WhatsApp Integration**: Direct communication with car rental service
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Real-time Updates**: Live inventory and booking status

### 🛠️ **Admin Features**
- **Comprehensive Dashboard**: Real-time analytics and metrics
- **Car Management**: Add, edit, delete vehicles with multi-image upload
- **Booking Management**: Track and manage all reservations
- **Promo Code Manager**: Create and manage discount campaigns
- **License Verification**: AI-assisted driver's license validation
- **User Management**: Customer account administration
- **Analytics**: Revenue tracking and performance insights

### 🔧 **Technical Features**
- **Real-time Sync**: Instant updates across all dashboards
- **Secure Authentication**: Row-level security with Supabase Auth
- **Payment Processing**: Dual gateway support for global transactions
- **Image Management**: Supabase storage with optimized delivery
- **Mobile-First**: Progressive Web App capabilities
- **Performance Optimized**: Lazy loading and code splitting
- **Type Safety**: Full TypeScript implementation

## 🏗️ Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.8.3, Vite 5.4.19
- **UI/UX**: Tailwind CSS, shadcn/ui, Framer Motion, Lottie
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Payments**: Razorpay, Stripe
- **Deployment**: Vercel (recommended), Netlify, AWS Amplify
- **Development**: ESLint, TypeScript, Vitest

## 🚀 Quick Start

### Development Setup
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd rp-cars

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Update .env with your configuration

# Start development server
npm run dev
```

### Quick Deployment
```bash
# Windows
./deploy-prep.bat

# Mac/Linux
./deploy-prep.sh
```

📖 **Complete Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🔧 Environment Variables

Create `.env` (development) or `.env.production` (production):

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment Gateways
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
VITE_WHATSAPP_NUMBER=8897072640
VITE_APP_URL=http://localhost:5173
```

## 💰 Hosting & Costs

### Recommended Production Setup
- **Domain**: $12-20/year (Namecheap, GoDaddy)
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Total**: ~$47/month

### Free Development Setup
- **Vercel Hobby**: Free
- **Supabase Free Tier**: Free (up to 50MB)
- **Domain**: Use .vercel.app subdomain

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: <200KB gzipped
- **Load Time**: <2s on 3G networks
- **Core Web Vitals**: Optimized for excellent UX
