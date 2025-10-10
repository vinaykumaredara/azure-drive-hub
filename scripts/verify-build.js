#!/usr/bin/env node

// Script to verify build artifacts and environment variables
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying build artifacts...\n');

// Check if dist folder exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist folder not found');
  process.exit(1);
}

console.log('✅ Dist folder exists');

// Check index.html
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in dist');
  process.exit(1);
}

console.log('✅ index.html exists');

// Check assets folder
const assetsPath = path.join(distPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.error('❌ assets folder not found in dist');
  process.exit(1);
}

console.log('✅ assets folder exists');

// List asset files
const assetFiles = fs.readdirSync(assetsPath);
console.log(`📁 Found ${assetFiles.length} asset files:`);

// Check for key asset types
const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
const cssFiles = assetFiles.filter(f => f.endsWith('.css'));
const imageFiles = assetFiles.filter(f => /\.(jpg|jpeg|png|gif|svg)$/.test(f));

console.log(`  📄 JS files: ${jsFiles.length}`);
console.log(`  🎨 CSS files: ${cssFiles.length}`);
console.log(`  🖼️ Image files: ${imageFiles.length}`);

// Check for critical chunks
const criticalChunks = [
  'index.',
  'vendor.',
  'supabase.',
  'router.',
  'query.'
];

criticalChunks.forEach(chunk => {
  const found = jsFiles.some(f => f.includes(chunk));
  if (found) {
    console.log(`  ✅ Found ${chunk}* chunk`);
  } else {
    console.warn(`  ⚠️  Missing ${chunk}* chunk`);
  }
});

// Calculate checksums
console.log('\n🔍 Calculating checksums...');
const indexContent = fs.readFileSync(indexPath);
const indexChecksum = crypto.createHash('sha256').update(indexContent).digest('hex');
console.log(`📝 index.html SHA256: ${indexChecksum.substring(0, 16)}...`);

if (jsFiles.length > 0) {
  const firstJsFile = jsFiles[0];
  const jsFilePath = path.join(assetsPath, firstJsFile);
  const jsContent = fs.readFileSync(jsFilePath);
  const jsChecksum = crypto.createHash('sha256').update(jsContent).digest('hex');
  console.log(`📝 ${firstJsFile} SHA256: ${jsChecksum.substring(0, 16)}...`);
}

console.log('\n✅ Build verification completed successfully');  const jsContent = fs.readFileSync(jsFilePath);
  const jsChecksum = crypto.createHash('sha256').update(jsContent).digest('hex');
  console.log(`📝 ${firstJsFile} SHA256: ${jsChecksum.substring(0, 16)}...`);
}

console.log('\n✅ Build verification completed successfully');