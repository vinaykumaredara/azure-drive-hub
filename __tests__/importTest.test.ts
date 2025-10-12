import { describe, it, expect } from 'vitest';

describe('Import Tests', () => {
  it('should be able to import CarCard with relative path', async () => {
    const module = await import('../src/components/CarCard');
    expect(module.CarCard).toBeDefined();
  });

  it('should be able to import CarCardModern with relative path', async () => {
    const module = await import('../src/components/CarCardModern');
    expect(module.CarCardModern).toBeDefined();
  });
});