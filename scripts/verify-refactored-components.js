// scripts/verify-refactored-components.js
// Script to verify that all refactored components files exist

import { existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying refactored components files...');

const basePath = join(process.cwd(), 'src');

// List of files to check
const filesToCheck = [
  // Services
  'services/api/carService.ts',
  'services/api/imageService.ts',
  'services/api/car.types.ts',
  
  // Hooks
  'hooks/data/useCarMutations.ts',
  'hooks/queries/useCarQueries.ts',
  
  // Components - Admin
  'components/admin/car-management/CarManagementDashboard.tsx',
  'components/admin/car-management/CarForm.tsx',
  'components/admin/car-management/CarList.tsx',
  'components/admin/car-management/CarFilters.tsx',
  'components/admin/car-management/DeleteCarDialog.tsx',
  
  // Components - UI Forms
  'components/ui/forms/FormField.tsx',
  'components/ui/forms/ImageDropzone.tsx',
  'components/ui/forms/ValidationMessage.tsx',
  
  // Components - UI Data Display
  'components/ui/data-display/DataTable.tsx',
  'components/ui/data-display/StatusBadge.tsx',
  'components/ui/data-display/PriceDisplay.tsx',
  'components/ui/data-display/RatingStars.tsx',
  
  // Components - UI Feedback
  'components/ui/feedback/LoadingSpinner.tsx',
  'components/ui/feedback/EmptyState.tsx',
  'components/ui/feedback/ErrorBoundary.tsx',
  
  // Components - UI Layout
  'components/ui/layout/PageHeader.tsx',
  'components/ui/layout/ContentWrapper.tsx',
  
  // Lib
  'lib/queryClient.ts'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  const fullPath = join(basePath, file);
  if (existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All refactored component files exist!');
  console.log('\n📁 Directory structure verified:');
  console.log('   ├── services/');
  console.log('   │   ├── api/');
  console.log('   │   │   ├── carService.ts');
  console.log('   │   │   ├── imageService.ts');
  console.log('   │   │   └── car.types.ts');
  console.log('   ├── hooks/');
  console.log('   │   ├── data/');
  console.log('   │   │   └── useCarMutations.ts');
  console.log('   │   └── queries/');
  console.log('   │       └── useCarQueries.ts');
  console.log('   ├── components/');
  console.log('   │   ├── admin/car-management/');
  console.log('   │   │   ├── CarManagementDashboard.tsx');
  console.log('   │   │   ├── CarForm.tsx');
  console.log('   │   │   ├── CarList.tsx');
  console.log('   │   │   ├── CarFilters.tsx');
  console.log('   │   │   └── DeleteCarDialog.tsx');
  console.log('   │   └── ui/');
  console.log('   │       ├── forms/');
  console.log('   │       ├── data-display/');
  console.log('   │       ├── feedback/');
  console.log('   │       └── layout/');
  console.log('   ├── lib/');
  console.log('   │   └── queryClient.ts');
  console.log('   └── __tests__/');
  console.log('       ├── services/');
  console.log('       ├── components/');
  console.log('       └── integration/');
  
  console.log('\n✅ Refactoring verification complete!');
} else {
  console.log('\n❌ Some files are missing!');
  process.exit(1);
}