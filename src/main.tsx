import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyDeviceOptimizations } from './utils/deviceOptimizations';

// Apply device-specific optimizations
applyDeviceOptimizations();

console.log('🔍 main.tsx loaded');

// TEMPORARY: Unregister service workers for debugging production issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      registrations.forEach(registration => {
        registration.unregister().then(() => {
          console.log('🧹 Unregistered service worker for debugging');
        });
      });
    })
    .catch(() => {
      // Ignore errors during cleanup
    });
}

// Register service worker for caching and offline support
// Only register in production to avoid conflicts with HMR in development
// TEMPORARY: Commented out for debugging production issues
/*
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
*/

// Enhanced error handling for app mounting
function initializeApp() {
  try {
    console.log('🔍 initializeApp called');
    
    // Check for required environment variables in production
    if (import.meta.env.PROD) {
      console.log('🔍 Production environment detected');
      const requiredEnvVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_RAZORPAY_KEY_ID',
        'VITE_STRIPE_PUBLISHABLE_KEY'
      ];
      
      const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
      
      if (missingEnvVars.length > 0) {
        console.warn('⚠️ Missing environment variables:', missingEnvVars);
      } else {
        console.log('✅ All required environment variables are present');
      }
      
      // Log Supabase URL for debugging (without exposing the key)
      if (import.meta.env.VITE_SUPABASE_URL) {
        console.log(' Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      }
      
      // Additional debugging information
      console.log('🔍 Environment Debug Info:');
      console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
      console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
      console.log('  VITE_RAZORPAY_KEY_ID:', import.meta.env.VITE_RAZORPAY_KEY_ID ? 'SET' : 'MISSING');
      console.log('  VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING');
      console.log('  NODE_ENV:', import.meta.env.NODE_ENV);
      console.log('  PROD:', import.meta.env.PROD);
      console.log('  DEV:', import.meta.env.DEV);
    }

    // Skip service worker cleanup in production
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
          registrations.forEach(registration => {
            registration.unregister().then(() => {
              console.log('🧹 Cleaned up service worker for development');
            });
          });
        })
        .catch(() => {
          // Ignore errors during cleanup
        });
    }

    const rootElement = document.getElementById('root');
    console.log('🔍 Root element:', rootElement);
    if (!rootElement) {
      throw new Error('Root element not found in DOM');
    }

    // Clear any existing content
    rootElement.innerHTML = '';

    const root = createRoot(rootElement);
    console.log('🔍 Root created successfully');
    
    // Test render a simple component first
    try {
      console.log('🔍 Attempting to render App component');
      // Disable React Strict Mode in development to prevent double rendering issues
      if (import.meta.env.DEV) {
        root.render(<App />);
      } else {
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
      }
      console.log('✅ RP Cars app rendered successfully');
    } catch (renderError) {
      console.error('❌ Failed to render App component:', renderError);
      throw renderError;
    }

    console.log('✅ RP Cars app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize RP Cars app:', error);
    showFallbackUI(error);
  }
}

// Fallback UI for critical errors
function showFallbackUI(error: any) {
  console.log('🔍 showFallbackUI called with error:', error);
  const rootElement = document.getElementById('root') || document.body;
  rootElement.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    ">
      <div style="
        background: white;
        padding: 3rem;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 500px;
        width: 100%;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: #ef4444;
          border-radius: 50%;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
        ">⚠</div>
        <h1 style="
          color: #1f2937;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 600;
        ">RP Cars Loading Error</h1>
        <p style="
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.6;
        ">We're having trouble loading the application. This might be a temporary issue.</p>
        <div style="margin-bottom: 2rem;">
          <button onclick="window.location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            margin-right: 1rem;
            transition: background-color 0.2s;
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">🔄 Reload Page</button>
          <button onclick="console.clear(); window.location.href='/';" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: background-color 0.2s;
          " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">🏠 Go Home</button>
        </div>
        <details style="text-align: left; margin-top: 1rem;">
          <summary style="
            cursor: pointer;
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
          ">Technical Details</summary>
          <pre style="
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            color: #374151;
            overflow-x: auto;
            white-space: pre-wrap;
          ">${error?.message || 'Unknown error occurred'}</pre>
        </details>
      </div>
    </div>
  `;
}

// Initialize the app when DOM is ready
console.log('🔍 DOM ready state:', document.readyState);
if (document.readyState === 'loading') {
  console.log('🔍 Adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 DOMContentLoaded event fired');
    initializeApp();
  });
} else {
  console.log('🔍 DOM already ready, calling initializeApp immediately');
  initializeApp();
}