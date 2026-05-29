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
  '_exSkills',
]

const DETAIL_KEEP = [
  'name', 'id', 'target_name_ja', 'target_name_cn',
  'skill_target_type', 'attack_attributes',
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
  // 预计算搜索文本：技能名/描述 + 能力名/描述
  const searchParts = [];
  if (character._skillDetails) {
    for (const detail of Object.values(character._skillDetails)) {
      if (detail.name) searchParts.push(detail.name);
      if (detail.description) searchParts.push(detail.description);
      if (detail.summary) searchParts.push(detail.summary);
    }
  }

  // 恒常化 + FES
  const fesName = getFesName(character.start_at);
  let permanent_status = null;
  let permanent_date = null;
  if (character.initial_rarity > 2) {
    if (permExcludeIds.has(character.id)) {
      permanent_status = '非恒常角色';
      permanent_date = '-';
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
    battle_tool_trait_names_ja: (character.battle_tool_trait_ids || []).map(id => jpMaps.battle_tool_trait?.get(id) || ''),
    battle_tool_trait_names_cn: (character.battle_tool_trait_ids || []).map(id => cnMaps.battle_tool_trait?.get(id) || ''),
    equipment_tool_trait_names_ja: (character.equipment_tool_trait_ids || []).map(id => jpMaps.equipment_tool_trait?.get(id) || ''),
    equipment_tool_trait_names_cn: (character.equipment_tool_trait_ids || []).map(id => cnMaps.equipment_tool_trait?.get(id) || ''),
    base_character_name_ja: jpMaps.base_character?.get(character.base_character_id) || null,
    base_character_name_cn: cnMaps.base_character?.get(character.base_character_id) || null,
	    original_title_name_ja: jpMaps.original_title?.get(character.original_title_id) || null,
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
    _search_text: searchParts.join(' '),
    gacha_end_at: (fesName === 'ATELIER FES') ? null : (gachaEndMap.get(character.id) || null),
    permanent_status,
    permanent_date,
    leader_skill_name: character.leader_skill?.name || null,
    leader_skill_description: character.leader_skill?.description || null,
  };

  // 技能范围（用于筛选）
  for (const prefix of ['normal1', 'normal2', 'burst']) {
    const target = getSkillStat(character, prefix, 'skill_target_type', true);
    entry[`${prefix}_target_type`] = target;
  }

  // 技能排序字段（进化后 / 进化前）
  for (const prefix of ['normal1', 'normal2', 'burst']) {
    for (const stat of ['power', 'break_power', 'wait']) {
      const val = getSkillStat(character, prefix, stat, true);
      entry[`alt_${prefix}_${stat}`] = val;
      entry[`base_${prefix}_${stat}`] = getSkillStat(character, prefix, stat, false);
    }
    // 分离伤害/治疗倍率
    for (const variant of ['alt', 'base']) {
      const useEvo = variant === 'alt';
      const powerType = getSkillPowerType(character, prefix, useEvo);
      const pow = entry[`${variant}_${prefix}_power`];
      const isDmg = powerType && [1,2,3,4].includes(powerType);
      const isHeal = powerType && [5,6,7].includes(powerType);
      entry[`${variant}_${prefix}_dmg_power`] = isDmg ? pow : null;
      entry[`${variant}_${prefix}_heal_power`] = isHeal ? pow : null;
    }
  }

  return entry;
}

function getSkillPowerType(character, prefix, useEvolved) {
  if (useEvolved && character._rangeSkills?.inrange) {
    const rangeKey = prefix === 'normal1' ? 'skill1' : prefix === 'normal2' ? 'skill2' : null;
    if (rangeKey) {
      const skills = character._rangeSkills.inrange[rangeKey];
      if (skills && skills.length > 0) {
        const maxId = Math.max(...skills.map(s => s.id));
        const skill = skills.find(s => s.id === maxId);
        if (skill) return skill.skill_power_type;
      }
    }
  }
  const field = useEvolved ? `evolved_${prefix}_skill_ids` : `${prefix}_skill_ids`;
  const ids = character[field];
  if (!ids || ids.length === 0) return null;
  const maxId = Math.max(...ids);
  const skill = tables.skill?.get(maxId);
  return skill?.skill_power_type;
}

function getSkillStat(character, prefix, stat, useEvolved) {
  // 范围角色：切换后 normal1/2 来自 _rangeSkills
  if (useEvolved && character._rangeSkills?.inrange) {
    const rangeKey = prefix === 'normal1' ? 'skill1' : prefix === 'normal2' ? 'skill2' : null;
    if (rangeKey) {
      const skills = character._rangeSkills.inrange[rangeKey];
      if (skills && skills.length > 0) {
        const maxId = Math.max(...skills.map(s => s.id));
        const skill = skills.find(s => s.id === maxId);
        if (skill) return skill[stat] ?? null;
      }
    }
  }
  const field = useEvolved ? `evolved_${prefix}_skill_ids` : `${prefix}_skill_ids`;
  const ids = character[field];
  if (!ids || ids.length === 0) return null;
  const maxId = Math.max(...ids);
  const skill = tables.skill?.get(maxId);
  if (!skill) return null;
  return skill[stat] ?? null;
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
    for (const prefix of ['normal1', 'normal2', 'burst']) {
      for (const stat of ['power', 'break_power', 'wait']) {
        entry[`alt_${prefix}_${stat}`] = getSkillStat(secondData, prefix, stat, false);
      }
    }
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

// 生成元数据（构建时间）
const meta = { build_time: new Date().toISOString() };
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
console.log(`🕒 构建时间已写入 meta.json`);

console.log(`✅ 已生成角色文件，索引包含 ${index.length} 个角色`);
