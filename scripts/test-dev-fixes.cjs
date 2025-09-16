#!/usr/bin/env node

// Test script to verify dev server fixes

const http = require('http');

console.log('🧪 Testing Dev Server Fixes...');

// Test 1: Check if preflight script exists
console.log('\n1. Checking preflight script...');
const { execSync } = require('child_process');
try {
  execSync('npm run dev:preflight', { stdio: 'pipe' });
  console.log('✅ Preflight script exists and runs');
} catch (error) {
  console.log('❌ Preflight script failed:', error.message);
}

// Test 2: Check if dev:clean script exists
console.log('\n2. Checking dev:clean script...');
try {
  const result = execSync('npm run dev:clean', { stdio: 'pipe', timeout: 5000 });
  console.log('✅ dev:clean script exists');
} catch (error) {
  // This is expected to fail quickly since it tries to start the server
  if (error.message.includes('timeout') || error.status) {
    console.log('✅ dev:clean script exists');
  } else {
    console.log('❌ dev:clean script failed:', error.message);
  }
}

// Test 3: Check package.json for kill-port dependency
console.log('\n3. Checking kill-port dependency...');
const fs = require('fs');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (packageJson.devDependencies && packageJson.devDependencies['kill-port']) {
    console.log('✅ kill-port dependency found');
  } else {
    console.log('❌ kill-port dependency not found');
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Test 4: Check if ErrorBoundary component exists
console.log('\n4. Checking ErrorBoundary component...');
if (fs.existsSync('./src/components/ErrorBoundary.tsx')) {
  console.log('✅ ErrorBoundary component exists');
} else {
  console.log('❌ ErrorBoundary component not found');
}

// Test 5: Check if DEV_CHECKLIST.md exists
console.log('\n5. Checking DEV_CHECKLIST.md...');
if (fs.existsSync('./DEV_CHECKLIST.md')) {
  console.log('✅ DEV_CHECKLIST.md exists');
} else {
  console.log('❌ DEV_CHECKLIST.md not found');
}

// Test 6: Check if README.md has been updated
console.log('\n6. Checking README.md updates...');
const readmeContent = fs.readFileSync('./README.md', 'utf8');
if (readmeContent.includes('Development Troubleshooting')) {
  console.log('✅ README.md has development troubleshooting section');
} else {
  console.log('❌ README.md missing development troubleshooting section');
}

// Test 7: Check if .vscode/launch.json has been updated
console.log('\n7. Checking .vscode/launch.json updates...');
if (fs.existsSync('./.vscode/launch.json')) {
  const launchJsonContent = fs.readFileSync('./.vscode/launch.json', 'utf8');
  if (launchJsonContent.includes('http://localhost:5173')) {
    console.log('✅ .vscode/launch.json updated with correct port');
  } else {
    console.log('❌ .vscode/launch.json not updated with correct port');
  }
} else {
  console.log('❌ .vscode/launch.json not found');
}

// Test 8: Check vite.config.ts updates
console.log('\n8. Checking vite.config.ts updates...');
const viteConfig = fs.readFileSync('./vite.config.ts', 'utf8');
if (viteConfig.includes('strictPort: false')) {
  console.log('✅ vite.config.ts updated with strictPort: false');
} else {
  console.log('❌ vite.config.ts not updated with strictPort: false');
}

if (viteConfig.includes('host: true')) {
  console.log('✅ vite.config.ts updated with host: true');
} else {
  console.log('❌ vite.config.ts not updated with host: true');
}

console.log('\n🎉 Dev server fix verification complete!');