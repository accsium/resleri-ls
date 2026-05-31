const fs = require('fs');
const path = require('path');

const pipelineConfig = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config', 'pipeline.json'), 'utf-8'
));

const srcDir = path.join(__dirname, '..', 'data_raw', 'jp');
const destDir = path.join(__dirname, '..', 'data_raw', 'selection');

if (!fs.existsSync(srcDir)) {
  console.error(`❌ data_raw/jp/ 目录不存在`);
  process.exit(1);
}

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

console.log('📋 选择所需文件...');

// mainDataFiles
for (const [name, file] of Object.entries(pipelineConfig.mainDataFiles)) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${file}`);
  } else {
    console.warn(`  ⚠ ${file} 不存在`);
  }
}

// translationFiles（非 static）
for (const [name, config] of Object.entries(pipelineConfig.translationFiles)) {
  if (config.static) continue;
  const src = path.join(srcDir, config.file);
  const dest = path.join(destDir, config.file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${config.file}`);
  } else {
    console.warn(`  ⚠ ${config.file} 不存在`);
  }
}

// 复制 config 文件到 public/config/
const publicConfigDir = path.join(__dirname, '..', 'public', 'config');
if (!fs.existsSync(publicConfigDir)) fs.mkdirSync(publicConfigDir, { recursive: true });
const configDir = path.join(__dirname, '..', 'config');
for (const f of ['announcements.json', 'todo.md']) {
  const src = path.join(configDir, f);
  const dest = path.join(publicConfigDir, f);
  if (fs.existsSync(src)) { fs.copyFileSync(src, dest); console.log(`  ✓ config/${f} → public/config/`); }
}

// 复制 image/ 到 public/image/
const imageDir = path.join(__dirname, '..', 'image');
const publicImageDir = path.join(__dirname, '..', 'public', 'image');
if (fs.existsSync(imageDir) && !fs.existsSync(publicImageDir)) {
  fs.cpSync(imageDir, publicImageDir, { recursive: true });
  console.log('  ✓ image/ → public/image/');
}

console.log('✅ 完成');
