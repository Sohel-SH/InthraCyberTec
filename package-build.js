const fs = require('fs-extra'); // You may need: npm install fs-extra
const path = require('path');
const { execSync } = require('child_process');

async function buildAndPackage() {
  try {
    console.log('🚀 Starting Next.js build...');
    execSync('npm run build', { stdio: 'inherit' });

    const srcDir = path.join(__dirname, '.next', 'standalone');
    const destDir = path.join(__dirname, 'dist');

    // 1. Clean previous dist folder
    if (fs.existsSync(destDir)) {
      fs.removeSync(destDir);
    }

    // 2. Copy standalone build to dist
    console.log('📦 Creating dist folder...');
    fs.copySync(srcDir, destDir);

    // 3. Copy static files (Required for CSS/JS to work)
    console.log('🎨 Copying static assets...');
    fs.copySync(path.join(__dirname, '.next', 'static'), path.join(destDir, '.next', 'static'));

    // 4. Copy public folder (Required for images/icons)
    console.log('🖼️  Copying public folder...');
    if (fs.existsSync(path.join(__dirname, 'public'))) {
      fs.copySync(path.join(__dirname, 'public'), path.join(destDir, 'public'));
    }

    console.log('\n✅ Success! Your production-ready folder is located at: ./dist');
    console.log('👉 Upload the "dist" folder to your server and run: node server.js');
  } catch (error) {
    console.error('❌ Build failed:', error);
  }
}

buildAndPackage();