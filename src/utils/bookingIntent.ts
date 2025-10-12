export interface BookingIntent {
  type: 'BOOK_CAR';
  carId: string;
  timestamp: number;
}

export const bookingIntentStorage = {
  save(intent: BookingIntent) {
    localStorage.setItem('pendingIntent', JSON.stringify(intent));
    console.debug('[BookingIntent] Saved', intent);
    window.dispatchEvent(new CustomEvent('bookingIntentSaved', { detail: intent }));
  },
  
  get(): BookingIntent | null {
    const raw = localStorage.getItem('pendingIntent');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  
  clear() {
    localStorage.removeItem('pendingIntent');
    console.debug('[BookingIntent] Cleared');
  },
  
  isExpired(intent: BookingIntent, maxAgeMs = 3600000): boolean {
    return Date.now() - intent.timestamp > maxAgeMs;
  }
};
