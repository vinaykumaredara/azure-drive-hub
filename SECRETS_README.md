# Secrets Management for RP CARS

## 🚨 NEVER commit secrets to Git! 

### Current Secret Status
- ✅ All placeholder values are safe for demo
- ✅ No production secrets in codebase
- ✅ Ready for production secret injection

## How to Add Production Secrets

### 1. Supabase Edge Function Secrets
```bash
# Add secrets via Supabase CLI or Dashboard
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set RAZORPAY_SECRET_KEY=rzp_live_...
supabase secrets set OPENAI_API_KEY=sk-...
```

### 2. Frontend Environment Variables
Create `.env.local` (git-ignored):
```
# For local development only
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

### 3. Deployment (Vercel/Netlify)
Add environment variables in your hosting platform:
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_RAZORPAY_KEY_ID`

## Demo/Test Mode
- Current setup uses safe placeholder values
- Payment flows are mocked for development
- OCR uses client-side processing
- All features work without real API keys

## Security Checklist
- [ ] Never commit .env files
- [ ] Use test keys during development
- [ ] Rotate any exposed keys immediately
- [ ] Set up proper RLS policies in Supabase
- [ ] Use Supabase service role only in edge functions

## Get Production Keys
- **Stripe**: https://dashboard.stripe.com/apikeys
- **Razorpay**: https://dashboard.razorpay.com/app/keys
- **OpenAI**: https://platform.openai.com/api-keys