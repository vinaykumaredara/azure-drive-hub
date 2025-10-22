import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyDeviceOptimizations } from './utils/deviceOptimizations';
import { trackPerformance } from './utils/performanceMonitor';

// Apply device-specific optimizations
applyDeviceOptimizations();

// Track performance metrics (only in production)
if (import.meta.env.PROD) {
  trackPerformance();
}

// Register service worker for caching and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_COMPLETE') {
            console.log('✅ Background sync completed');
          }
        });

        // Request sync when online (fallback for browsers without Background Sync)
        if (import.meta.env.PROD) {
          window.addEventListener('online', () => {
            if (registration.active) {
              registration.active.postMessage({ type: 'SYNC_OUTBOX' });
            }
          });
        }
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Enhanced error handling for app mounting
function initializeApp() {
  try {
    // Skip service worker cleanup in production
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister().then(() => {
            console.log('🧹 Cleaned up service worker for development');
          });
        });
      }).catch(() => {
        // Ignore errors during cleanup
      });
    }

    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found in DOM');
    }

    // Clear any existing content
    rootElement.innerHTML = '';

    const root = createRoot(rootElement);
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

    console.log('✅ RP Cars app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize RP Cars app:', error);
    showFallbackUI(error);
  }
}

// Fallback UI for critical errors
function showFallbackUI(error: any) {
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}