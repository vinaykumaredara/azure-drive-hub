# 🌐 RP cars - Deployment Guide

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Code Storage & Version Control](#code-storage--version-control)
3. [Domain Acquisition](#domain-acquisition)
4. [Deployment Options](#deployment-options)
5. [Environment Setup](#environment-setup)
6. [Build & Deploy Process](#build--deploy-process)
7. [Database Deployment](#database-deployment)
8. [Domain Configuration](#domain-configuration)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Cost Analysis](#cost-analysis)

---

## 🚗 Project Overview

**RP cars** is a modern car rental platform built with:

- **Frontend**: React 18.3.1 + TypeScript + Vite
- **UI Components**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Real-time APIs)
- **Payments**: Razorpay (India) + Stripe (International)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for car images
- **Animations**: Framer Motion + Lottie

---

## 💾 Code Storage & Version Control

### 📁 Current Project Structure
```
rp-cars/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   └── integrations/
├── public/
├── supabase/
│   └── migrations/
├── package.json
├── vite.config.ts
└── README.md
```

### 🔄 Git Repository Setup

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RP cars car rental platform"
   ```

2. **Create Remote Repository**:
   - **GitHub**: https://github.com (Recommended)
   - **GitLab**: https://gitlab.com
   - **Bitbucket**: https://bitbucket.org

3. **Connect Local to Remote**:
   ```bash
   git remote add origin https://github.com/yourusername/rp-cars.git
   git push -u origin main
   ```

4. **Branch Strategy**:
   ```bash
   # Development branch
   git checkout -b development
   
   # Feature branches
   git checkout -b feature/payment-integration
   git checkout -b feature/admin-dashboard
   
   # Production branch
   git checkout -b production
   ```

---

## 🌐 Domain Acquisition

### 🛒 Domain Purchase Options

#### **Recommended Domain Registrars:**

1. **Namecheap** - Most Cost-Effective
   - Domain: $8-15/year
   - Privacy Protection: Free
   - DNS Management: Free
   - Website: https://namecheap.com

2. **GoDaddy** - Most Popular
   - Domain: $12-20/year
   - Privacy Protection: $9.99/year
   - DNS Management: Free
   - Website: https://godaddy.com

3. **Google Domains** - Best Integration
   - Domain: $12-18/year
   - Privacy Protection: Free
   - DNS Management: Free
   - Website: https://domains.google

4. **Cloudflare** - Best Performance
   - Domain: At-cost pricing
   - Privacy Protection: Free
   - DNS Management: Free
   - CDN Included: Free
   - Website: https://cloudflare.com

#### **Domain Suggestions:**
- `rpcars.com`
- `rpcarrentals.com`
- `premiumcarrentals.in`
- `driveazure.co`
- `hubcarrentals.com`

### 📝 Domain Purchase Process

1. **Search for Available Domain**
2. **Add to Cart**
3. **Configure Settings**:
   - Enable Auto-Renewal
   - Add Privacy Protection
   - Add SSL Certificate (if available)
4. **Complete Purchase**
5. **Access DNS Management Panel**

---

## 🚀 Deployment Options

### 🏆 **Option 1: Vercel (Recommended)**

**Pros:**
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ Built-in CDN
- ✅ Excellent React/Vite support
- ✅ Environment variables support
- ✅ Custom domain support

**Pricing:**
- **Free**: Hobby projects (up to 3 team members)
- **Pro**: $20/month (commercial projects)

**Setup Process:**
1. Visit https://vercel.com
2. Sign up with GitHub account
3. Import your repository
4. Configure build settings
5. Deploy automatically

### 🥈 **Option 2: Netlify**

**Pros:**
- ✅ Free tier available
- ✅ Form handling
- ✅ Branch previews
- ✅ Built-in CI/CD

**Pricing:**
- **Free**: Personal projects
- **Pro**: $19/month

### 🥉 **Option 3: AWS Amplify**

**Pros:**
- ✅ AWS ecosystem integration
- ✅ Global CDN
- ✅ Custom domain with SSL

**Pricing:**
- **Build & Deploy**: $0.01 per build minute
- **Hosting**: $0.15 per GB served

### 🏗️ **Option 4: Traditional VPS**

**Providers:**
- DigitalOcean: $6/month
- Linode: $5/month
- Vultr: $6/month

**Pros:**
- ✅ Full control
- ✅ Can host multiple projects
- ❌ Requires server management

---

## ⚙️ Environment Setup

### 🔧 Environment Variables

Create `.env.production` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Payment Gateways
VITE_RAZORPAY_KEY_ID=rzp_live_your-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-key

# App Configuration
VITE_APP_URL=https://yourdomain.com
VITE_WHATSAPP_NUMBER=8897072640

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 🔒 Security Checklist

- [ ] Use production Supabase keys
- [ ] Enable RLS (Row Level Security) on all tables
- [ ] Use live payment gateway keys
- [ ] Enable HTTPS only
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting
- [ ] Enable audit logging

---

## 🏗️ Build & Deploy Process

### 📦 **Vercel Deployment** (Step-by-Step)

#### **Step 1: Prepare Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### **Step 2: Connect to Vercel**
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import from Git Repository
4. Select `rp-cars` repository
5. Configure project settings

#### **Step 3: Build Configuration**
```json
{
  "name": "rp-cars",
  "build": {
    "env": {
      "NODE_VERSION": "18"
    }
  },
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci"
}
```

#### **Step 4: Environment Variables**
Add in Vercel Dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_WHATSAPP_NUMBER`

#### **Step 5: Deploy**
```bash
# Automatic deployment on push to main
git push origin main
```

### 🔄 **Manual Build Process**

```bash
# Install dependencies
npm ci

# Run tests
npm run test

# Build for production
npm run build

# Preview build locally
npm run preview
```

---

## 🗄️ Database Deployment

### **Supabase Production Setup**

#### **Step 1: Upgrade to Pro Plan**
- Visit https://supabase.com/dashboard
- Upgrade project to Pro plan ($25/month)
- This enables custom domains and increased limits

#### **Step 2: Database Migration**
```sql
-- Run all migration files in order
-- Files are in supabase/migrations/

-- Key migrations include:
-- 1. Initial schema setup
-- 2. RLS policies
-- 3. Functions and triggers
-- 4. Promo code system
-- 5. Security enhancements
```

#### **Step 3: Production Data Setup**
1. **Admin User Creation**:
   ```sql
   UPDATE auth.users 
   SET is_admin = true 
   WHERE email = 'admin@yourdomain.com';
   ```

2. **Sample Car Data**:
   ```sql
   INSERT INTO cars (title, make, model, year, seats, fuel_type, transmission, price_per_day, status, location_city)
   VALUES 
   ('Premium SUV', 'Toyota', 'Fortuner', 2023, 7, 'diesel', 'automatic', 5500, 'active', 'Hyderabad'),
   ('Luxury Sedan', 'BMW', '3 Series', 2023, 5, 'petrol', 'automatic', 7500, 'active', 'Hyderabad');
   ```

3. **Promo Codes**:
   ```sql
   INSERT INTO promo_codes (code, discount_percent, active, valid_from, valid_to)
   VALUES 
   ('WELCOME20', 20, true, NOW(), NOW() + INTERVAL '30 days'),
   ('FIRST50', 50, true, NOW(), NOW() + INTERVAL '7 days');
   ```

#### **Step 4: Security Configuration**
- Enable RLS on all tables
- Configure API keys properly
- Set up database backups
- Enable audit logging

---

## 🔗 Domain Configuration

### **DNS Setup**

#### **For Vercel Hosting:**

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your domain: `yourdomain.com`
   - Add www subdomain: `www.yourdomain.com`

2. **Configure DNS Records**:
   ```
   Type: A
   Name: @
   Value: 76.76.19.61
   TTL: 3600

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

#### **SSL Certificate**:
- Vercel automatically provides SSL certificates
- Certificate auto-renewal is handled
- Force HTTPS redirect is enabled by default

### **Custom Domain Setup Example**:

If your domain is `rpcars.com`:

1. **Main Domain**: `rpcars.com` → Points to Vercel
2. **WWW Subdomain**: `www.rpcars.com` → Redirects to main
3. **Admin Subdomain** (Optional): `admin.rpcars.com` → Points to main with /admin

---

## 📊 Monitoring & Maintenance

### **Analytics Setup**

#### **Google Analytics 4**:
```typescript
// src/utils/analytics.ts
import { gtag } from 'ga-gtag';

export const trackEvent = (action: string, category: string, label?: string) => {
  gtag('event', action, {
    event_category: category,
    event_label: label,
  });
};

// Track car bookings
trackEvent('booking_completed', 'conversion', carId);
```

#### **Vercel Analytics**:
```bash
npm install @vercel/analytics
```

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

### **Error Monitoring**

#### **Sentry Integration**:
```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

### **Performance Monitoring**

1. **Core Web Vitals**:
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1

2. **Lighthouse Scores**:
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 90

### **Uptime Monitoring**

**UptimeRobot** (Free):
- Monitor main domain
- Check API endpoints
- Alert via email/SMS

**Setup URLs to Monitor**:
- `https://yourdomain.com`
- `https://yourdomain.com/api/health`
- `https://your-supabase-url.supabase.co`

---

## 🔧 Troubleshooting

### **Common Deployment Issues**

#### **Build Failures**:
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Common fixes:
npm ci --legacy-peer-deps
npm run build --verbose
```

#### **Environment Variable Issues**:
```bash
# Verify variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

# Check Vercel deployment logs
vercel logs <deployment-url>
```

#### **Domain Not Working**:
1. Check DNS propagation: https://dnschecker.org
2. Verify DNS records in registrar
3. Check Vercel domain configuration
4. Wait 24-48 hours for full propagation

#### **SSL Certificate Issues**:
1. Remove and re-add domain in Vercel
2. Check DNS CAA records
3. Contact Vercel support if needed

#### **Database Connection Issues**:
1. Verify Supabase URL and keys
2. Check RLS policies
3. Review API rate limits
4. Monitor Supabase dashboard

### **Performance Issues**:

1. **Slow Loading**:
   - Enable Vercel Analytics
   - Optimize images
   - Use code splitting
   - Enable compression

2. **High Database Usage**:
   - Review query performance
   - Add database indexes
   - Implement caching
   - Monitor Supabase metrics

---

## 💰 Cost Analysis

### **Monthly Cost Breakdown**

#### **Basic Setup (Recommended)**:
```
Domain Registration:     $1-2/month
Vercel Pro:             $20/month
Supabase Pro:           $25/month
------------------------
Total:                  $46-47/month
```

#### **Advanced Setup**:
```
Domain + Security:      $5/month
Vercel Pro:            $20/month
Supabase Pro:          $25/month
CDN (Cloudflare):      $20/month
Analytics (Optional):   $10/month
Monitoring:            $10/month
------------------------
Total:                 $90/month
```

#### **Enterprise Setup**:
```
Premium Domain:        $10/month
Vercel Enterprise:     $150/month
Supabase Team:         $99/month
Advanced Security:     $50/month
Premium Monitoring:    $30/month
------------------------
Total:                 $339/month
```

### **Free Tier Options** (Development/Testing):
```
Domain (.tk/.ml):      Free
Vercel Hobby:          Free
Supabase Free:         Free
Netlify Free:          Free
Cloudflare Free:       Free
------------------------
Total:                 Free
```

---

## 🚀 Go-Live Checklist

### **Pre-Launch** ✅
- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] Payment gateways tested
- [ ] Domain purchased and configured
- [ ] SSL certificate active
- [ ] Analytics setup
- [ ] Error monitoring configured
- [ ] Backup strategy implemented

### **Launch Day** 🎉
- [ ] Deploy to production
- [ ] Verify all features working
- [ ] Test payment flows
- [ ] Check email notifications
- [ ] Monitor error rates
- [ ] Verify domain accessibility
- [ ] Test mobile responsiveness
- [ ] Check WhatsApp integration

### **Post-Launch** 📈
- [ ] Monitor performance metrics
- [ ] Track user analytics
- [ ] Review error logs
- [ ] Customer feedback collection
- [ ] SEO optimization
- [ ] Marketing integration
- [ ] Regular backups verification
- [ ] Security audits

---

## 📞 Support & Resources

### **Platform Support**:
- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **Domain Registrar**: Check your provider's support

### **Documentation**:
- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### **Community**:
- **GitHub Issues**: Create issues in your repository
- **Discord**: Join Supabase and Vercel communities
- **Stack Overflow**: Tag questions appropriately

---

## 🎯 Next Steps

After successful deployment:

1. **Marketing**:
   - Set up Google Ads
   - Social media presence
   - SEO optimization
   - Local business listings

2. **Features**:
   - Mobile app development
   - Advanced analytics
   - Customer loyalty program
   - Fleet management tools

3. **Scaling**:
   - Database optimization
   - CDN implementation
   - Load balancing
   - Multi-region deployment

---

**🎉 Congratulations!** Your RP cars car rental platform is now ready for the world!

For additional support or questions, refer to the documentation links above or create an issue in your repository.

---

*Last Updated: December 2024*
*Version: 1.0.0*