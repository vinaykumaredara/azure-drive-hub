#!/usr/bin/env node

/**
 * Final Booking Flow Verification Script
 * 
 * This script verifies that all the booking flow fixes have been applied correctly
 * and that the application is functioning as expected.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve('.');
const SRC_DIR = path.join(ROOT_DIR, 'src');

console.log('🔍 Starting Final Booking Flow Verification...\n');

// 1. Check that all the required files exist
console.log('1. Checking file structure...');

const requiredFiles = [
  'src/components/CarCard.tsx',
  'src/components/CarCardModern.tsx',
  'src/components/EnhancedBookingFlow.tsx',
  'src/components/PhoneModal.tsx',
  'src/components/AuthProvider.component.tsx',
  'src/hooks/useBooking.ts',
  'src/pages/UserDashboard.tsx',
  'src/contexts/AuthContext.ts',
  'src/components/booking-steps/DatesStep.tsx',
  'src/components/booking-steps/PhoneStep.tsx',
  'src/components/booking-steps/ExtrasStep.tsx',
  'src/components/booking-steps/TermsStep.tsx',
  'src/components/booking-steps/LicenseStep.tsx',
  'src/components/booking-steps/PaymentStep.tsx',
  'src/components/booking-steps/ConfirmationStep.tsx'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT_DIR, file))) {
    console.error(`❌ Missing file: ${file}`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('✅ All required files exist');
} else {
  console.error('❌ Some required files are missing');
  process.exit(1);
}

// 2. Check import paths
console.log('\n2. Checking import paths...');

const filesToCheck = [
  'src/components/BookingModal.tsx',
  'src/components/ChatWidget.tsx',
  'src/components/Header.tsx',
  'src/components/LicenseUpload.tsx'
];

let importPathsCorrect = true;
for (const file of filesToCheck) {
  const filePath = path.join(ROOT_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for incorrect import paths
  if (content.includes('from "./AuthProvider"')) {
    console.error(`❌ Incorrect import path in ${file}`);
    importPathsCorrect = false;
  }
  
  // Check for correct import paths
  if (!content.includes('from "@/components/AuthProvider"')) {
    console.error(`❌ Missing correct import path in ${file}`);
    importPathsCorrect = false;
  }
}

if (importPathsCorrect) {
  console.log('✅ All import paths are correct');
} else {
  console.error('❌ Some import paths are incorrect');
  process.exit(1);
}

// 3. Check for debug logs
console.log('\n3. Checking for debug logs...');

const filesToCheckForLogs = [
  'src/components/CarCard.tsx',
  'src/components/CarCardModern.tsx',
  'src/components/EnhancedBookingFlow.tsx'
];

let noDebugLogs = true;
for (const file of filesToCheckForLogs) {
  const filePath = path.join(ROOT_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for console.log statements
  if (content.includes('console.log(')) {
    console.error(`❌ Found console.log in ${file}`);
    noDebugLogs = false;
  }
  
  // Check for debug overlay detection code
  if (content.includes('elementFromPoint')) {
    console.error(`❌ Found debug overlay detection code in ${file}`);
    noDebugLogs = false;
  }
}

if (noDebugLogs) {
  console.log('✅ No debug logs found');
} else {
  console.error('❌ Found debug logs that should be removed');
  process.exit(1);
}

// 4. Check React.memo custom compare function
console.log('\n4. Checking React.memo custom compare function...');

const carCardModernPath = path.join(ROOT_DIR, 'src/components/CarCardModern.tsx');
const carCardModernContent = fs.readFileSync(carCardModernPath, 'utf8');

if (carCardModernContent.includes('memo(CarCardModernComponent, (prevProps, nextProps) => {')) {
  console.error('❌ Found custom compare function in CarCardModern');
  process.exit(1);
} else {
  console.log('✅ React.memo custom compare function fixed');
}

// 5. Run tests
console.log('\n5. Running tests...');

try {
  execSync('npm test src/__tests__/bookingResumeFlow.test.tsx', { stdio: 'inherit' });
  console.log('✅ Booking resume flow tests passed');
} catch (error) {
  console.error('❌ Booking resume flow tests failed');
  process.exit(1);
}

try {
  execSync('npm test src/__tests__/carCardBooking.comprehensive.test.tsx', { stdio: 'inherit' });
  console.log('✅ CarCard booking tests passed');
} catch (error) {
  console.error('❌ CarCard booking tests failed');
  process.exit(1);
}

// 6. Check that the application builds
console.log('\n6. Checking that the application builds...');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application builds successfully');
} catch (error) {
  console.error('❌ Application build failed');
  process.exit(1);
}

console.log('\n🎉 All verification checks passed!');
console.log('✅ Booking flow fixes have been applied successfully');
console.log('✅ Application is ready for production');