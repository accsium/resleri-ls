const fs = require('fs');
const path = require('path');
const { safeReadJSON } = require('./safeReadJSON.cjs');

const rootDir = path.join(__dirname, '..');
const indexFile = path.join(rootDir, 'data', 'output', 'character_index.json');
if (!fs.existsSync(indexFile)) {
  console.error('❌ character_index.json 不存在，请先运行 prepare-data');
  process.exit(1);
}

const index = safeReadJSON(indexFile);

// 收集所有 image_M 值（含 switch_stat.image_M），去重
const imageSet = new Set();
for (const entry of index) {
  if (entry.image_M) imageSet.add(entry.image_M);
  if (entry.switch_stat?.image_M) imageSet.add(entry.switch_stat.image_M);
}

const srcDir = path.join(rootDir, '..', 'resleriana-db', 'resources', 'Japan', 'StandaloneWindows64', 'Texture2D');
const destDir = path.join(rootDir, 'image', 'character');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

let copied = 0;
let skipped = 0;
for (const img of imageSet) {
  const src = path.join(srcDir, img + '.webp');
  const dest = path.join(destDir, img + '.webp');
  if (fs.existsSync(dest)) {
    skipped++;
    continue;
  }
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    copied++;
    console.log(`  ✓ ${img}.webp`);
  } else {
    console.warn(`  ⚠ ${img}.webp 源文件不存在`);
  }
}

console.log(`✅ 完成：复制 ${copied} 张，跳过 ${skipped} 张（已存在）`);
