#!/usr/bin/env node

// Production Cleanup Script for RP cars
// This script automatically fixes TypeScript, ESLint, and other code quality issues

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const log = (message) => console.log(`🔧 ${message}`);
const error = (message) => console.error(`❌ ${message}`);
const success = (message) => console.log(`✅ ${message}`);

// Fix functions
const fixes = {
  // Fix async promise executor
  fixAsyncPromiseExecutor: () => {
    const file = 'src/utils/queryOptimization.ts';
    const content = fs.readFileSync(file, 'utf8');
    const fixed = content.replace(
      'return new Promise(async (resolve, reject) => {',
      'return new Promise((resolve, reject) => {'
    ).replace(
      'const startTime = performance.now();',
      'const startTime = performance.now();\n    \n    const executeQuery = async () => {'
    ).replace(
      'const result = await queryFn();',
      'return await queryFn();'
    ).replace(
      'resolve(result);',
      '};\n\n    executeQuery().then(resolve).catch(reject);'
    );
    fs.writeFileSync(file, fixed);
    log('Fixed async promise executor');
  },

  // Fix const declarations
  fixConstDeclarations: () => {
    const files = ['supabase/functions/cancel-booking/index.ts'];
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const fixed = content.replace(/let refundId = /g, 'const refundId = ');
        fs.writeFileSync(file, fixed);
      }
    });
    log('Fixed const declarations');
  },

  // Fix empty interfaces
  fixEmptyInterfaces: () => {
    const files = [
      'src/components/ui/command.tsx',
      'src/components/ui/textarea.tsx'
    ];
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const fixed = content
          .replace(/interface\s+\w+\s*{\s*}/g, 'type $1 = Record<string, never>;')
          .replace(/interface\s+(\w+)\s+extends\s+([^{]+)\s*{\s*}/g, 'interface $1 extends $2 {\n  // eslint-disable-next-line @typescript-eslint/no-empty-object-type\n}');
        fs.writeFileSync(file, fixed);
      }
    });
    log('Fixed empty interfaces');
  },

  // Fix require imports
  fixRequireImports: () => {
    const file = 'tailwind.config.ts';
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const fixed = content.replace(/require\(/g, 'import(');
      fs.writeFileSync(file, fixed);
    }
    log('Fixed require imports');
  }
};

// Main execution
async function runCleanup() {
  try {
    log('Starting comprehensive cleanup...');

    // Apply all fixes
    Object.values(fixes).forEach(fix => fix());

    // Run prettier to format everything
    try {
      execSync('npx prettier --write "src/**/*.{ts,tsx,js,jsx}"', { stdio: 'inherit' });
      success('Code formatted with Prettier');
    } catch (e) {
      error('Prettier formatting failed');
    }

    // Run ESLint fixes
    try {
      execSync('npx eslint . --fix --max-warnings 0', { stdio: 'inherit' });
      success('ESLint fixes applied');
    } catch (e) {
      error('ESLint fixes failed - manual review needed');
    }

    // Type check
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      success('TypeScript compilation successful');
    } catch (e) {
      error('TypeScript errors remain - manual review needed');
    }

    // Build test
    try {
      execSync('npm run build', { stdio: 'inherit' });
      success('Production build successful');
    } catch (e) {
      error('Build failed - manual review needed');
    }

    success('🎉 Cleanup completed!');
  } catch (err) {
    error(`Cleanup failed: ${err}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCleanup();
}

export { runCleanup, fixes };