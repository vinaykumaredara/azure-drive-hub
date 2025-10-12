// Unified booking intent manager with mutex to prevent race conditions

interface PendingIntent {
  type: 'BOOK_CAR';
  carId: string;
  timestamp: number;
}

class BookingIntentManager {
  private isProcessing = false;
  private processingLock: Promise<void> | null = null;
  private readonly KEY = 'pendingIntent_v2';
  private readonly LEGACY_KEY = 'pendingBooking';
  
  async saveIntent(carId: string): Promise<void> {
    const intent: PendingIntent = {
      type: 'BOOK_CAR',
      carId,
      timestamp: Date.now()
    };
    
    // Save to BOTH localStorage (primary) and sessionStorage (fallback)
    localStorage.setItem(this.KEY, JSON.stringify(intent));
    sessionStorage.setItem(this.LEGACY_KEY, JSON.stringify({
      carId,
      pickup: { date: '', time: '' },
      return: { date: '', time: '' },
      addons: {},
      totals: { subtotal: 0, serviceCharge: 0, total: 0 }
    }));
    
    console.debug('[IntentManager] Saved intent', intent);
    window.dispatchEvent(new CustomEvent('bookingIntentSaved', { detail: intent }));
  }
  
  getIntent(): PendingIntent | null {
    // Try localStorage first
    const localIntent = localStorage.getItem(this.KEY);
    if (localIntent) {
      try {
        return JSON.parse(localIntent);
      } catch { /* ignore */ }
    }
    
    // Fallback to sessionStorage
    const sessionIntent = sessionStorage.getItem(this.LEGACY_KEY);
    if (sessionIntent) {
      try {
        const draft = JSON.parse(sessionIntent);
        return {
          type: 'BOOK_CAR',
          carId: draft.carId,
          timestamp: Date.now()
        };
      } catch { /* ignore */ }
    }
    
    return null;
  }
  
  clearIntent(): void {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem('pendingIntent');  // old key
    sessionStorage.removeItem(this.LEGACY_KEY);
    sessionStorage.removeItem('redirectToProfileAfterLogin');
    console.debug('[IntentManager] Cleared all intents');
  }
  
  async acquireLock(): Promise<() => void> {
    // Wait for any existing processing to complete
    if (this.processingLock) {
      await this.processingLock;
    }
    
    // Create new lock
    let releaseLock: () => void;
    this.processingLock = new Promise(resolve => {
      releaseLock = () => {
        this.isProcessing = false;
        this.processingLock = null;
        resolve();
      };
    });
    
    this.isProcessing = true;
    return releaseLock!;
  }
  
  isLocked(): boolean {
    return this.isProcessing;
  }
  
  isExpired(intent: PendingIntent | null): boolean {
    if (!intent) return true;
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - intent.timestamp > MAX_AGE;
  }
}

export const bookingIntentManager = new BookingIntentManager();
