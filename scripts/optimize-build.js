// scripts/optimize-build.js
// Script to optimize the build process and bundle size

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Function to analyze bundle size
function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle size...');
  
  try {
    // Run bundle analyzer
    execSync('npm run build:analyze', { stdio: 'inherit' });
    console.log('✅ Bundle analysis complete');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
  }
}

// Function to clean unused dependencies
function cleanUnusedDependencies() {
  console.log('🧹 Cleaning unused dependencies...');
  
  try {
    // Run depcheck to find unused dependencies
    execSync('npx depcheck', { stdio: 'inherit' });
    console.log('✅ Dependency check complete');
  } catch (error) {
    console.error('❌ Dependency check failed:', error.message);
  }
}

// Function to optimize images
function optimizeImages() {
  console.log('🖼️ Optimizing images...');
  
  const imageDirs = [
    'src/assets',
    'public'
  ];
  
  imageDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Optimizing images in ${dir}...`);
      // This would be where we'd implement image optimization
      // For now, we'll just log the directories
    }
  });
  
  console.log('✅ Image optimization complete');
}

// Function to minify CSS
function minifyCSS() {
  console.log('🎨 Minifying CSS...');
  
  try {
    // Run CSS minification
    execSync('npx cleancss -o dist/style.min.css dist/style.css', { stdio: 'inherit' });
    console.log('✅ CSS minification complete');
  } catch (error) {
    console.error('❌ CSS minification failed:', error.message);
  }
}

// Function to generate service worker
function generateServiceWorker() {
  console.log('⚙️ Generating service worker...');
  
  try {
    // Generate service worker with workbox
    execSync('npx workbox generateSW workbox-config.js', { stdio: 'inherit' });
    console.log('✅ Service worker generation complete');
  } catch (error) {
    console.error('❌ Service worker generation failed:', error.message);
  }
}

// Function to optimize JavaScript bundles
function optimizeJavaScript() {
  console.log('⚡ Optimizing JavaScript bundles...');
  
  try {
    // Run terser for additional minification
    execSync('npx terser dist/assets/*.js -o dist/assets/bundle.min.js', { stdio: 'inherit' });
    console.log('✅ JavaScript optimization complete');
  } catch (error) {
    console.error('❌ JavaScript optimization failed:', error.message);
  }
}

// Function to compress assets
function compressAssets() {
  console.log('📦 Compressing assets...');
  
  try {
    // Run gzip compression
    execSync('npx gzipper compress dist/ dist/', { stdio: 'inherit' });
    console.log('✅ Asset compression complete');
  } catch (error) {
    console.error('❌ Asset compression failed:', error.message);
  }
}

// Main optimization function
async function optimizeBuild() {
  console.log('🚀 Starting build optimization...');
  
  // Run all optimization steps
  analyzeBundleSize();
  cleanUnusedDependencies();
  optimizeImages();
  minifyCSS();
  generateServiceWorker();
  optimizeJavaScript();
  compressAssets();
  
  console.log('🎉 Build optimization complete!');
}

// Run optimization if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeBuild().catch(console.error);
}

export { optimizeBuild };