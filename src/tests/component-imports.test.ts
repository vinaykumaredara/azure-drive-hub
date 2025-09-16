import { describe, it, expect } from 'vitest';

describe('Component Imports', () => {
  it('should import all lazy components without errors', async () => {
    // This test verifies that all lazy components can be imported correctly
    const lazyComponents = await import('@/components/LazyComponents');
    
    // Check that all required components are exported
    expect(lazyComponents).toHaveProperty('LazyAdminCarManagement');
    expect(lazyComponents).toHaveProperty('LazyAdminBookingManagement');
    expect(lazyComponents).toHaveProperty('LazyAnalyticsDashboard');
    expect(lazyComponents).toHaveProperty('LazyPromoCodeManager');
    expect(lazyComponents).toHaveProperty('LazyMaintenanceScheduler');
    expect(lazyComponents).toHaveProperty('LazySystemSettings');
    expect(lazyComponents).toHaveProperty('LazySecurityCompliance');
    expect(lazyComponents).toHaveProperty('LazyPaymentGateway');
    expect(lazyComponents).toHaveProperty('LazyPromoCodeInput');
    expect(lazyComponents).toHaveProperty('LazyCarImageGallery');
    expect(lazyComponents).toHaveProperty('LazyLicenseUpload');
    expect(lazyComponents).toHaveProperty('LazyChatWidget');
    expect(lazyComponents).toHaveProperty('LazyComponentWrapper');
    
    // Verify that components are objects (lazy loaded components)
    expect(typeof lazyComponents.LazyAdminCarManagement).toBe('object');
    expect(typeof lazyComponents.LazyPaymentGateway).toBe('object');
    expect(typeof lazyComponents.LazyPromoCodeInput).toBe('object');
    expect(typeof lazyComponents.LazyCarImageGallery).toBe('object');
    expect(typeof lazyComponents.LazyLicenseUpload).toBe('object');
    expect(typeof lazyComponents.LazyChatWidget).toBe('object');
  });
});