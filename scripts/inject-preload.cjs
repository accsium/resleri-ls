const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('❌ dist/ 不存在，请先运行 build');
  process.exit(1);
}

// 扫描 image/misc/*.webp 生成 preload 标签（favicon 高优先级）
const miscDir = path.join(root, 'image', 'misc');
if (!fs.existsSync(miscDir)) {
  console.log('❌ image/misc/ 不存在');
  process.exit(1);
}
const miscFiles = fs.readdirSync(miscDir).filter(f => f.endsWith('.webp')).sort();
const preloadTags = miscFiles.map(f => {
  const fp = f === 'favicon.webp' ? ' fetchpriority="high"' : '';
  return `  <link rel="preload" as="image" href="image/misc/${f}"${fp}>`;
}).join('\n');

// 对 dist/*.html 注入（只写 dist 产物，绝不触碰仓库根 html）
let injected = 0, skipped = 0;
for (const file of fs.readdirSync(distDir).filter(f => f.endsWith('.html'))) {
  const filePath = path.join(distDir, file);
  let html = fs.readFileSync(filePath, 'utf-8');
  const before = html;
  html = html.replace(/<!-- misc-preload-start -->[\s\S]*<!-- misc-preload-end -->/, `<!-- misc-preload-start -->\n${preloadTags}\n  <!-- misc-preload-end -->`);
  if (html === before) {
    skipped++;
    console.log(`  - ${file} 无 marker 或已最新，跳过`);
    continue;
  }
  fs.writeFileSync(filePath, html, 'utf-8');
  injected++;
  console.log(`  ✓ ${miscFiles.length} misc preload 标签注入 ${file}`);
}
console.log(`✅ inject-preload 完成：注入 ${injected} 个，跳过 ${skipped} 个`);
