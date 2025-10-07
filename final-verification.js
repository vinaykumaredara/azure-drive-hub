// Final verification script to ensure the build works correctly
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('🔍 Starting final verification...\n');

try {
  // 1. Check if dist folder exists
  if (!existsSync(join('.', 'dist'))) {
    console.error('❌ Dist folder does not exist');
    process.exit(1);
  }
  console.log('✅ Dist folder exists');

  // 2. Check if index.html exists
  if (!existsSync(join('.', 'dist', 'index.html'))) {
    console.error('❌ index.html not found in dist folder');
    process.exit(1);
  }
  console.log('✅ index.html exists');

  // 3. Check if JavaScript bundles exist
  const assetsDir = join('.', 'dist', 'assets');
  if (!existsSync(assetsDir)) {
    console.error('❌ Assets folder not found in dist folder');
    process.exit(1);
  }
  
  const jsFiles = [];
  const files = readdirSync(assetsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      jsFiles.push(file);
    }
  }
  
  if (jsFiles.length === 0) {
    console.error('❌ No JavaScript bundles found in assets folder');
    process.exit(1);
  }
  console.log(`✅ ${jsFiles.length} JavaScript bundles found`);

  // 4. Check if logo.svg exists and has content
  const logoPath = join('.', 'dist', 'logo.svg');
  if (!existsSync(logoPath)) {
    console.error('❌ logo.svg not found in dist folder');
    process.exit(1);
  }
  
  const logoContent = readFileSync(logoPath, 'utf8');
  if (logoContent.length === 0) {
    console.error('❌ logo.svg is empty');
    process.exit(1);
  }
  console.log('✅ logo.svg exists and has content');

  // 5. Try to build again to ensure consistency
  console.log('\n🏗️  Rebuilding project to verify consistency...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

  console.log('\n🎉 All verification checks passed!');
  console.log('\n📋 To deploy to Netlify or GitHub Pages:');
  console.log('   1. Push the changes to your repository');
  console.log('   2. Netlify will automatically build and deploy');
  console.log('   3. For GitHub Pages, ensure your workflow is configured correctly');
  
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}