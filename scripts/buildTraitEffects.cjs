const fs = require('fs');
const path = require('path');

const dataRawDir = path.join(__dirname, '..', 'data_raw', 'jp');
const dataDir = path.join(__dirname, '..', 'data');

const effects = JSON.parse(fs.readFileSync(path.join(dataRawDir, 'effect.json'), 'utf-8'));
const effectMap = new Map(effects.map(e => [e.id, e]));

const abilities = JSON.parse(fs.readFileSync(path.join(dataRawDir, 'ability.json'), 'utf-8'));
const abilityMap = new Map(abilities.map(a => [a.id, a]));

function buildBattle(trait) {
  if (!trait.effects || trait.effects.length === 0) return null;
  const tmpl = effectMap.get(trait.effects[0].id);
  if (!tmpl || !tmpl.description) return null;
  const values = trait.effects.map(ef => (ef.values || []).map(v => v / 100));
  return { effect_description: tmpl.description, values };
}

function buildEquip(trait) {
  if (!trait.ability_ids || trait.ability_ids.length === 0) return null;
  const firstAbi = abilityMap.get(trait.ability_ids[0]);
  if (!firstAbi || !firstAbi.description) return null;
  const tmpl = firstAbi.description;
  const blockCount = firstAbi.effects?.length || 1;
  const values = [];
  for (let b = 0; b < blockCount; b++) {
    const vals = [];
    for (const aid of trait.ability_ids) {
      const abi = abilityMap.get(aid);
      const v = abi?.effects?.[b]?.value;
      if (v != null) vals.push(v / 100);
    }
    if (vals.length > 0) values.push(vals);
  }
  return { effect_description: tmpl, values };
}

function processFile(name, builder) {
  const jpFile = path.join(dataDir, 'jp', `${name}.json`);
  if (!fs.existsSync(jpFile)) { console.warn(`  ⚠ ${name}.json 不存在`); return; }
  const traits = JSON.parse(fs.readFileSync(jpFile, 'utf-8'));

  const untransFile = path.join(dataDir, 'untranslated', `${name}_effects.json`);
  let cnMap = new Map();
  if (fs.existsSync(untransFile)) {
    JSON.parse(fs.readFileSync(untransFile, 'utf-8')).forEach(t => {
      if (t.effect_description_cn) cnMap.set(t.id, t.effect_description_cn);
    });
  }

  const jpOutput = traits.map(t => {
    const data = builder(t);
    return data ? { id: t.id, ...data } : null;
  }).filter(Boolean);

  fs.writeFileSync(path.join(dataDir, 'jp', `${name}_effects.json`), JSON.stringify(jpOutput, null, 2), 'utf-8');
  console.log(`  ✓ jp/${name}_effects.json (${jpOutput.length} 条)`);

  const untransDir = path.join(dataDir, 'untranslated');
  if (!fs.existsSync(untransDir)) fs.mkdirSync(untransDir, { recursive: true });
  const untransOutput = jpOutput.map(t => ({
    id: t.id,
    effect_description: t.effect_description,
    effect_description_cn: cnMap.get(t.id) || '',
    values: t.values,
  }));
  fs.writeFileSync(path.join(untransDir, `${name}_effects.json`), JSON.stringify(untransOutput, null, 2), 'utf-8');
  console.log(`  ✓ untranslated/${name}_effects.json (${untransOutput.length} 条)`);
}

console.log('生成词条效果描述...');
processFile('battle_tool_trait', buildBattle);
processFile('equipment_tool_trait', buildEquip);
console.log('完成');
