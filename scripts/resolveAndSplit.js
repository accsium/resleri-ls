const fs = require('fs');
const path = require('path');
const config = require('./resolveConfig');

const dataDir = path.join(__dirname, '..', 'data');
const publicDataDir = path.join(__dirname, '..', 'public', 'data');

// ========== 1. 加载实体表 ==========
const tables = {};
for (const [entityName, entityConfig] of Object.entries(config.entities)) {
  const filePath = path.join(dataDir, entityConfig.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ 文件 ${entityConfig.file} 不存在，跳过实体 ${entityName}`);
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  tables[entityName] = new Map(raw.map(item => [item[entityConfig.idField], item]));
}

// ========== 2. 加载翻译映射表（支持 name_cn） ==========
function loadMapFile(name, lang) {
  const folder = lang === 'cn' ? 'cn' : 'jp';
  const filePath = path.join(dataDir, folder, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(raw)) {
      return new Map(raw.map(item => [
        item.id,
        lang === 'cn' ? (item.name_cn || item.name) : item.name
      ]));
    } else if (typeof raw === 'object') {
      const map = new Map();
      for (const [id, obj] of Object.entries(raw)) {
        map.set(Number(id), lang === 'cn' ? (obj.name_cn || obj.name) : obj.name);
      }
      return map;
    }
  }
  return new Map();
}

const jpMaps = {};
const cnMaps = {};
// support_color 与 trait_color 共用同一张表
const mapKeys = [
  'character_tag', 'base_character', 'equipment_tool_trait',
  'original_title', 'attack_attribute', 'role', 'skill_target_type',
  'trait_color', 'battle_tool_trait'
];
mapKeys.forEach(key => {
  jpMaps[key] = loadMapFile(key, 'ja');
  cnMaps[key] = loadMapFile(key, 'cn');
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

// 计算 sort_id
function calcSortId(character) {
  if (character.start_at) {
    const dateStr = character.start_at.substring(0, 10).replace(/-/g, ''); // YYYYMMDD
    const yymmdd = dateStr.substring(2); // YYMMDD
    return parseInt(yymmdd + String(character.id).padStart(5, '0'));
  }
  // 如果没有 start_at，则放到最后（用一个非常大的数字）
  return 9999999999999;
}

// ========== 7. 生成带有双语字段的角色对象 ==========
function buildLocalizedChar(character) {
  const char = JSON.parse(JSON.stringify(character));

  // 日文名称
  char.tag_names_ja = (char.tag_ids || []).map(id => jpMaps.character_tag?.get(id) || `ID:${id}`);
  char.base_character_name_ja = jpMaps.base_character?.get(char.base_character_id) || `ID:${char.base_character_id}`;
  char.original_title_name_ja = jpMaps.original_title?.get(char.original_title_id) || `ID:${char.original_title_id}`;
  char.attack_attribute_names_ja = (char.attack_attributes || []).map(id => jpMaps.attack_attribute?.get(id) || `ID:${id}`);
  char.role_name_ja = jpMaps.role?.get(char.role) || `ID:${char.role}`;
  if (char.equipment_tool_trait_ids) {
    char.equipment_tool_trait_names_ja = char.equipment_tool_trait_ids.map(id => jpMaps.equipment_tool_trait?.get(id) || `ID:${id}`);
  }
  if (char.trait_color_id != null) {
    char.trait_color_name_ja = jpMaps.trait_color?.get(char.trait_color_id) || `ID:${char.trait_color_id}`;
  }
  if (char.support_color_id != null) {
    char.support_color_name_ja = jpMaps.trait_color?.get(char.support_color_id) || `ID:${char.support_color_id}`;
  }
  if (char.battle_tool_trait_ids) {
    char.battle_tool_trait_names_ja = char.battle_tool_trait_ids.map(id => jpMaps.battle_tool_trait?.get(id) || `ID:${id}`);
  }

  // 中文名称（若映射不存在则回退到日文）
  char.tag_names_cn = (char.tag_ids || []).map(id => cnMaps.character_tag?.get(id) || jpMaps.character_tag?.get(id) || `ID:${id}`);
  char.base_character_name_cn = cnMaps.base_character?.get(char.base_character_id) || jpMaps.base_character?.get(char.base_character_id) || `ID:${char.base_character_id}`;
  char.original_title_name_cn = cnMaps.original_title?.get(char.original_title_id) || jpMaps.original_title?.get(char.original_title_id) || `ID:${char.original_title_id}`;
  char.attack_attribute_names_cn = (char.attack_attributes || []).map(id => cnMaps.attack_attribute?.get(id) || jpMaps.attack_attribute?.get(id) || `ID:${id}`);
  char.role_name_cn = cnMaps.role?.get(char.role) || jpMaps.role?.get(char.role) || `ID:${char.role}`;
  if (char.equipment_tool_trait_ids) {
    char.equipment_tool_trait_names_cn = char.equipment_tool_trait_ids.map(id => cnMaps.equipment_tool_trait?.get(id) || jpMaps.equipment_tool_trait?.get(id) || `ID:${id}`);
  }
  if (char.trait_color_id != null) {
    char.trait_color_name_cn = cnMaps.trait_color?.get(char.trait_color_id) || jpMaps.trait_color?.get(char.trait_color_id) || `ID:${char.trait_color_id}`;
  }
  if (char.support_color_id != null) {
    char.support_color_name_cn = cnMaps.trait_color?.get(char.support_color_id) || jpMaps.trait_color?.get(char.support_color_id) || `ID:${char.support_color_id}`;
  }
  if (char.battle_tool_trait_ids) {
    char.battle_tool_trait_names_cn = char.battle_tool_trait_ids.map(id => cnMaps.battle_tool_trait?.get(id) || jpMaps.battle_tool_trait?.get(id) || `ID:${id}`);
  }

  // 技能/能力详情
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

  // EX 技能处理
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

  // 计算 sort_id
  char.sort_id = calcSortId(character);

  return char;
}

// ========== 8. 生成索引条目（双语） ==========
function buildIndexEntry(character) {
  return {
    id: character.id,
    name_ja: character.name,
    name_cn: character.name,
    another_name: character.another_name,
    initial_rarity: character.initial_rarity,
    max_rarity: character.max_rarity,
    role: character.role,
    attack_attributes: character.attack_attributes,
    tag_names_ja: (character.tag_ids || []).map(id => jpMaps.character_tag?.get(id) || `ID:${id}`),
    tag_names_cn: (character.tag_ids || []).map(id => cnMaps.character_tag?.get(id) || jpMaps.character_tag?.get(id) || `ID:${id}`),
    attack_attribute_names_ja: (character.attack_attributes || []).map(id => jpMaps.attack_attribute?.get(id) || `ID:${id}`),
    attack_attribute_names_cn: (character.attack_attributes || []).map(id => cnMaps.attack_attribute?.get(id) || jpMaps.attack_attribute?.get(id) || `ID:${id}`),
    role_name_ja: jpMaps.role?.get(character.role) || `ID:${character.role}`,
    role_name_cn: cnMaps.role?.get(character.role) || jpMaps.role?.get(character.role) || `ID:${character.role}`,
    base_character_id: character.base_character_id || null,
    original_title_id: character.original_title_id || null,
    trait_color_id: character.trait_color_id || null,
    support_color_id: character.support_color_id || null,
    start_at: character.start_at || null,
    sort_id: calcSortId(character),   // 关键字段
  };
}

// ========== 9. 主流程 ==========
if (!tables.character) {
  console.error('❌ character.json 未找到');
  process.exit(1);
}

// 读取排除列表
const excludeFile = path.join(__dirname, '..', 'config', 'exclude.txt');
let excludeIds = new Set();
if (fs.existsSync(excludeFile)) {
  const content = fs.readFileSync(excludeFile, 'utf-8');
  content.split(/\r?\n/).forEach(line => {
    const id = parseInt(line.trim());
    if (!isNaN(id)) excludeIds.add(id);
  });
  console.log(`📋 已加载排除角色 ID：${excludeIds.size} 个`);
}

// 读取变身配置（数组对）
const transformFile = path.join(__dirname, '..', 'config', 'transform.json');
let transformPairs = [];
let hiddenTransformIds = new Set();
if (fs.existsSync(transformFile)) {
  const pairs = JSON.parse(fs.readFileSync(transformFile, 'utf-8'));
  transformPairs = pairs;
  pairs.forEach(pair => {
    hiddenTransformIds.add(pair[1]);   // 第二个 ID 隐藏
  });
  console.log(`🔄 已加载变身配对：${pairs.length} 组`);
}

// 过滤角色（排除列表中的角色、变身隐藏角色均不加入索引）
let visibleCharacters = Array.from(tables.character.values()).filter(c =>
  !excludeIds.has(c.id) && !hiddenTransformIds.has(c.id)
);
console.log(`👥 列表显示角色数量：${visibleCharacters.length}`);

// 输出目录
const outDir = publicDataDir;
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

const pairedIds = new Set();
const index = [];

// 处理变身配对：生成合并文件
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
  fs.writeFileSync(path.join(outDir, `${firstId}.json`), JSON.stringify(merged, null, 2), 'utf-8');

  if (!excludeIds.has(firstId)) {
    index.push(buildIndexEntry(firstChar));
  }
});

// 处理其他角色
visibleCharacters.forEach(char => {
  if (pairedIds.has(char.id)) return;
  const localizedChar = buildLocalizedChar(char);
  fs.writeFileSync(path.join(outDir, `${char.id}.json`), JSON.stringify(localizedChar, null, 2), 'utf-8');
  index.push(buildIndexEntry(char));
});

// 保存索引
fs.writeFileSync(path.join(outDir, 'character_index.json'), JSON.stringify(index, null, 2), 'utf-8');

console.log(`✅ 已生成角色文件，索引包含 ${index.length} 个角色`);