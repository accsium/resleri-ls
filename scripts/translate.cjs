const fs = require('fs');
const path = require('path');

const pipelineConfig = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config', 'pipeline.json'), 'utf-8'
));

const rootDir = path.join(__dirname, '..');
const rawDir = path.join(rootDir, pipelineConfig.dataRawDir);
const langDir = path.join(rootDir, 'language');
const untransDir = path.join(langDir, 'untranslated');

// 加载 effect / ability 用于生成 trait 效果描述
const effects = JSON.parse(fs.readFileSync(path.join(rawDir, 'effect.json'), 'utf-8'));
const effectMap = new Map(effects.map(e => [e.id, e]));
const abilities = JSON.parse(fs.readFileSync(path.join(rawDir, 'ability.json'), 'utf-8'));
const abilityMap = new Map(abilities.map(a => [a.id, a]));

[langDir, untransDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function btEffect(trait) {
  if (!trait.effects || trait.effects.length === 0) return null;
  return effectMap.get(trait.effects[0].id)?.description || null;
}

function etEffect(trait) {
  if (!trait.ability_ids || trait.ability_ids.length === 0) return null;
  return abilityMap.get(trait.ability_ids[0])?.description || null;
}

const TRAIT_FILES = new Set(['battle_tool_trait.json', 'equipment_tool_trait.json']);

console.log('📝 处理翻译...');

for (const [name, config] of Object.entries(pipelineConfig.translationFiles)) {
  const langPath = path.join(langDir, config.file);
  const untransPath = path.join(untransDir, config.file);
  const isTrait = TRAIT_FILES.has(config.file);

  // JP 源数据
  const src = path.join(rawDir, config.file);
  if (!fs.existsSync(src)) {
    console.log(`  ✓ ${config.file}: 静态文件，保持现有翻译`);
    continue;
  }
  const jpData = JSON.parse(fs.readFileSync(src, 'utf-8'));

  // 已有翻译
  const langData = fs.existsSync(langPath) ? JSON.parse(fs.readFileSync(langPath, 'utf-8')) : [];
  const langMap = new Map(langData.map(e => [e.id, e]));

  // 待翻译
  const untransData = fs.existsSync(untransPath) ? JSON.parse(fs.readFileSync(untransPath, 'utf-8')) : [];
  const untransMap = new Map();
  untransData.forEach(e => {
    const cur = untransMap.get(e.id) || {};
    Object.assign(cur, e);
    untransMap.set(e.id, cur);
  });

  // 合并
  for (const item of jpData) {
    const lang = langMap.get(item.id) || {};
    const untrans = untransMap.get(item.id) || {};

    // 从 untrans 提升翻译
    if (untrans.name_cn && !lang.name_cn) lang.name_cn = untrans.name_cn;
    if (untrans.effect_description_cn && !lang.effect_description_cn) lang.effect_description_cn = untrans.effect_description_cn;

    // 设置基本字段
    lang.id = item.id;
    lang.name = item.name;
    lang.name_cn = lang.name_cn || '';
    if (isTrait) {
      const effDesc = name === 'battle_tool_trait' ? btEffect(item) : etEffect(item);
      lang.effect_description = effDesc || '';
      lang.effect_description_cn = lang.effect_description_cn || '';
    }

    langMap.set(item.id, lang);
  }

  // 写回 language/
  fs.writeFileSync(langPath, JSON.stringify(Array.from(langMap.values()), null, 2), 'utf-8');

  // 生成 untranslated：任一 *_cn 缺失则放入完整条目
  const newUntrans = [];
  for (const lang of langMap.values()) {
    const missingNameCn = !lang.name_cn;
    const missingEffCn = isTrait && lang.effect_description && !lang.effect_description_cn;
    if (missingNameCn || missingEffCn) {
      const u = { id: lang.id, name: lang.name, name_cn: lang.name_cn || '' };
      if (isTrait) {
        u.effect_description = lang.effect_description || '';
        u.effect_description_cn = lang.effect_description_cn || '';
      }
      newUntrans.push(u);
    }
  }

  fs.writeFileSync(untransPath, JSON.stringify(newUntrans, null, 2), 'utf-8');
  console.log(`  ✓ ${config.file}: ${langMap.size} 条, ${newUntrans.length} 待翻译`);
}

console.log('✅ 完成');
