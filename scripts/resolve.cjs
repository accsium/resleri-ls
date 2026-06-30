const fs = require('fs');
const path = require('path');
const config = require('./resolveConfig.cjs');
const { safeReadJSON } = require('./safeReadJSON.cjs');

const pipelineConfig = safeReadJSON(
  path.join(__dirname, '..', 'config', 'pipeline.json')
);
const rawDir = path.join(__dirname, '..', pipelineConfig.dataRawDir);
const langDir = path.join(__dirname, '..', 'data', 'language');
const outDir = path.join(__dirname, '..', 'data', 'output');

// ========== 1. 加载实体表 ==========
const tables = {};
for (const [entityName, entityConfig] of Object.entries(config.entities)) {
  const filePath = path.join(rawDir, entityConfig.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ 文件 ${entityConfig.file} 不存在，跳过实体 ${entityName}`);
    continue;
  }
  const raw = safeReadJSON(filePath);
  if (!Array.isArray(raw)) {
    console.error(`❌ 文件 ${entityConfig.file} 格式错误：期望数组，实际为 ${typeof raw}`);
    process.exit(1);
  }
  tables[entityName] = new Map(raw.map(item => [item[entityConfig.idField], item]));
}

// ========== 2. hyperlink 映射 ==========
const hyperlinkMap = new Map()
const hyperlinkFile = path.join(rawDir, 'hyperlink.json')
if (fs.existsSync(hyperlinkFile)) {
  const hyperlinkRaw = safeReadJSON(hyperlinkFile)
  hyperlinkRaw.forEach(h => {
    const skill = tables.skill?.get(h.skill_id)
    if (skill) hyperlinkMap.set(h.id, skill.name)
  })
}

function replaceHyperlinks(text) {
  if (!text) return text
  let result = text.replace(/\{?\{hyperlink_id (\d+)\}?\}/g, (match, idStr) => {
    const id = parseInt(idStr, 10)
    const name = hyperlinkMap.get(id)
    if (name) return `<span class="hl-skill">${name}</span>`
    return match
  })
  result = result.replace(/「([^」]+)」/g, '<span class="hl-quote">「$1」</span>')
  // () 内容标色
  result = result.replace(/\(([^)]+)\)/g, '<span class="hl-paren">($1)</span>')
  return result
}

// ========== 3. 数值处理 / 文本处理 / 合并 ==========
function processEffects(effects) {
  return (effects || []).map(e => e.value != null ? e.value / 100 : 0)
}

function processText(description) {
  return replaceHyperlinks(description)
}

function mergeValues(description, values) {
  let result = description
  values.forEach((v, i) => {
    result = result.replace(new RegExp('\\{' + i + '\\}', 'g'), v)
  })
  return result
}

function bakeDescription(obj) {
  if (!obj.description) return
  const values = processEffects(obj.effects)
  let desc = processText(obj.description)
  obj.description = mergeValues(desc, values)
  delete obj.effects
}

// ========== 4. 加载翻译映射表 ==========
function loadJpMap(name) {
  const filePath = path.join(rawDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = safeReadJSON(filePath);
    return new Map(raw.map(item => [item.id, item.name]));
  }
  return new Map();
}

function loadCnMap(name) {
  const filePath = path.join(langDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = safeReadJSON(filePath);
    return new Map(raw.map(item => [item.id, item.name_cn || '']));
  }
  return new Map();
}

const jpMaps = {};
const cnMaps = {};
const mapKeys = Object.keys(pipelineConfig.translationFiles || {});
mapKeys.forEach(key => {
  jpMaps[key] = loadJpMap(key);
  cnMaps[key] = loadCnMap(key);
});

// skill_target_type 是 static 文件，不复制到 selection，直接从 language/ 加载
const sttLangFile = path.join(langDir, 'skill_target_type.json');
const sttMapJa = new Map();
const sttMapCn = new Map();
if (fs.existsSync(sttLangFile)) {
  safeReadJSON(sttLangFile).forEach(t => {
    sttMapJa.set(t.id, t.name);
    sttMapCn.set(t.id, t.name_cn || t.name);
  });
}

// ========== 5. EX 技能规则 ==========
const rulesFile = path.join(__dirname, '..', 'config', 'ex_skill_rules.json');
let exRules = [];
if (fs.existsSync(rulesFile)) {
  try { exRules = safeReadJSON(rulesFile, false); console.log(`📋 已加载 EX 技能规则：${exRules.length} 条`); }
  catch { console.warn('⚠️ EX 技能规则文件解析失败'); }
} else { console.warn('⚠️ EX 技能规则文件缺失'); }

// ========== 6. 递归补全效果引用 ==========
const MAX_RESOLVE_DEPTH = 10

function resolveEffects(obj, entityName, depth = 0) {
  if (depth > MAX_RESOLVE_DEPTH) return obj
  const entityConfig = config.entities[entityName];
  if (!entityConfig) return obj;
  const resolved = JSON.parse(JSON.stringify(obj));
  if (entityConfig.nestedReferences) {
    for (const [pathStr, refConfig] of Object.entries(entityConfig.nestedReferences)) {
      const parts = pathStr.split('.');
      let targetArray = resolved;
      for (const part of parts) { if (targetArray == null) break; targetArray = targetArray[part]; }
      if (targetArray && Array.isArray(targetArray)) {
        targetArray.forEach((item, index) => {
          if (!item) return;
          const refId = item[refConfig.refField];
          const detail = tables[refConfig.target]?.get(refId);
          if (detail) targetArray[index] = { ...item, _detail: resolveEffects(detail, refConfig.target, depth + 1) };
        });
      }
    }
  }
  return resolved;
}

// ========== 7. 收集技能/能力 ID ==========
function collectSkillIds(character) {
  const ids = new Set();
  const add = (arr) => { if (arr) arr.forEach(id => ids.add(id)); };
  add(character.normal1_skill_ids);
  add(character.normal2_skill_ids);
  add(character.burst_skill_ids);
  add(character.evolved_normal1_skill_ids);
  add(character.evolved_normal2_skill_ids);
  add(character.evolved_burst_skill_ids);
  add(character.ability_ids);
  add(character.board_ability1_ids);
  add(character.board_ability2_ids);
  add(character.board_ability3_ids);
  add(character.all_skill_evolved_ability_ids);
  add(character.support_ability_ids);
  add(character.extra_skill_ids);
  if (character.active1_skill_id) ids.add(character.active1_skill_id);
  if (character.active2_skill_id) ids.add(character.active2_skill_id);
  if (character.active3_skill_id) ids.add(character.active3_skill_id);
  return ids;
}

// ========== 8. 构建技能/能力详情（分离 skill 和 ability）==========
const SKILL_KEEP = ['name', 'id', 'attack_attributes', 'skill_target_type',
  'target_name_ja', 'target_name_cn', 'skill_power_type',
  'power', 'break_power', 'wt', 'limit_count', 'description']
const ABILITY_KEEP = ['name', 'description']

function buildSkillAndAbilityDetails(character) {
  const skillIds = collectSkillIds(character);
  const targetMapJa = sttMapJa;
  const targetMapCn = sttMapCn;
  const skills = {};
  const abilities = {};

  skillIds.forEach(id => {
    const isSkill = tables.skill?.has(id);
    const table = isSkill ? tables.skill : tables.ability;
    const entityName = isSkill ? 'skill' : 'ability';
    let obj = table?.get(id);
    if (!obj) return;

    obj = resolveEffects(obj, entityName);
    bakeDescription(obj);

    if (isSkill) {
      // 数值处理
      obj.wt = 200 + (obj.wait ?? 0);
      delete obj.wait;
      // 添加目标名称
      if (obj.skill_target_type !== undefined) {
        obj.target_name_ja = targetMapJa?.get(obj.skill_target_type) || '';
        obj.target_name_cn = targetMapCn?.get(obj.skill_target_type) || targetMapJa?.get(obj.skill_target_type) || '';
      }
      const slim = {};
      for (const k of SKILL_KEEP) { if (obj[k] !== undefined && obj[k] !== null) slim[k] = obj[k]; }
      skills[id] = slim;
    } else {
      const slim = {};
      for (const k of ABILITY_KEEP) { if (obj[k] !== undefined && obj[k] !== null) slim[k] = obj[k]; }
      abilities[id] = slim;
    }
  });

  return { skills, abilities };
}

// ========== 9. 构建技能 ID 分组（替代旧 _skills 数组）==========
function toIdArray(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return [...new Set(val)].sort((a, b) => a - b);
  return [val];
}

const SKILL_TYPE_MAP = {
  normal1: { idsField: 'normal1_skill_ids', evolvedField: 'evolved_normal1_skill_ids' },
  normal2: { idsField: 'normal2_skill_ids', evolvedField: 'evolved_normal2_skill_ids' },
  burst:   { idsField: 'burst_skill_ids',      evolvedField: 'evolved_burst_skill_ids' },
  active1: { idsField: 'active1_skill_id',     evolvedField: null },
  active2: { idsField: 'active2_skill_id',     evolvedField: null },
  active3: { idsField: 'active3_skill_id',     evolvedField: null },
};

function buildSkillIdGroups(character) {
  const groups = {};
  for (const [type, fields] of Object.entries(SKILL_TYPE_MAP)) {
    const ids = toIdArray(character[fields.idsField]);
    if (ids.length > 0) groups[type] = ids;
  }
  return groups;
}

// ========== 10. 构建角色条目（合并 buildIndexEntry + finalizeOutput）==========

function hasEvolvedSkills(char) {
  return ['normal1','normal2','burst'].some(p =>
    char[`evolved_${p}_skill_ids`] && char[`evolved_${p}_skill_ids`].length > 0)
}

function computeWT(character, useEvolved) {
  const speed = character.initial_status?.speed;
  if (speed == null || speed <= 0) return null;
  let wait = 0;
  const field = useEvolved ? 'evolved_normal2_skill_ids' : 'normal2_skill_ids';
  const ids = character[field] || [];
  if (ids && ids.length > 0) {
    const maxId = Math.max(...ids);
    const skill = tables.skill?.get(maxId);
    if (skill && typeof skill.wait === 'number') wait = skill.wait;
  }
  return Math.floor(57600 / speed + wait);
}

function diffObjects(base, alt) {
  const skip = new Set(['switch', 'switch_stat', '_transform']);
  const diff = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(alt)]);
  for (const k of keys) {
    if (skip.has(k)) continue;
    if (base[k] === alt[k]) continue;
    if (Array.isArray(base[k]) && Array.isArray(alt[k]) && JSON.stringify(base[k]) === JSON.stringify(alt[k])) continue;
    diff[k] = Object.hasOwn(alt, k) ? alt[k] : base[k];
  }
  return diff;
}

function buildCharacterEntry(character) {
  const char = JSON.parse(JSON.stringify(character));
  const cnFallback = (id, mapName) =>
    cnMaps[mapName]?.get(id) || jpMaps[mapName]?.get(id) || `ID:${id}`;

  // 名称解析（仅 buildLocalizedChar 需要的内部字段）
  char._tag_names_ja = (char.tag_ids || []).map(id => jpMaps.character_tag?.get(id) || `ID:${id}`);
  char._base_character_name_ja = jpMaps.base_character?.get(char.base_character_id) || '';
  char._base_character_name_cn = cnFallback(char.base_character_id, 'base_character');

  // 构建技能/能力详情
  const { skills: skillDetails, abilities: abilityDetails } = buildSkillAndAbilityDetails(character);

  // 技能 ID 分组
  const skillGroups = buildSkillIdGroups(character);

  // EX 技能 ID
  const extraIds = char.extra_skill_ids || [];
  const normalEx = [];
  const charRules = exRules.filter(r => {
    if (!r.character_ids) return false;
    if (r.character_ids === '*') return true;
    if (Array.isArray(r.character_ids)) return r.character_ids.includes(char.id);
    return false;
  });
  extraIds.forEach((skillId, index) => {
    const matchedRule = charRules.find(r => {
      if (!r.pattern) return false;
      if (r.pattern === '*') return true;
      if (Array.isArray(r.pattern)) return r.pattern.includes(index);
      return false;
    });
    if (matchedRule?.action !== 'hide') normalEx.push(skillId);
  });

  // 恒常化 / FES
  const fesName = getFesName(char.start_at);
  let permanent_status = null;
  let permanent_date = null;
  if (char.initial_rarity > 2) {
    if (permExcludeIds.has(char.id)) {
      permanent_status = '非恒常角色';
      permanent_date = '—';
    } else if (fesName === 'ATELIER FES') {
      permanent_status = '已恒常化';
      permanent_date = 'ATELIER FES';
    } else {
      const gachaEnd = gachaEndMap.get(char.id);
      if (gachaEnd) {
        if (fesName) {
          permanent_status = '已恒常化';
          permanent_date = fesName;
        } else {
          const permDate = new Date(gachaEnd);
          permDate.setDate(permDate.getDate() + 56);
          const permStr = permDate.getFullYear().toString() +
            String(permDate.getMonth() + 1).padStart(2, '0') +
            String(permDate.getDate()).padStart(2, '0');
          permanent_date = permStr;
          permanent_status = (updateTime && updateTime >= permStr) ? '已恒常化' : '未恒常化';
        }
      }
    }
  }

  // UID
  const dateStr = (char.start_at || '2049-12-31').replace(/-/g, '').substring(0, 8);
  const uid = dateStr + String(char.initial_rarity ?? 0) + String(char.id).padStart(5, '0');

  // 支援能力
  const saIdx = Math.min(char.max_rarity - 1, (char.support_ability_ids || []).length - 1);
  const saId = saIdx >= 0 ? (char.support_ability_ids || [])[saIdx] : null;
  let supportAbility = null;
  if (saId != null && abilityDetails[saId]) {
    const sa = abilityDetails[saId];
    supportAbility = { description: sa.description };
    const condMatch = sa.description.match(/^(.+?)(?:の)?時、(.+)$/);
    if (condMatch) {
      const cond = condMatch[1];
      const attrMatch = cond.match(/得意属性が(\S+)属性/);
      const attrNameMap = { '火':5,'氷':6,'雷':7,'風':8,'斬':1,'打':2,'突':3 };
      if (attrMatch) supportAbility.attr = attrNameMap[attrMatch[1]] || null;
      const roleMatch = cond.match(/ブレイカー|ディフェンダー/);
      const roleNameMap = { 'ブレイカー':2, 'ディフェンダー':3 };
      if (roleMatch) supportAbility.role = roleNameMap[roleMatch[0]] || null;
      const tagNames = (cond.match(/「(.+?)」/g) || []).map(t => t.replace(/[「」]/g, ''));
      if (tagNames.length > 0) supportAbility.tag = tagNames.join('、');
    }
  }

  // leader_skill description 处理
  let leaderSkill = null;
  if (char.leader_skill?.description) {
    const lsObj = JSON.parse(JSON.stringify(char.leader_skill));
    bakeDescription(lsObj);
    leaderSkill = { name: lsObj.name || null, description: lsObj.description };
  }

  // 确定 switch 类型
  let sw = null;
  if (char._transform) sw = 'change';
  else if (hasEvolvedSkills(char)) sw = 'evolve';

  // 构建条目
  const entry = {
    id: char.id,
    uid,
    another_name: char.another_name || null,
    fullname: char.fullname || null,
    overlay_name: char.overlay_name || null,
    initial_rarity: char.initial_rarity,
    max_rarity: char.max_rarity,
    role: char.role,
    attack_attributes: char.attack_attributes,

    trait_color_id: char.trait_color_id || null,
    support_color_id: char.support_color_id || null,
    tag_ids: char.tag_ids || [],
    base_character_id: char.base_character_id || null,
    original_title_id: char.original_title_id || null,
    battle_tool_trait_ids: char.battle_tool_trait_ids || [],
    equipment_tool_trait_ids: char.equipment_tool_trait_ids || [],

    start_at: char.start_at ? char.start_at.replace(/-/g, '').substring(0, 8) : null,
    initial_status: char.initial_status,
    has_evo: hasEvolvedSkills(char),
    has_range: (char.extra_skill_ids || []).length > 0 &&
      exRules.some(r => {
        if (!r.character_ids) return false;
        if (r.character_ids === '*') return true;
        if (Array.isArray(r.character_ids)) return r.character_ids.includes(char.id);
        return false;
      }),
    has_transform: transformPairs.some(p => p[0] === char.id),
    has_active: !!(char.active1_skill_id || char.active2_skill_id || char.active3_skill_id),
    has_ex: (char.extra_skill_ids || []).length > 0,
    gacha_end_at: (fesName === 'ATELIER FES') ? null : ((gachaEndMap.get(char.id) || '').replace(/-/g, '') || null),
    permanent_status,
    permanent_date,

    leader_skill: leaderSkill,
    support_ability: supportAbility,

    skills: skillGroups,
    abilities: {
      character: char.ability_ids || [],
      board1: char.board_ability1_ids || [],
      board2: char.board_ability2_ids || [],
      board3: char.board_ability3_ids || [],
      support: char.support_ability_ids || [],
    },
  };

  if (normalEx.length > 0) entry.skills.ex = normalEx;

  // 切换形态
  if (sw) {
    entry.switch = sw;
    if (sw === 'change') {
      const trans = buildCharacterEntry(char._transform);
      const switchStat = diffObjects(entry, trans);
      entry.switch_stat = switchStat;
    } else if (sw === 'evolve') {
      const switchStat = {};
      // 进化后能力（现有逻辑保持不变）
      const evoAbiIds = char.all_skill_evolved_ability_ids || [];
      if (evoAbiIds.length > 0) {
        switchStat.abilities = { ...entry.abilities };
        entry.abilities = { ...entry.abilities };
        entry.abilities.character = (entry.abilities.character || []).filter(id => !evoAbiIds.includes(id));
      }
      // 进化后技能（新增）
      const evoSkills = {};
      for (const [type, fields] of Object.entries(SKILL_TYPE_MAP)) {
        if (!fields.evolvedField) continue;
        const evoIds = toIdArray(character[fields.evolvedField]);
        if (evoIds.length > 0) evoSkills[type] = evoIds;
      }
      if (Object.keys(evoSkills).length > 0) {
        switchStat.skills = evoSkills;
      }
      entry.switch_stat = switchStat;
    }
  }

  // 清理
  delete char._transform;
  delete char._tag_names_ja;
  delete char._base_character_name_ja;
  delete char._base_character_name_cn;

  return entry;
}

// ========== 11. 主流程 ==========
if (!tables.character) { console.error('❌ character.json 未找到'); process.exit(1); }

const excludeFile = path.join(__dirname, '..', 'config', 'exclude.json');
let excludeIds = new Set();
if (fs.existsSync(excludeFile)) {
  const ids = safeReadJSON(excludeFile);
  ids.forEach(id => excludeIds.add(id));
  console.log(`📋 已加载排除角色 ID：${excludeIds.size} 个`);
}

const transformFile = path.join(__dirname, '..', 'config', 'transform.json');
let transformPairs = [];
let hiddenTransformIds = new Set();
if (fs.existsSync(transformFile)) {
  transformPairs = safeReadJSON(transformFile);
  transformPairs.forEach(p => hiddenTransformIds.add(p[1]));
  console.log(`🔄 已加载变身配对：${transformPairs.length} 组`);
}

let visibleCharacters = Array.from(tables.character.values()).filter(c =>
  !excludeIds.has(c.id) && !hiddenTransformIds.has(c.id)
);
console.log(`👥 列表显示角色数量：${visibleCharacters.length}`);

// 卡池结束时间
const gachaEndMap = new Map();
const gachaFile = path.join(rawDir, 'gacha.json');
if (fs.existsSync(gachaFile)) {
  const gachaData = safeReadJSON(gachaFile);
  for (const g of gachaData) {
    if (!g.additional_pieces || !g.end_at) continue;
    const dateStr = g.end_at.substring(0, 10);
    for (const piece of g.additional_pieces) {
      if (!piece.character_ids) continue;
      for (const cid of piece.character_ids) {
        const existing = gachaEndMap.get(cid);
        if (!existing || dateStr < existing) gachaEndMap.set(cid, dateStr);
      }
    }
  }
  console.log(`🎫 已加载卡池数据：${gachaEndMap.size} 个角色有卡池结束时间`);
}

const permExcludeFile = path.join(__dirname, '..', 'config', 'permanent_exclude.json');
const permExcludeIds = new Set();
if (fs.existsSync(permExcludeFile)) {
  const excludeList = safeReadJSON(permExcludeFile);
  for (const id of excludeList) permExcludeIds.add(id);
  console.log(`📋 已加载非恒常角色：${permExcludeIds.size} 个`);
}

let fesConfig = [];
const fesFile = path.join(__dirname, '..', 'config', 'atelier_fes.json');
if (fs.existsSync(fesFile)) { fesConfig = safeReadJSON(fesFile); console.log(`🎪 已加载 ATELIER FES：${fesConfig.length} 个`); }

function getFesName(startAt) {
  if (!startAt) return null;
  const d = startAt.substring(0, 10).replace(/-/g, '/');
  for (const f of fesConfig) { if (d >= f.start_date && d <= f.end_date) return f.name; }
  return null;
}

const now = new Date();
const updateTime = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0');

// 清空输出
if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// ========== 实体文件输出 ==========
function writeEntityFile(name) {
  const langFile = path.join(langDir, `${name}.json`);
  if (!fs.existsSync(langFile)) return;
  const langData = safeReadJSON(langFile, false);
  const output = {};
  for (const t of langData) {
    output[t.id] = { name_ja: t.name, name_cn: t.name_cn || '' };
  }
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(output, null, 2), 'utf-8');
  console.log(`  ✓ ${name}.json (${Object.keys(output).length} 条)`);
}
writeEntityFile('trait_color');
writeEntityFile('base_character');
writeEntityFile('original_title');

// trait 数据（保持现有格式）
function buildTraitOutput(name, buildValues) {
  const rawFile = path.join(rawDir, `${name}.json`);
  if (!fs.existsSync(rawFile)) return;
  const traits = safeReadJSON(rawFile);
  const langFile = path.join(langDir, `${name}.json`);
  const langData = fs.existsSync(langFile) ? safeReadJSON(langFile, false) : [];
  const langMap = new Map(langData.map(t => [t.id, t]));
  const output = [];
  for (const t of traits) {
    const lang = langMap.get(t.id) || {};
    output.push({
      id: t.id, category_id: t.category_id || 0,
      name: lang.name || t.name, name_cn: lang.name_cn || '',
      effect_description: lang.effect_description || '',
      effect_description_cn: lang.effect_description_cn || '',
      values: buildValues(t),
    });
  }
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(output, null, 2), 'utf-8');
  console.log(`  ✓ ${name}.json (${output.length} 条)`);
}
function btValues(t) { return (t.effects || []).map(e => (e.values || []).map(v => v / 100)); }
function etValues(t) {
  if (!t.ability_ids || t.ability_ids.length === 0) return [];
  const firstAbi = tables.ability?.get(t.ability_ids[0]);
  if (!firstAbi) return [];
  const blockCount = firstAbi.effects?.length || 1;
  const vals = [];
  for (let b = 0; b < blockCount; b++) {
    const r = [];
    for (const aid of t.ability_ids) { const abi = tables.ability?.get(aid); const v = abi?.effects?.[b]?.value; if (v != null) r.push(v / 100); }
    if (r.length > 0) vals.push(r);
  }
  return vals;
}
buildTraitOutput('battle_tool_trait', btValues);
buildTraitOutput('equipment_tool_trait', etValues);

// character_tag
const tagRawFile = path.join(rawDir, 'character_tag.json');
if (fs.existsSync(tagRawFile)) {
  const tagRaw = safeReadJSON(tagRawFile);
  const tagLangFile = path.join(langDir, 'character_tag.json');
  const tagLang = fs.existsSync(tagLangFile) ? safeReadJSON(tagLangFile, false) : [];
  const tagLangMap = new Map(tagLang.map(t => [t.id, t]));
  const tagOutput = tagRaw.map(t => ({
    id: t.id, priority: t.priority || 0,
    name: tagLangMap.get(t.id)?.name || t.name,
    name_cn: tagLangMap.get(t.id)?.name_cn || '',
  }));
  fs.writeFileSync(path.join(outDir, 'character_tag.json'), JSON.stringify(tagOutput, null, 2), 'utf-8');
  console.log(`  ✓ character_tag.json (${tagOutput.length} 条)`);
}

// ========== 构建角色索引 + 收集全局技能/能力 ==========
const globalSkills = {};
const globalAbilities = {};
const pairedIds = new Set();
const index = [];

transformPairs.forEach(pair => {
  const [firstId, secondId] = pair;
  pairedIds.add(firstId); pairedIds.add(secondId);
  const firstChar = tables.character.get(firstId);
  const secondChar = tables.character.get(secondId);
  if (!firstChar || !secondChar) { console.warn(`⚠️ 变身配对 ${firstId}-${secondId} 中有角色不存在`); return; }

  const firstData = JSON.parse(JSON.stringify(firstChar));
  const secondData = JSON.parse(JSON.stringify(secondChar));
  firstData._transform = secondChar; // 保留原始引用用于 buildCharacterEntry

  if (!excludeIds.has(firstId)) {
    const entry = buildCharacterEntry(firstData);
    index.push(entry);
    Object.assign(globalSkills, buildSkillAndAbilityDetails(firstChar).skills);
    Object.assign(globalAbilities, buildSkillAndAbilityDetails(firstChar).abilities);
    // switch_stat 中的技能/能力也收集
    if (entry.switch === 'change') {
      const transDetails = buildSkillAndAbilityDetails(secondChar);
      Object.assign(globalSkills, transDetails.skills);
      Object.assign(globalAbilities, transDetails.abilities);
    }
  }
});

visibleCharacters.forEach(char => {
  if (pairedIds.has(char.id)) return;
  const entry = buildCharacterEntry(char);
  index.push(entry);
  const details = buildSkillAndAbilityDetails(char);
  Object.assign(globalSkills, details.skills);
  Object.assign(globalAbilities, details.abilities);
});

fs.writeFileSync(path.join(outDir, 'character_index.json'), JSON.stringify(index, null, 2), 'utf-8');
fs.writeFileSync(path.join(outDir, 'skills.json'), JSON.stringify(globalSkills, null, 2), 'utf-8');
fs.writeFileSync(path.join(outDir, 'abilities.json'), JSON.stringify(globalAbilities, null, 2), 'utf-8');
console.log(`📋 技能一览：${Object.keys(globalSkills).length} 条`);
console.log(`📋 能力一览：${Object.keys(globalAbilities).length} 条`);

// ========== 活动 ==========
const fmtDate2 = d => d ? d.substring(0, 10).replace(/-/g, '') : '';
const eventFile = path.join(rawDir, 'event.json');
if (fs.existsSync(eventFile)) {
  const events = safeReadJSON(eventFile);
  const eventTable = events.filter(e => e.event_type === 1).sort((a,b) => a.id - b.id).map(e => ({
    id: e.id, event_type: e.event_type, start_at: fmtDate2(e.start_at), end_at: fmtDate2(e.end_at),
    name: e.name, revival_start_at: fmtDate2(e.revival_start_at),
  }));
  fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(eventTable, null, 2), 'utf-8');
  console.log(`📋 活动：${eventTable.length} 条`);
}

// ========== 竞技场周期 ==========
const contestFile = path.join(rawDir, 'damage_contest_rotation.json');
const episodeFile = path.join(rawDir, 'episode.json');
if (fs.existsSync(contestFile) && fs.existsSync(episodeFile)) {
  const contests = safeReadJSON(contestFile);
  const episodes = safeReadJSON(episodeFile);
  const epMap = new Map(episodes.map(e => [e.id, e.name]));
  const contestTable = contests.sort((a,b) => a.id - b.id).map(c => ({
    id: c.id, start_at: fmtDate2(c.start_at), episode_name: epMap.get(c.episode_id) || '',
  }));
  fs.writeFileSync(path.join(outDir, 'contest_rotations.json'), JSON.stringify(contestTable, null, 2), 'utf-8');
  console.log(`📋 竞技场周期：${contestTable.length} 条`);
}
console.log(`✅ 已生成角色索引，包含 ${index.length} 个角色`);
