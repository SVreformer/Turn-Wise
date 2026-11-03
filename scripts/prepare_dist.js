const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'mobile', 'dist');
const assetsDir = path.join(__dirname, '..', 'mobile', 'assets');

// 1. Ensure .nojekyll exists
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('Created .nojekyll');

// 2. Copy icon.png
const srcIcon = path.join(assetsDir, 'icon.png');
if (fs.existsSync(srcIcon)) {
  fs.copyFileSync(srcIcon, path.join(distDir, 'icon.png'));
  fs.copyFileSync(srcIcon, path.join(distDir, 'favicon.png'));
  console.log('Copied icon.png and favicon.png');
}

// 3. Write PWA manifest.json
const manifest = {
  name: "Turn Wise — Station Indoor Navigation",
  short_name: "Turn Wise",
  start_url: "./index.html",
  scope: "./",
  display: "standalone",
  orientation: "portrait",
  background_color: "#FFFFFF",
  theme_color: "#165B33",
  description: "Accessibility-first indoor navigation for KSR Bengaluru railway station.",
  icons: [
    {
      src: "./icon.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "./icon.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ]
};
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Created manifest.json');

// 4. Update index.html
const indexPath = path.join(distDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Replace /_expo/ with ./_expo/ so relative path works everywhere
indexHtml = indexHtml.replace(/src="\/_expo\//g, 'src="./_expo/');

// Add base href and PWA meta tags if not present
const headTags = `
    <title>Turn Wise — Mobile App & Indoor Navigation</title>
    <base href="/Turn-Wise/" />
    <link rel="manifest" href="./manifest.json" />
    <link rel="icon" type="image/png" href="./icon.png" />
    <link rel="apple-touch-icon" href="./icon.png" />
    <meta name="theme-color" content="#165B33" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Turn Wise" />`;

indexHtml = indexHtml.replace(/<title>Turn Wise<\/title>/, headTags);

fs.writeFileSync(indexPath, indexHtml);
console.log('Updated index.html with base href, relative script path, and PWA tags');

// 5. Create 404.html (for GitHub Pages fallback)
fs.writeFileSync(path.join(distDir, '404.html'), indexHtml);
console.log('Created 404.html');
