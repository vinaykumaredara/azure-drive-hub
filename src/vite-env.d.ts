/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_RAZORPAY_KEY_ID?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  readonly VITE_WHATSAPP_NUMBER?: string
  readonly VITE_APP_URL?: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}