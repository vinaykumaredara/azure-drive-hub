// src/__tests__/components/ui/data-display/StatusBadge.test.tsx
import React from 'react';
import StatusBadge from '@/components/ui/data-display/StatusBadge';

// Simple test to verify the component can be imported
console.log('StatusBadge import test');

// Verify that StatusBadge is properly exported
const testBadge = React.createElement(StatusBadge, { status: 'published' });
console.log('StatusBadge component test:', testBadge);

// Export for potential use in test runners
export { StatusBadge };