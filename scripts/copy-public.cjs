const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

// 确保目标基础目录存在
fs.mkdirSync(publicDir, { recursive: true });

// 1. 复制 config 白名单 → public/config/
const configSrc = path.join(root, 'config');
const configDest = path.join(publicDir, 'config');
fs.mkdirSync(configDest, { recursive: true });
const WHITELIST = new Set([
  'announcements.json', 'todo.md',
]);
const configFiles = fs.readdirSync(configSrc).filter(f => WHITELIST.has(f));
for (const f of configFiles) {
  fs.copyFileSync(path.join(configSrc, f), path.join(configDest, f));
  console.log(`  ✓ config/${f} → public/config/`);
}

// 2. 扫描 image/misc/*.webp 生成 preload 标签注入 index.html
const miscDir = path.join(root, 'image', 'misc');
if (fs.existsSync(miscDir)) {
  const indexHtml = path.join(root, 'index.html');
  const miscFiles = fs.readdirSync(miscDir)
    .filter(f => f.endsWith('.webp') && f !== 'favicon.webp')
    .sort();
  const preloadTags = miscFiles.map(f => {
    const fp = f === 'item_experience_FACE_M.webp' ? ' fetchpriority="high"' : '';
    return `  <link rel="preload" as="image" href="image/misc/${f}"${fp}>`;
  }).join('\n');
  let html = fs.readFileSync(indexHtml, 'utf-8');
  html = html.replace(/<!-- misc-preload-start -->[\s\S]*<!-- misc-preload-end -->/, `<!-- misc-preload-start -->\n${preloadTags}\n  <!-- misc-preload-end -->`);
  fs.writeFileSync(indexHtml, html, 'utf-8');
  console.log(`  ✓ ${miscFiles.length} misc preload 标签注入 index.html`);
}

// 3. 复制 image/ → public/image/
const imageSrc = path.join(root, 'image');
const imageDest = path.join(publicDir, 'image');
if (fs.existsSync(imageSrc)) {
  fs.cpSync(imageSrc, imageDest, { recursive: true });
  console.log('  ✓ image/ → public/image/');
}

// 4. 复制 data/output/ → public/data/
const dataSrc = path.join(root, 'data', 'output');
const dataDest = path.join(publicDir, 'data');
if (fs.existsSync(dataSrc)) {
  fs.cpSync(dataSrc, dataDest, { recursive: true });
  console.log('  ✓ data/output/ → public/data/');
}

console.log('✅ copy-public 完成');
