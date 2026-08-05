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

// 收集所有 image_S 值（含 switch_stat.image_S），去重
const imageSet = new Set();
for (const entry of index) {
  if (entry.image_S) imageSet.add(entry.image_S);
  if (entry.switch_stat?.image_S) imageSet.add(entry.switch_stat.image_S);
}

const imgConfig = safeReadJSON(path.join(rootDir, 'config', 'image-source.json'));
const srcDir = path.resolve(rootDir, imgConfig.srcDir);
const destDir = path.join(rootDir, 'image', 'character');

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });

let copied = 0;
for (const img of imageSet) {
  const src = path.join(srcDir, img + '.webp');
  const dest = path.join(destDir, img + '.webp');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    copied++;
    console.log(`  ✓ ${img}.webp`);
  } else {
    console.warn(`  ⚠ ${img}.webp 源文件不存在`);
  }
}

console.log(`✅ 完成：复制 ${copied} 张`);

// 复制卡池缩略图
const gachaFile = path.join(rootDir, 'data', 'output', 'gachas.json');
if (fs.existsSync(gachaFile)) {
  const gachaData = safeReadJSON(gachaFile);
  const gachaSet = new Set();
  for (const g of gachaData) {
    if (g.gacha_image) gachaSet.add(g.gacha_image);
  }
  const gachaDest = path.join(rootDir, 'image', 'gacha');
  fs.rmSync(gachaDest, { recursive: true, force: true });
  fs.mkdirSync(gachaDest, { recursive: true });
  let bc = 0;
  for (const img of gachaSet) {
    const src = path.join(srcDir, img + '.webp');
    const dest = path.join(gachaDest, img + '.webp');
    if (fs.existsSync(src)) { fs.copyFileSync(src, dest); bc++; console.log(`  ✓ ${img}.webp`); }
    else { console.warn(`  ⚠ ${img}.webp 源文件不存在`); }
  }
  console.log(`🖼 卡池缩略图：复制 ${bc} 张`);
}

// 复制 memoria 立绘
const memoriaFile = path.join(rootDir, 'data', 'output', 'memoria.json');
if (fs.existsSync(memoriaFile)) {
  const memoriaData = safeReadJSON(memoriaFile);
  const memoriaSet = new Set();
  for (const m of memoriaData) {
    if (m.image_square) memoriaSet.add(m.image_square);
    if (m.image_M) memoriaSet.add(m.image_M);
  }
  const memoriaDest = path.join(rootDir, 'image', 'memoria');
  fs.rmSync(memoriaDest, { recursive: true, force: true });
  fs.mkdirSync(memoriaDest, { recursive: true });
  let mc = 0;
  for (const img of memoriaSet) {
    const src = path.join(srcDir, img + '.webp');
    const dest = path.join(memoriaDest, img + '.webp');
    if (fs.existsSync(src)) { fs.copyFileSync(src, dest); mc++; console.log(`  ✓ ${img}.webp`); }
    else { console.warn(`  ⚠ ${img}.webp 源文件不存在`); }
  }
  console.log(`🖼 memoria 立绘：复制 ${mc} 张`);
}
