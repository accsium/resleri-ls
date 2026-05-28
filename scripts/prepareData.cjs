const fs = require('fs');
const path = require('path');

// ========== 1. 加载配置 ==========
const pipelineConfig = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config', 'pipeline.json'), 'utf-8'
));

const rootDir = path.join(__dirname, '..');
const dataRawDir = path.join(rootDir, pipelineConfig.dataRawDir);
const dataDir = path.join(rootDir, 'data');
const jpDir = path.join(dataDir, 'jp');
const cnDir = path.join(dataDir, 'cn');
const untransDir = path.join(dataDir, 'untranslated');

if (!fs.existsSync(dataRawDir)) {
  console.error(`❌ ${pipelineConfig.dataRawDir}/ 目录不存在`);
  console.log(`请将游戏解包 JSON 文件放入 ${pipelineConfig.dataRawDir}/ 后重新运行`);
  process.exit(1);
}

// 确保输出目录存在
[jpDir, cnDir, untransDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ========== 2. 复制日文文本文件 ==========
console.log('📝 复制日文文本文件...');
for (const [name, config] of Object.entries(pipelineConfig.translationFiles)) {
  if (config.static) {
    continue;
  }
  const src = path.join(dataRawDir, config.file);
  const dest = path.join(jpDir, config.file);
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ ${config.file} 不在 data_raw 中，跳过`);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${config.file} → data/jp/`);
}

// ========== 4. 翻译对比与合并 ==========
console.log('🌐 处理翻译...');
let totalNew = 0;
let totalChanged = 0;
let totalPromoted = 0;

for (const [name, config] of Object.entries(pipelineConfig.translationFiles)) {
  const jpPath = path.join(jpDir, config.file);
  const cnPath = path.join(cnDir, config.file);
  const untransPath = path.join(untransDir, config.file);

  if (!fs.existsSync(jpPath)) {
    console.warn(`  ⚠ ${config.file} 日文文件缺失，跳过翻译处理`);
    continue;
  }

  const jpData = JSON.parse(fs.readFileSync(jpPath, 'utf-8'));
  const cnData = fs.existsSync(cnPath) ? JSON.parse(fs.readFileSync(cnPath, 'utf-8')) : [];
  const untransData = fs.existsSync(untransPath) ? JSON.parse(fs.readFileSync(untransPath, 'utf-8')) : [];

  // 构建查找映射
  const jpMap = new Map();
  if (Array.isArray(jpData)) {
    jpData.forEach(item => jpMap.set(item.id, item.name || item));
  }

  const cnMap = new Map();
  cnData.forEach(item => cnMap.set(item.id, item));

  const untransMap = new Map();
  untransData.forEach(item => untransMap.set(item.id, item));

  const newCN = [];
  const newUntrans = [];
  let newCount = 0;
  let changedCount = 0;
  let promotedCount = 0;

  jpMap.forEach((jpName, id) => {
    const cnEntry = cnMap.get(id);
    const untransEntry = untransMap.get(id);

    // 情况 A: untranslated 中已被翻译 → 提升到 CN
    if (untransEntry && untransEntry.name_cn && untransEntry.name_cn.trim() !== '') {
      newCN.push({ id, name_ja: jpName, name_cn: untransEntry.name_cn });
      promotedCount++;
      return;
    }

    // 情况 B: CN 中有且 name_ja 匹配 → 保留
    if (cnEntry && cnEntry.name_ja === jpName) {
      newCN.push(cnEntry);
      return;
    }

    // 情况 C: CN 中有但 name_ja 不匹配 → 日文已变，移到待翻译
    if (cnEntry && cnEntry.name_ja !== jpName) {
      newUntrans.push({
        id,
        name_ja: jpName,
        name_cn: cnEntry.name_cn || '',
        _changed: true,
        _old_name_ja: cnEntry.name_ja
      });
      changedCount++;
      return;
    }

    // 情况 D: untrans 中存在且 name_cn 为空 → 继续等待
    if (untransEntry) {
      newUntrans.push({
        id,
        name_ja: jpName,
        name_cn: untransEntry.name_cn || '',
        _changed: jpName !== untransEntry.name_ja ? true : (untransEntry._changed || false)
      });
      return;
    }

    // 情况 E: 全新条目
    newUntrans.push({ id, name_ja: jpName, name_cn: '' });
    newCount++;
  });

  // 写回文件
  fs.writeFileSync(cnPath, JSON.stringify(newCN, null, 2), 'utf-8');
  fs.writeFileSync(untransPath, JSON.stringify(newUntrans, null, 2), 'utf-8');

  const stat = [];
  if (promotedCount > 0) stat.push(`${promotedCount} ↑`);
  if (changedCount > 0) stat.push(`${changedCount} ~`);
  if (newCount > 0) stat.push(`${newCount} +`);
  const statStr = stat.length > 0 ? ` (${stat.join(', ')})` : '';

  console.log(`  ✓ ${config.file}: ${newCN.length} 已翻译, ${newUntrans.length} 待翻译${statStr}`);

  totalNew += newCount;
  totalChanged += changedCount;
  totalPromoted += promotedCount;
}

// ========== 5. 输出统计 ==========
console.log('---');
console.log(`✅ 完成：${totalPromoted} 条通过翻译 → CN，${totalChanged} 条日文变更需重译，${totalNew} 条新增待翻译`);
