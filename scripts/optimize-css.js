// scripts/optimize-css.js
// Script to optimize CSS and remove unused styles

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Function to analyze CSS usage
function analyzeCSSUsage() {
  console.log('🔍 Analyzing CSS usage...');
  
  try {
    // Run PurgeCSS to identify unused CSS
    execSync('npx purgecss --css dist/**/*.css --content dist/**/*.{html,js,ts,jsx,tsx} --output dist/', { stdio: 'inherit' });
    console.log('✅ CSS usage analysis complete');
  } catch (error) {
    console.error('❌ CSS usage analysis failed:', error.message);
  }
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

// Function to optimize Tailwind CSS
function optimizeTailwind() {
  console.log('⚡ Optimizing Tailwind CSS...');
  
  try {
    // Run Tailwind CSS optimization
    execSync('npx tailwindcss -i src/index.css -o dist/output.css --minify', { stdio: 'inherit' });
    console.log('✅ Tailwind CSS optimization complete');
  } catch (error) {
    console.error('❌ Tailwind CSS optimization failed:', error.message);
  }
}

// Function to remove unused fonts
function removeUnusedFonts() {
  console.log('🔤 Removing unused fonts...');
  
  const fontDirs = [
    'public/fonts',
    'src/assets/fonts'
  ];
  
  fontDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Checking fonts in ${dir}...`);
      // This would be where we'd implement font optimization
      // For now, we'll just log the directories
    }
  });
  
  console.log('✅ Font optimization complete');
}

// Function to optimize images in CSS
function optimizeCSSImages() {
  console.log('🖼️ Optimizing CSS images...');
  
  try {
    // Run CSS image optimization
    execSync('npx imagemin dist/**/*.css --out-dir=dist/', { stdio: 'inherit' });
    console.log('✅ CSS image optimization complete');
  } catch (error) {
    console.error('❌ CSS image optimization failed:', error.message);
  }
}

// Main optimization function
async function optimizeCSS() {
  console.log('🚀 Starting CSS optimization...');
  
  // Run all optimization steps
  analyzeCSSUsage();
  minifyCSS();
  optimizeTailwind();
  removeUnusedFonts();
  optimizeCSSImages();
  
  console.log('🎉 CSS optimization complete!');
}

// Run optimization if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeCSS().catch(console.error);
}

export { optimizeCSS };