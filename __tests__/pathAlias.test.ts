import { describe, it, expect } from 'vitest';

// Test if path aliases are working
describe('Path Alias Resolution', () => {
  it('should be able to import components using path aliases', async () => {
    // Try importing CarCard using path alias
    const carCardModule = await import('@/components/CarCard');
    expect(carCardModule.CarCard).toBeDefined();
    
    // Try importing CarCardModern using path alias
    const carCardModernModule = await import('@/components/CarCardModern');
    expect(carCardModernModule.CarCardModern).toBeDefined();
  });
});