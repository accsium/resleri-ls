const fs = require('fs');
const path = require('path');
const { safeReadJSON } = require('./safeReadJSON.cjs');

const pipelineConfig = safeReadJSON(
  path.join(__dirname, 'pipeline.json')
);

const srcDir = path.join(__dirname, '..', 'data', 'raw', 'jp');
const destDir = path.join(__dirname, '..', pipelineConfig.dataRawDir);

if (!fs.existsSync(srcDir)) {
  console.error(`❌ data/raw/jp/ 目录不存在`);
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

// 复制 path_hash_to_name.json 到 raw_select 目录
const hashFile = path.join(__dirname, '..', 'data', 'raw', 'path_hash_to_name.json');
if (fs.existsSync(hashFile)) {
  fs.copyFileSync(hashFile, path.join(destDir, 'path_hash_to_name.json'));
  console.log('  ✓ path_hash_to_name.json');
}

console.log('✅ 完成');
