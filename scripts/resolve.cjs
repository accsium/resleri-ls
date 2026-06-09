const fs = require('fs');
const path = require('path');
const config = require('./resolveConfig.cjs');

const pipelineConfig = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config', 'pipeline.json'), 'utf-8'
));
const rawDir = path.join(__dirname, '..', pipelineConfig.dataRawDir);
const langDir = path.join(__dirname, '..', 'language');
const untransDir = path.join(langDir, 'untranslated');
const outDir = path.join(__dirname, '..', 'public', 'data');

// ========== 1. 加载实体表 ==========
const tables = {};
for (const [entityName, entityConfig] of Object.entries(config.entities)) {
  const filePath = path.join(rawDir, entityConfig.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ 文件 ${entityConfig.file} 不存在，跳过实体 ${entityName}`);
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  tables[entityName] = new Map(raw.map(item => [item[entityConfig.idField], item]));
}

// ========== 2. 加载翻译映射表 ==========
function loadJpMap(name) {
  // JP name 从 data_raw 中读取
  const filePath = path.join(rawDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return new Map(raw.map(item => [item.id, item.name]));
  }
  return new Map();
}

function loadCnMap(name) {
  // CN name 从 language/ 中读取
  const filePath = path.join(langDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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

// ========== 3. 加载 EX 技能规则 ==========
const rulesFile = path.join(__dirname, '..', 'config', 'ex_skill_rules.json');
let exRules = [];
if (fs.existsSync(rulesFile)) {
  try {
    exRules = JSON.parse(fs.readFileSync(rulesFile, 'utf-8'));
    console.log(`📋 已加载 EX 技能规则：${exRules.length} 条`);
  } catch (e) {
    console.warn('⚠️ EX 技能规则文件格式错误，将使用默认显示');
  }
}

// ========== 4. 递归补全效果引用 ==========
function resolveEffects(obj, entityName) {
  const entityConfig = config.entities[entityName];
  if (!entityConfig) return obj;
  const resolved = JSON.parse(JSON.stringify(obj));
  if (entityConfig.nestedReferences) {
    for (const [pathStr, refConfig] of Object.entries(entityConfig.nestedReferences)) {
      const parts = pathStr.split('.');
      let targetArray = resolved;
      for (const part of parts) {
        if (targetArray == null) break;
        targetArray = targetArray[part];
      }
      if (targetArray && Array.isArray(targetArray)) {
        targetArray.forEach((item, index) => {
          if (!item) return;
          const refId = item[refConfig.refField];
          const detail = tables[refConfig.target]?.get(refId);
          if (detail) {
            targetArray[index] = { ...item, _detail: resolveEffects(detail, refConfig.target) };
          }
        });
      }
    }
  }
  return resolved;
}

// ========== 5. 收集角色的技能/能力 ID ==========
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
  if (character.leader_skill?.abilities) {
    character.leader_skill.abilities.forEach(a => ids.add(a.ability_id));
  }
  return ids;
}

// ========== 6. 构建技能/能力详情对象 ==========
function buildSkillDetails(character) {
  const skillIds = collectSkillIds(character);
  const details = {};
  skillIds.forEach(id => {
    let obj = tables.skill?.get(id) || tables.ability?.get(id);
    if (obj) {
      obj = resolveEffects(obj, tables.skill?.has(id) ? 'skill' : 'ability');
      details[id] = obj;
    }
  });
  return details;
}

const SKILL_TYPE_MAP = {
  normal1: { idsField: 'normal1_skill_ids', evolvedField: 'evolved_normal1_skill_ids' },
  normal2: { idsField: 'normal2_skill_ids', evolvedField: 'evolved_normal2_skill_ids' },
  burst:   { idsField: 'burst_skill_ids',      evolvedField: 'evolved_burst_skill_ids' },
  active1: { idsField: 'active1_skill_id',     evolvedField: null },
  active2: { idsField: 'active2_skill_id',     evolvedField: null },
  active3: { idsField: 'active3_skill_id',     evolvedField: null },
};

function buildSkillsArray(character, skillDetails) {
  const skillsArray = [];
  for (const [type, fields] of Object.entries(SKILL_TYPE_MAP)) {
    let preIds = [];
    if (fields.idsField.endsWith('_id')) {
      const val = character[fields.idsField];
      if (val != null) preIds = [val];
    } else {
      preIds = character[fields.idsField] || [];
    }
    let postIds = [];
    if (fields.evolvedField) {
      postIds = character[fields.evolvedField] || [];
    }
    preIds = [...new Set(preIds)];
    postIds = [...new Set(postIds)];
    if (preIds.length === 0 && postIds.length === 0) continue;

    const preSkills = preIds.map(id => skillDetails[id]).filter(Boolean);
    const postSkills = postIds.map(id => skillDetails[id]).filter(Boolean);
    preSkills.sort((a, b) => a.id - b.id);
    postSkills.sort((a, b) => a.id - b.id);

    skillsArray.push({
      type: type,
      pre_evolution: preSkills,
      post_evolution: postSkills,
    });
  }
  return skillsArray;
}

// ========== 7. 生成带有双语字段的角色对象 ==========
function buildLocalizedChar(character) {
  const char = JSON.parse(JSON.stringify(character));

  char.tag_names_ja = (char.tag_ids || []).map(id => jpMaps.character_tag?.get(id) || `ID:${id}`);
  char.base_character_name_ja = jpMaps.base_character?.get(char.base_character_id) || `ID:${char.base_character_id}`;
  char.original_title_name_ja = jpMaps.original_title?.get(char.original_title_id) || `ID:${char.original_title_id}`;
  if (char.equipment_tool_trait_ids)
    char.equipment_tool_trait_names_ja = char.equipment_tool_trait_ids.map(id => jpMaps.equipment_tool_trait?.get(id) || `ID:${id}`);
  if (char.trait_color_id != null)
    char.trait_color_name_ja = jpMaps.trait_color?.get(char.trait_color_id) || `ID:${char.trait_color_id}`;
  if (char.support_color_id != null)
    char.support_color_name_ja = jpMaps.trait_color?.get(char.support_color_id) || `ID:${char.support_color_id}`;
  if (char.battle_tool_trait_ids)
    char.battle_tool_trait_names_ja = char.battle_tool_trait_ids.map(id => jpMaps.battle_tool_trait?.get(id) || `ID:${id}`);

  char.tag_names_cn = (char.tag_ids || []).map(id => cnMaps.character_tag?.get(id) || jpMaps.character_tag?.get(id) || `ID:${id}`);
  char.base_character_name_cn = cnMaps.base_character?.get(char.base_character_id) || jpMaps.base_character?.get(char.base_character_id) || `ID:${char.base_character_id}`;
  char.original_title_name_cn = cnMaps.original_title?.get(char.original_title_id) || jpMaps.original_title?.get(char.original_title_id) || `ID:${char.original_title_id}`;
  if (char.equipment_tool_trait_ids)
    char.equipment_tool_trait_names_cn = char.equipment_tool_trait_ids.map(id => cnMaps.equipment_tool_trait?.get(id) || jpMaps.equipment_tool_trait?.get(id) || `ID:${id}`);
  if (char.trait_color_id != null)
    char.trait_color_name_cn = cnMaps.trait_color?.get(char.trait_color_id) || jpMaps.trait_color?.get(char.trait_color_id) || `ID:${char.trait_color_id}`;
  if (char.support_color_id != null)
    char.support_color_name_cn = cnMaps.trait_color?.get(char.support_color_id) || jpMaps.trait_color?.get(char.support_color_id) || `ID:${char.support_color_id}`;
  if (char.battle_tool_trait_ids)
    char.battle_tool_trait_names_cn = char.battle_tool_trait_ids.map(id => cnMaps.battle_tool_trait?.get(id) || jpMaps.battle_tool_trait?.get(id) || `ID:${id}`);

  char._skillDetails = buildSkillDetails(character);
  const targetMapJa = jpMaps.skill_target_type;
  const targetMapCn = cnMaps.skill_target_type;
  if (char._skillDetails) {
    for (const id in char._skillDetails) {
      const skill = char._skillDetails[id];
      if (skill && skill.skill_target_type !== undefined) {
        skill.target_name_ja = targetMapJa?.get(skill.skill_target_type) || `ID:${skill.skill_target_type}`;
        skill.target_name_cn = targetMapCn?.get(skill.skill_target_type) || targetMapJa?.get(skill.skill_target_type) || `ID:${skill.skill_target_type}`;
      }
    }
  }

  char._skills = buildSkillsArray(char, char._skillDetails);

  const extraIds = char.extra_skill_ids || [];
  const normalEx = [];
  const rangeGroups = {};
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
    const action = matchedRule ? matchedRule.action : 'normal';
    const group = matchedRule ? matchedRule.group : null;
    if (action === 'hide') {
      // skip
    } else if (action === 'skill1_inrange') {
      if (!rangeGroups[group]) rangeGroups[group] = { skill1: [], skill2: [] };
      rangeGroups[group].skill1.push(skillId);
    } else if (action === 'skill2_inrange') {
      if (!rangeGroups[group]) rangeGroups[group] = { skill1: [], skill2: [] };
      rangeGroups[group].skill2.push(skillId);
    } else {
      normalEx.push(skillId);
    }
  });
  char._exSkills = normalEx.map(id => char._skillDetails[id]).filter(Boolean);
  char._rangeSkills = {};
  for (const [group, data] of Object.entries(rangeGroups)) {
    const skill1Levels = data.skill1.map(id => char._skillDetails[id]).filter(Boolean);
    const skill2Levels = data.skill2.map(id => char._skillDetails[id]).filter(Boolean);
    if (skill1Levels.length > 0 || skill2Levels.length > 0) {
      char._rangeSkills[group] = { skill1: skill1Levels, skill2: skill2Levels };
    }
  }

  return char;
}

// ========== 8. 精简输出 + switch/switch_stat ==========
const CHAR_KEEP = [
  'id', 'attack_attributes', 'initial_rarity', 'max_rarity',
  'trait_color_id', 'support_color_id',
  'trait_color_name_ja', 'trait_color_name_cn',
  'support_color_name_ja', 'support_color_name_cn',
  'battle_tool_trait_names_ja', 'battle_tool_trait_names_cn',
  'equipment_tool_trait_names_ja', 'equipment_tool_trait_names_cn',
  'battle_tool_trait_ids', 'equipment_tool_trait_ids',
  'leader_skill', 'ability_ids', 'support_ability_ids',
  'board_ability1_ids', 'board_ability2_ids', 'board_ability3_ids',
  '_exSkills',
]

const DETAIL_KEEP = [
  'name', 'id', 'target_name_ja', 'target_name_cn',
  'skill_target_type', 'attack_attributes', 'skill_power_type',
  'description', 'effects', 'wait', 'power', 'break_power', 'limit_count',
]

function hasEvolvedSkills(char) {
  return ['normal1','normal2','burst'].some(p =>
    char[`evolved_${p}_skill_ids`] && char[`evolved_${p}_skill_ids`].length > 0)
}

function slimSkillDetails(details) {
  if (!details) return details
  const out = {}
  for (const [id, obj] of Object.entries(details)) {
    const slim = {}
    for (const k of DETAIL_KEEP) {
      if (obj[k] !== undefined && obj[k] !== null) slim[k] = obj[k]
    }
    out[id] = slim
  }
  return out
}

function pickKeys(obj, keys) {
  const out = {}
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && !(Array.isArray(obj[k]) && obj[k].length === 0))
      out[k] = obj[k]
  }
  return out
}

function diffObjects(base, alt) {
  const diff = {}
  for (const k of Object.keys(alt)) {
    if (JSON.stringify(base[k]) !== JSON.stringify(alt[k])) diff[k] = alt[k]
  }
  return diff
}

function buildSwitchSkills(char, type) {
  if (type === 'evolve') {
    const skills = []
    if (char._skills) {
      for (const group of char._skills) {
        if (group.post_evolution && group.post_evolution.length > 0) {
          skills.push({ type: group.type, skills: group.post_evolution })
        }
      }
    }
    return skills.length > 0 ? skills : null
  }
  if (type === 'range') {
    const skills = []
    const inrange = char._rangeSkills?.inrange
    if (inrange?.skill1?.length > 0) skills.push({ type: 'normal1', skills: inrange.skill1 })
    if (inrange?.skill2?.length > 0) skills.push({ type: 'normal2', skills: inrange.skill2 })
    return skills.length > 0 ? skills : null
  }
  return null
}

function finalizeOutput(char) {
  let sw = null
  if (char._transform) {
    sw = 'change'
  } else if (char._rangeSkills?.inrange) {
    sw = 'range'
  } else if (hasEvolvedSkills(char)) {
    sw = 'evolve'
  }

  let switchStat = null
  if (sw === 'change') {
    const trans = finalizeOutput(char._transform)
    trans.switch = undefined
    trans.switch_stat = undefined
    switchStat = diffObjects(char, trans)
    if (char._skillDetails || trans._skillDetails) {
      switchStat._skillDetails = { ...(char._skillDetails || {}), ...(trans._skillDetails || {}) }
    }
  } else if (sw === 'evolve') {
    switchStat = {}
    const skills = buildSwitchSkills(char, 'evolve')
    if (skills) switchStat._skills = skills
    const evoAbiIds = char.all_skill_evolved_ability_ids || []
    if (evoAbiIds.length > 0) {
      switchStat.ability_ids = char.ability_ids
      char.ability_ids = (char.ability_ids || []).filter(id => !evoAbiIds.includes(id))
    }
    const evoWT = computeWT(char, true)
    const baseWT = computeWT(char, false)
    if (evoWT !== baseWT) switchStat.initial_wt = evoWT
  } else if (sw === 'range') {
    switchStat = {}
    const skills = buildSwitchSkills(char, 'range')
    if (skills) switchStat._skills = skills
    const evoWT = computeWT(char, true)
    const baseWT = computeWT(char, false)
    if (evoWT !== baseWT) switchStat.initial_wt = evoWT
  }

  const slimDetails = slimSkillDetails(char._skillDetails)
  if (switchStat?._skillDetails) {
    switchStat._skillDetails = slimSkillDetails(switchStat._skillDetails)
  }

  const out = pickKeys(char, CHAR_KEEP)
  out._skillDetails = slimDetails
  out.initial_wt = computeWT(char, true)
  // 基表 _skills：pre_evolution → { type, skills }
  if (char._skills) {
    out._skills = char._skills
      .map(g => ({ type: g.type, skills: g.pre_evolution }))
      .filter(g => g.skills && g.skills.length > 0)
  }
  if (sw) {
    out.switch = sw
    out.switch_stat = switchStat
  }

  function clean(obj) {
    if (Array.isArray(obj)) return obj
    if (obj && typeof obj === 'object') {
      const result = {}
      for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === undefined || v === '' || v === false) continue
        if (Array.isArray(v) && v.length === 0) continue
        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(clean(v)).length === 0) continue
        result[k] = typeof v === 'object' ? clean(v) : v
      }
      return result
    }
    return obj
  }

  return clean(out)
}

// ========== 8. 生成索引条目 ==========
function buildIndexEntry(character) {

  // 恒常化 + FES
  const fesName = getFesName(character.start_at);
  let permanent_status = null;
  let permanent_date = null;
  if (character.initial_rarity > 2) {
    if (permExcludeIds.has(character.id)) {
      permanent_status = '非恒常角色';
      permanent_date = '—';
    } else {
      if (fesName === 'ATELIER FES') {
        // 初始角色，属于 ATELIER FES I，不需要卡池数据
        permanent_status = '已恒常化';
        permanent_date = 'ATELIER FES I';
      } else {
        const gachaEnd = gachaEndMap.get(character.id);
        if (!gachaEnd) {
          permanent_status = null;
          permanent_date = null;
        } else if (fesName) {
          permanent_status = '已恒常化';
          permanent_date = fesName;
        } else {
          const permDate = new Date(gachaEnd);
          permDate.setDate(permDate.getDate() + 56);
          const permStr = permDate.toISOString().substring(0, 10);
          permanent_date = permStr;
          permanent_status = (updateTime && updateTime >= permStr) ? '已恒常化' : '未恒常化';
        }
      }
    }
  }

  const entry = {
    id: character.id,
    name_ja: character.name,
    name_cn: character.name,
    another_name: character.another_name,
    fullname: character.fullname || null,
    overlay_name: character.overlay_name || null,
    initial_rarity: character.initial_rarity,
    max_rarity: character.max_rarity,
    role: character.role,
    tag_count: (character.tag_ids || []).length,
    attack_attributes: character.attack_attributes,
    tag_names_ja: (character.tag_ids || []).map(id => jpMaps.character_tag?.get(id) || `ID:${id}`),
    tag_names_cn: (character.tag_ids || []).map(id => cnMaps.character_tag?.get(id) || jpMaps.character_tag?.get(id) || `ID:${id}`),
    trait_color_id: character.trait_color_id || null,
    support_color_id: character.support_color_id || null,
    start_at: character.start_at || null,
    initial_status: character.initial_status,
    alt_initial_wt: computeWT(character, true),
    base_initial_wt: computeWT(character, false),
    trait_color_name_ja: jpMaps.trait_color?.get(character.trait_color_id) || null,
    trait_color_name_cn: cnMaps.trait_color?.get(character.trait_color_id) || null,
    support_color_name_ja: jpMaps.trait_color?.get(character.support_color_id) || null,
    support_color_name_cn: cnMaps.trait_color?.get(character.support_color_id) || null,
    battle_tool_trait_ids: character.battle_tool_trait_ids || [],
    battle_tool_trait_names_ja: (character.battle_tool_trait_ids || []).map(id => jpMaps.battle_tool_trait?.get(id) || ''),
    battle_tool_trait_names_cn: (character.battle_tool_trait_ids || []).map(id => cnMaps.battle_tool_trait?.get(id) || ''),
    equipment_tool_trait_ids: character.equipment_tool_trait_ids || [],
    equipment_tool_trait_names_ja: (character.equipment_tool_trait_ids || []).map(id => jpMaps.equipment_tool_trait?.get(id) || ''),
    equipment_tool_trait_names_cn: (character.equipment_tool_trait_ids || []).map(id => cnMaps.equipment_tool_trait?.get(id) || ''),
    base_character_name_ja: jpMaps.base_character?.get(character.base_character_id) || null,
    base_character_name_cn: cnMaps.base_character?.get(character.base_character_id) || null,
    original_title_id: character.original_title_id || null,	    original_title_name_ja: jpMaps.original_title?.get(character.original_title_id) || null,
	    original_title_name_cn: cnMaps.original_title?.get(character.original_title_id) || null,
	    has_evo: !!(
	      (character.evolved_normal1_skill_ids && character.evolved_normal1_skill_ids.length > 0) ||
	      (character.evolved_normal2_skill_ids && character.evolved_normal2_skill_ids.length > 0) ||
	      (character.evolved_burst_skill_ids && character.evolved_burst_skill_ids.length > 0)
	    ),
	    has_range: (character.extra_skill_ids || []).length > 0 &&
	      exRules.some(r => {
	        if (!r.character_ids) return false
	        if (r.character_ids === '*') return true
	        if (Array.isArray(r.character_ids)) return r.character_ids.includes(character.id)
	        return false
	      }),
	    has_transform: transformPairs.some(p => p[0] === character.id),
	    has_active: !!(character.active1_skill_id || character.active2_skill_id || character.active3_skill_id),
	    has_ex: (character.extra_skill_ids || []).length > 0,
    gacha_end_at: (fesName === 'ATELIER FES') ? null : (gachaEndMap.get(character.id) || null),
    permanent_status,
    permanent_date,
    leader_skill_name: character.leader_skill?.name || null,
    leader_skill_description: character.leader_skill?.description || null,
  };

  // ── 亚空支援能力 ──
  const saIdx = Math.min(character.max_rarity - 1, (character.support_ability_ids || []).length - 1);
  const saId = saIdx >= 0 ? (character.support_ability_ids || [])[saIdx] : null;
  const saDetail = saId != null ? (character._skillDetails || {})[saId] : null;
  if (saDetail) {
    // 解析描述中 {0} {1} 为具体数值
    let saDesc = saDetail.description || '';
    (saDetail.effects || []).forEach((eff, i) => {
      saDesc = saDesc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100);
    });
    entry.support_ability_description = saDesc;

    // 解析条件：按 の時、 或 時、 拆分
    const condMatch = saDetail.description.match(/^(.+?)(?:の)?時、(.+)$/);
    if (condMatch) {
      const cond = condMatch[1];
      // 属性
      const attrMatch = cond.match(/得意属性が(\S+)属性/);
      const attrNameMap = { '火':5,'氷':6,'雷':7,'風':8,'斬':1,'打':2,'突':3 };
      entry.support_ability_attr = attrMatch ? (attrNameMap[attrMatch[1]] || null) : null;
      // 职业
      const roleMatch = cond.match(/ブレイカー|ディフェンダー/);
      const roleNameMap = { 'ブレイカー':2, 'ディフェンダー':3 };
      entry.support_ability_role = roleMatch ? (roleNameMap[roleMatch[0]] || null) : null;
      // 标签（构建 JP→CN 查找）
      const tagNames = (cond.match(/「(.+?)」/g) || []).map(t => t.replace(/[「」]/g, ''));
      if (tagNames.length > 0) {
        const tagCnLookup = {};
        for (const [id, nameJa] of jpMaps.character_tag || []) {
          tagCnLookup[nameJa] = cnMaps.character_tag?.get(id) || nameJa;
        }
        entry.support_ability_tag_ja = tagNames.join('、');
        entry.support_ability_tag_cn = tagNames.map(n => tagCnLookup[n] || n).join('、');
      } else {
        entry.support_ability_tag_ja = null;
        entry.support_ability_tag_cn = null;
      }
    } else {
      entry.support_ability_attr = null;
      entry.support_ability_role = null;
      entry.support_ability_tag_ja = null;
      entry.support_ability_tag_cn = null;
    }
  } else {
    entry.support_ability_description = null;
    entry.support_ability_attr = null;
    entry.support_ability_role = null;
    entry.support_ability_tag_ja = null;
    entry.support_ability_tag_cn = null;
  }

  // 预计算图片文件大小
  const imgPath = path.join(__dirname, '..', 'image', 'character', `${character.id}.png`);
  if (fs.existsSync(imgPath)) {
    entry.image_size = fs.statSync(imgPath).size;
  }

  return entry;
}

function computeWT(character, useEvolved) {
  const speed = character.initial_status?.speed;
  if (speed == null || speed <= 0) return null;
  let wait = 0;
  // 范围角色：切换后 normal2 来自 _rangeSkills
  if (useEvolved && character._rangeSkills?.inrange?.skill2) {
    const skills = character._rangeSkills.inrange.skill2;
    if (skills.length > 0) {
      const maxId = Math.max(...skills.map(s => s.id));
      const skill = skills.find(s => s.id === maxId);
      if (skill && typeof skill.wait === 'number') wait = skill.wait;
    }
  } else {
    const field = useEvolved ? 'evolved_normal2_skill_ids' : 'normal2_skill_ids';
    const ids = character[field];
    if (ids && ids.length > 0) {
      const maxId = Math.max(...ids);
      const skill = tables.skill?.get(maxId);
      if (skill && typeof skill.wait === 'number') wait = skill.wait;
    }
  }
  return Math.floor(57600 / speed + wait);
}

// ========== 9. 主流程 ==========
if (!tables.character) {
  console.error('❌ character.json 未找到');
  process.exit(1);
}

const excludeFile = path.join(__dirname, '..', 'config', 'exclude.json');
let excludeIds = new Set();
if (fs.existsSync(excludeFile)) {
  const ids = JSON.parse(fs.readFileSync(excludeFile, 'utf-8'));
  ids.forEach(id => excludeIds.add(id));
  console.log(`📋 已加载排除角色 ID：${excludeIds.size} 个`);
}

const transformFile = path.join(__dirname, '..', 'config', 'transform.json');
let transformPairs = [];
let hiddenTransformIds = new Set();
if (fs.existsSync(transformFile)) {
  const pairs = JSON.parse(fs.readFileSync(transformFile, 'utf-8'));
  transformPairs = pairs;
  pairs.forEach(pair => {
    hiddenTransformIds.add(pair[1]);
  });
  console.log(`🔄 已加载变身配对：${pairs.length} 组`);
}

let visibleCharacters = Array.from(tables.character.values()).filter(c =>
  !excludeIds.has(c.id) && !hiddenTransformIds.has(c.id)
);
console.log(`👥 列表显示角色数量：${visibleCharacters.length}`);

// ========== 处理卡池结束时间 ==========
const gachaEndMap = new Map(); // character_id → earliest end_at (YYYY-MM-DD)
const gachaFile = path.join(rawDir, 'gacha.json');
if (fs.existsSync(gachaFile)) {
  const gachaData = JSON.parse(fs.readFileSync(gachaFile, 'utf-8'));
  for (const g of gachaData) {
    if (!g.additional_pieces || !g.end_at) continue;
    const dateStr = g.end_at.substring(0, 10); // YYYY-MM-DD
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

// ========== 加载非恒常角色配置 ==========
const permExcludeFile = path.join(__dirname, '..', 'config', 'permanent_exclude.json');
const permExcludeIds = new Set();
if (fs.existsSync(permExcludeFile)) {
  const excludeList = JSON.parse(fs.readFileSync(permExcludeFile, 'utf-8'));
  for (const id of excludeList) permExcludeIds.add(id);
  console.log(`📋 已加载非恒常角色：${permExcludeIds.size} 个`);
}

// ========== 加载 ATELIER FES 配置 ==========
let fesConfig = [];
const fesFile = path.join(__dirname, '..', 'config', 'atelier_fes.json');
if (fs.existsSync(fesFile)) {
  fesConfig = JSON.parse(fs.readFileSync(fesFile, 'utf-8'));
  console.log(`🎪 已加载 ATELIER FES：${fesConfig.length} 个`);
}

function getFesName(startAt) {
  if (!startAt) return null;
  const d = startAt.substring(0, 10).replace(/-/g, '/');
  for (const f of fesConfig) {
    if (d >= f.start_date && d <= f.end_date) return f.name;
  }
  return null;
}

const updateTime = new Date().toISOString();
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });
const charOutDir = path.join(outDir, 'character');
fs.mkdirSync(charOutDir, { recursive: true });

// 输出词条数据到 public/data/（翻译由 translations.cjs 处理）
function buildTraitOutput(name, buildValues) {
  const rawFile = path.join(rawDir, `${name}.json`);
  if (!fs.existsSync(rawFile)) return;
  const traits = JSON.parse(fs.readFileSync(rawFile, 'utf-8'));

  const langFile = path.join(langDir, `${name}.json`);
  const langData = fs.existsSync(langFile) ? JSON.parse(fs.readFileSync(langFile, 'utf-8')) : [];
  const langMap = new Map(langData.map(t => [t.id, t]));

  const output = [];
  for (const t of traits) {
    const lang = langMap.get(t.id) || {};
    output.push({
      id: t.id,
      category_id: t.category_id || 0,
      name: lang.name || t.name,
      name_cn: lang.name_cn || '',
      effect_description: lang.effect_description || '',
      effect_description_cn: lang.effect_description_cn || '',
      values: buildValues(t),
    });
  }
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(output, null, 2), 'utf-8');
  console.log(`  ✓ ${name}.json (${output.length} 条)`);
}

function btValues(t) {
  return (t.effects || []).map(e => (e.values || []).map(v => v / 100));
}
function etValues(t) {
  if (!t.ability_ids || t.ability_ids.length === 0) return [];
  const firstAbi = tables.ability?.get(t.ability_ids[0]);
  if (!firstAbi) return [];
  const blockCount = firstAbi.effects?.length || 1;
  const vals = [];
  for (let b = 0; b < blockCount; b++) {
    const r = [];
    for (const aid of t.ability_ids) {
      const abi = tables.ability?.get(aid);
      const v = abi?.effects?.[b]?.value;
      if (v != null) r.push(v / 100);
    }
    if (r.length > 0) vals.push(r);
  }
  return vals;
}

buildTraitOutput('battle_tool_trait', btValues);
buildTraitOutput('equipment_tool_trait', etValues);

// 输出 character_tag（含 priority 用于排序）
const tagRawFile = path.join(rawDir, 'character_tag.json')
if (fs.existsSync(tagRawFile)) {
  const tagRaw = JSON.parse(fs.readFileSync(tagRawFile, 'utf-8'))
  const tagLangFile = path.join(langDir, 'character_tag.json')
  const tagLang = fs.existsSync(tagLangFile) ? JSON.parse(fs.readFileSync(tagLangFile, 'utf-8')) : []
  const tagLangMap = new Map(tagLang.map(t => [t.id, t]))
  const tagOutput = tagRaw.map(t => ({
    id: t.id,
    priority: t.priority || 0,
    name: tagLangMap.get(t.id)?.name || t.name,
    name_cn: tagLangMap.get(t.id)?.name_cn || '',
  }))
  fs.writeFileSync(path.join(outDir, 'character_tag.json'), JSON.stringify(tagOutput, null, 2), 'utf-8')
  console.log(`  ✓ character_tag.json (${tagOutput.length} 条)`)
}

const pairedIds = new Set();
const index = [];

transformPairs.forEach(pair => {
  const [firstId, secondId] = pair;
  pairedIds.add(firstId);
  pairedIds.add(secondId);

  const firstChar = tables.character.get(firstId);
  const secondChar = tables.character.get(secondId);
  if (!firstChar || !secondChar) {
    console.warn(`⚠️ 变身配对 ${firstId}-${secondId} 中有角色不存在`);
    return;
  }

  const firstData = buildLocalizedChar(firstChar);
  const secondData = buildLocalizedChar(secondChar);
  const merged = { ...firstData, _transform: secondData };
  if (!excludeIds.has(firstId)) {
    const entry = buildIndexEntry(firstData);
    entry.alt_initial_wt = computeWT(secondData, false);
    index.push(entry);
  }
  const finalMerged = finalizeOutput(merged);
  fs.writeFileSync(path.join(charOutDir, `${firstId}.json`), JSON.stringify(finalMerged, null, 2), 'utf-8');
});

visibleCharacters.forEach(char => {
  if (pairedIds.has(char.id)) return;
  const localizedChar = buildLocalizedChar(char);
  index.push(buildIndexEntry(localizedChar));
  const finalChar = finalizeOutput(localizedChar);
  fs.writeFileSync(path.join(charOutDir, `${char.id}.json`), JSON.stringify(finalChar, null, 2), 'utf-8');
});

fs.writeFileSync(path.join(outDir, 'character_index.json'), JSON.stringify(index, null, 2), 'utf-8');

// ========== 10. 构建技能一览 ==========
const STATE_LABEL = {
  evolve: ['进化前', '进化後'],
  range:  ['内圈', '外圈'],
  change: ['変身後', '变身前'],
}

function addSkillRow(charId, entry, type, state, skill) {
  const isHeal = skill.skill_power_type && [5,6,7].includes(skill.skill_power_type)
  const isDmg  = skill.skill_power_type && [1,2,3,4].includes(skill.skill_power_type)
  // 替换描述占位符
  let desc = skill.description || ''
  if (skill.effects && Array.isArray(skill.effects)) {
    for (let i = 0; i < skill.effects.length; i++) {
      const v = skill.effects[i]?.value
      if (v != null) desc = desc.replace(new RegExp('\\{' + i + '\\}', 'g'), v)
    }
  }
  const stt = skill.skill_target_type
  skillsTable.push({
    char_id: charId,
    base_name_ja: entry.base_character_name_ja,
    base_name_cn: entry.base_character_name_cn,
    another_name: entry.another_name || '',
    type,
    state,
    skill_target_type: stt ?? null,
    target_name_ja: '',
    target_name_cn: stt != null ? (cnMaps.skill_target_type?.get(stt) || `ID:${stt}`) : '',
    attack_attributes: skill.attack_attributes || [],
    dmg_power: isDmg ? (skill.power ?? null) : null,
    break_power: skill.break_power ?? null,
    heal_power: isHeal ? (skill.power ?? null) : null,
    wait: skill.wait ?? null,
    limit_count: skill.limit_count || null,
    name: skill.name || '',
    description: desc,
  })
}

// 补全 skill_target_type 的 JP 名称（language/ 而非 data_raw/)
const sttFile = path.join(langDir, 'skill_target_type.json')
const sttPatch = new Map()
if (fs.existsSync(sttFile)) {
  JSON.parse(fs.readFileSync(sttFile, 'utf-8')).forEach(t => sttPatch.set(t.id, t.name))
}

const skillsTable = []

for (const entry of index) {
  const charFile = path.join(charOutDir, `${entry.id}.json`)
  if (!fs.existsSync(charFile)) continue
  const char = JSON.parse(fs.readFileSync(charFile, 'utf-8'))

  // 计算本角色的基础/切换状态标签
  const baseState = char.switch ? STATE_LABEL[char.switch]?.[0] || '—' : '—'
  const altState = char.switch ? STATE_LABEL[char.switch]?.[1] || null : null

  // 基础技能
  if (char._skills) {
    for (const g of char._skills) {
      if (!g.skills || g.skills.length === 0) continue
      addSkillRow(entry.id, entry, g.type, baseState, g.skills[g.skills.length - 1])
    }
  }

  // 切换后技能
  if (altState && char.switch_stat?._skills) {
    for (const g of char.switch_stat._skills) {
      if (!g.skills || g.skills.length === 0) continue
      addSkillRow(entry.id, entry, g.type, altState, g.skills[g.skills.length - 1])
    }
  }

  // EX技能（取每类最高级）—— 基础状态
  if (char._exSkills) {
    const exArr = Array.isArray(char._exSkills) ? char._exSkills : Object.values(char._exSkills)
    const exMap = new Map()
    for (const skill of exArr) {
      const key = skill.name || '_'
      const cur = exMap.get(key)
      if (!cur || skill.id > cur.id) exMap.set(key, skill)
    }
    for (const skill of exMap.values()) {
      addSkillRow(entry.id, entry, 'ex', '—', skill)
    }
  }
  // EX技能 —— 切换后状态（仅变身角色有独立的 EX 技能）
  if (char.switch_stat?._exSkills) {
    const exArr = Array.isArray(char.switch_stat._exSkills) ? char.switch_stat._exSkills : Object.values(char.switch_stat._exSkills)
    const exMap = new Map()
    for (const skill of exArr) {
      const key = skill.name || '_'
      const cur = exMap.get(key)
      if (!cur || skill.id > cur.id) exMap.set(key, skill)
    }
    for (const skill of exMap.values()) {
      addSkillRow(entry.id, entry, 'ex', altState || '—', skill)
    }
  }
}

// 用 language/ 数据补全 target_name_ja
for (const row of skillsTable) {
  const stt = row.skill_target_type
  if (stt != null) {
    const name = sttPatch.get(stt)
    if (name) row.target_name_ja = name
  }
}

fs.writeFileSync(path.join(outDir, 'skills.json'), JSON.stringify(skillsTable, null, 2), 'utf-8')
console.log(`📋 技能一览：${skillsTable.length} 条`)

// ========== 11. 活动 ==========
const fmtDate2 = d => d ? d.substring(0, 10).replace(/-/g, '/') : ''
const eventFile = path.join(rawDir, 'event.json')
if (fs.existsSync(eventFile)) {
  const events = JSON.parse(fs.readFileSync(eventFile, 'utf-8'))
  const eventTable = events
    .filter(e => e.event_type === 1)
    .sort((a, b) => a.id - b.id)
    .map(e => ({
      id: e.id,
      event_type: e.event_type,
      start_at: fmtDate2(e.start_at),
      end_at: fmtDate2(e.end_at),
      name: e.name,
      revival_start_at: fmtDate2(e.revival_start_at),
    }))
  fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(eventTable, null, 2), 'utf-8')
  console.log(`📋 活动：${eventTable.length} 条`)
}

// ========== 12. 竞技场周期 ==========
const contestFile = path.join(rawDir, 'damage_contest_rotation.json')
const episodeFile = path.join(rawDir, 'episode.json')
if (fs.existsSync(contestFile) && fs.existsSync(episodeFile)) {
  const contests = JSON.parse(fs.readFileSync(contestFile, 'utf-8'))
  const episodes = JSON.parse(fs.readFileSync(episodeFile, 'utf-8'))
  const epMap = new Map(episodes.map(e => [e.id, e.name]))
  const contestTable = contests
    .sort((a, b) => a.id - b.id)
    .map(c => ({
      id: c.id,
      start_at: fmtDate2(c.start_at),
      episode_name: epMap.get(c.episode_id) || '',
    }))
  fs.writeFileSync(path.join(outDir, 'contest_rotations.json'), JSON.stringify(contestTable, null, 2), 'utf-8')
  console.log(`📋 竞技场周期：${contestTable.length} 条`)
}

// 生成元数据（构建时间）
const meta = { build_time: new Date().toISOString() };
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
console.log(`🕒 构建时间已写入 meta.json`);

console.log(`✅ 已生成角色文件，索引包含 ${index.length} 个角色`);
