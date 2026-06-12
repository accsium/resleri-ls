const fs = require('fs');
const path = require('path');
const { safeReadJSON } = require('./safeReadJSON.cjs');

const pipelineConfig = safeReadJSON(
  path.join(__dirname, '..', 'config', 'pipeline.json')
);

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
// 白名单：仅复制明确列出的配置文件，防止意外泄露敏感配置
const PUBLIC_CONFIG_WHITELIST = new Set([
  'announcements.json', 'atelier_fes.json', 'ex_skill_rules.json',
  'exclude.json', 'permanent_exclude.json', 'pipeline.json',
  'todo.md', 'transform.json',
])
const configFiles = fs.readdirSync(configDir).filter(f => PUBLIC_CONFIG_WHITELIST.has(f))
for (const f of configFiles) {
  const src = path.join(configDir, f);
  const dest = path.join(publicConfigDir, f);
  if (fs.existsSync(src)) { fs.copyFileSync(src, dest); console.log(`  ✓ config/${f} → public/config/`); }
}

// 复制 image/ 到 public/image/
const imageDir = path.join(__dirname, '..', 'image');
const publicImageDir = path.join(__dirname, '..', 'public', 'image');
if (fs.existsSync(imageDir)) {
  if (fs.existsSync(publicImageDir)) fs.rmSync(publicImageDir, { recursive: true });
  fs.cpSync(imageDir, publicImageDir, { recursive: true });
  console.log('  ✓ image/ → public/image/');
}

console.log('✅ 完成');
