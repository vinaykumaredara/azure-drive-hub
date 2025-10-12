// Comprehensive debugging utilities for booking flow

export const bookingDebugger = {
  logButtonClick(carId: string, user: any, profile: any) {
    console.group('📘 Book Now Clicked');
    console.log('Car ID:', carId);
    console.log('User:', user ? '✅ Logged in' : '❌ Not logged in');
    console.log('Profile:', profile ? '✅ Loaded' : '❌ Not loaded');
    console.log('Phone:', profile?.phone || 'None');
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  },
  
  logModalOpen(carId: string) {
    console.log('✅ Booking modal opened for car:', carId);
  },
  
  logModalClose() {
    console.log('❌ Booking modal closed');
  },
  
  logIntentSaved(carId: string) {
    console.log('💾 Booking intent saved for car:', carId);
  },
  
  logIntentResumed(carId: string) {
    console.log('♻️ Booking intent resumed for car:', carId);
  },
  
  logError(context: string, error: any) {
    console.group('🔴 Booking Error');
    console.error('Context:', context);
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    console.groupEnd();
  }
};
