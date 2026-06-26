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
  'announcements.json', 'atelier_fes.json', 'ex_skill_rules.json',
  'exclude.json', 'permanent_exclude.json', 'pipeline.json',
  'todo.md', 'transform.json',
]);
const configFiles = fs.readdirSync(configSrc).filter(f => WHITELIST.has(f));
for (const f of configFiles) {
  fs.copyFileSync(path.join(configSrc, f), path.join(configDest, f));
  console.log(`  ✓ config/${f} → public/config/`);
}

// 2. 复制 image/ → public/image/
const imageSrc = path.join(root, 'image');
const imageDest = path.join(publicDir, 'image');
if (fs.existsSync(imageSrc)) {
  fs.cpSync(imageSrc, imageDest, { recursive: true });
  console.log('  ✓ image/ → public/image/');
}

// 3. 复制 data/output/ → public/data/
const dataSrc = path.join(root, 'data', 'output');
const dataDest = path.join(publicDir, 'data');
if (fs.existsSync(dataSrc)) {
  fs.cpSync(dataSrc, dataDest, { recursive: true });
  console.log('  ✓ data/output/ → public/data/');
}

console.log('✅ copy-public 完成');
