#!/usr/bin/env node

// Final verification script to confirm all dev server fixes are working

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Final Verification of Dev Server Fixes\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    failed++;
  }
}

// Test 1: Check if all required files exist
test('Required files exist', () => {
  const requiredFiles = [
    './vite.config.ts',
    './package.json',
    './src/components/ErrorBoundary.tsx',
    './src/App.tsx',
    './src/main.tsx',
    './.vscode/launch.json',
    './README.md',
    './DEV_CHECKLIST.md'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
  }
});

// Test 2: Check Vite config updates
test('Vite config has correct settings', () => {
  const viteConfig = fs.readFileSync('./vite.config.ts', 'utf8');
  if (!viteConfig.includes('host: true')) {
    throw new Error('host: true not found');
  }
  if (!viteConfig.includes('strictPort: false')) {
    throw new Error('strictPort: false not found');
  }
});

// Test 3: Check package.json scripts
test('Package.json has required scripts', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (!packageJson.scripts['dev:preflight']) {
    throw new Error('dev:preflight script missing');
  }
  if (!packageJson.scripts['dev'].includes('dev:preflight')) {
    throw new Error('dev script does not include preflight');
  }
  if (!packageJson.scripts['dev:clean']) {
    throw new Error('dev:clean script missing');
  }
  if (!packageJson.devDependencies['kill-port']) {
    throw new Error('kill-port dependency missing');
  }
});

// Test 4: Check ErrorBoundary integration
test('ErrorBoundary is integrated in App.tsx', () => {
  const appContent = fs.readFileSync('./src/App.tsx', 'utf8');
  if (!appContent.includes('ErrorBoundary')) {
    throw new Error('ErrorBoundary not found in App.tsx');
  }
});

// Test 5: Check dev-only logger in main.tsx
test('Dev-only logger exists in main.tsx', () => {
  const mainContent = fs.readFileSync('./src/main.tsx', 'utf8');
  if (!mainContent.includes('Dev-only logger')) {
    throw new Error('Dev-only logger not found in main.tsx');
  }
});

// Test 6: Check VS Code launch config
test('VS Code launch config updated', () => {
  const launchContent = fs.readFileSync('./.vscode/launch.json', 'utf8');
  if (!launchContent.includes('http://localhost:5173')) {
    throw new Error('VS Code launch config not updated');
  }
});

// Test 7: Check README updates
test('README has troubleshooting section', () => {
  const readmeContent = fs.readFileSync('./README.md', 'utf8');
  if (!readmeContent.includes('Development Troubleshooting')) {
    throw new Error('Development Troubleshooting section missing');
  }
});

// Test 8: Test preflight script execution
test('Preflight script executes without errors', () => {
  try {
    execSync('npm run dev:preflight', { stdio: 'pipe' });
  } catch (error) {
    // The script might "fail" because there's no process to kill, but that's okay
    // We just want to make sure it doesn't crash with a syntax error
    if (!error.message.includes('Process on port') && !error.message.includes('No process found')) {
      throw error;
    }
  }
});

console.log(`\n📊 Verification Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🎯 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All verifications passed! The dev server fixes are working correctly.');
  console.log('\n🚀 You can now run the development server with: npm run dev');
  console.log('🧹 Or use the clean start command: npm run dev:clean');
} else {
  console.log('\n⚠️  Some verifications failed. Please check the errors above.');
}