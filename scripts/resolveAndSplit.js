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

// ========== 2. 加载翻译映射表 ==========
function loadMapFile(name, lang) {
  const folder = lang === 'cn' ? 'cn' : 'jp';
  const filePath = path.join(dataDir, folder, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(raw)) {
      return new Map(raw.map(item => [item.id, item.name]));
    } else if (typeof raw === 'object') {
      const map = new Map();
      for (const [id, obj] of Object.entries(raw)) {
        map.set(Number(id), obj.name || id);
      }
      return map;
    }
  }
  return new Map();
}

const jpMaps = {};
const cnMaps = {};
const mapKeys = [
  'character_tag', 'base_character', 'equipment_tool_trait',
  'original_title', 'attack_attribute', 'role', 'skill_target_type'
];
mapKeys.forEach(key => {
  jpMaps[key] = loadMapFile(key, 'ja');
  cnMaps[key] = loadMapFile(key, 'cn');
  if (cnMaps[key].size === 0) cnMaps[key] = jpMaps[key];
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

// ========== 6. 构建 _skillDetails 字典 ==========
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

// 技能位类型定义
const SKILL_TYPE_MAP = {
  normal1: { idsField: 'normal1_skill_ids', evolvedField: 'evolved_normal1_skill_ids' },
  normal2: { idsField: 'normal2_skill_ids', evolvedField: 'evolved_normal2_skill_ids' },
  burst:   { idsField: 'burst_skill_ids',      evolvedField: 'evolved_burst_skill_ids' },
  active1: { idsField: 'active1_skill_id',     evolvedField: null },
  active2: { idsField: 'active2_skill_id',     evolvedField: null },
  active3: { idsField: 'active3_skill_id',     evolvedField: null },
};

// 构建技能组数组
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

// ========== 7. 生成特定语言的角色对象 ==========
function buildLocalizedChar(character, lang) {
  const maps = lang === 'cn' ? cnMaps : jpMaps;
  const char = JSON.parse(JSON.stringify(character));

  char.tag_names = (char.tag_ids || []).map(id => maps.character_tag?.get(id) || `ID:${id}`);
  char.base_character_name = maps.base_character?.get(char.base_character_id) || `ID:${char.base_character_id}`;
  char.original_title_name = maps.original_title?.get(char.original_title_id) || `ID:${char.original_title_id}`;
  char.attack_attribute_names = (char.attack_attributes || []).map(id => maps.attack_attribute?.get(id) || `ID:${id}`);
  char.role_name = maps.role?.get(char.role) || `ID:${char.role}`;
  if (char.equipment_tool_trait_ids) {
    char.equipment_tool_trait_names = char.equipment_tool_trait_ids.map(id => maps.equipment_tool_trait?.get(id) || `ID:${id}`);
  }

  char._skillDetails = buildSkillDetails(character);

  // 为技能添加 target_name
  const targetMap = maps.skill_target_type;
  if (targetMap && char._skillDetails) {
    for (const id in char._skillDetails) {
      const skill = char._skillDetails[id];
      if (skill && skill.skill_target_type !== undefined) {
        skill.target_name = targetMap.get(skill.skill_target_type) || `ID:${skill.skill_target_type}`;
      }
    }
  }

  // 生成技能组数组（不含 EX 技能）
  char._skills = buildSkillsArray(char, char._skillDetails);

  // ---------- 处理 EX 技能 ----------
  const extraIds = char.extra_skill_ids || [];
  const normalEx = [];
  const rangeGroups = {}; // { groupName: { skill1: [...ids], skill2: [...ids] } }

  const charRules = exRules.filter(r => {
      if (!r.character_ids) return false;
      if (r.character_ids === '*') return true;   // 通配符：匹配所有角色
      if (Array.isArray(r.character_ids)) return r.character_ids.includes(char.id);
      return false;
    });

  extraIds.forEach((skillId, index) => {
    const matchedRule = charRules.find(r => {
      if (!r.pattern) return false;
      if (r.pattern === '*') return true;   // 通配符：匹配所有索引
      if (Array.isArray(r.pattern)) return r.pattern.includes(index);
      return false;
    });
    const action = matchedRule ? matchedRule.action : 'normal';
    const group = matchedRule ? matchedRule.group : null;

    if (action === 'hide') {
      // 不加入任何列表
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
      char._rangeSkills[group] = {
        skill1: skill1Levels,
        skill2: skill2Levels
      };
    }
  }

  return char;
}

// ========== 8. 生成索引条目 ==========
function buildIndexEntry(character, lang) {
  const maps = lang === 'cn' ? cnMaps : jpMaps;
  return {
    id: character.id,
    name: character.name,
    another_name: character.another_name,
    initial_rarity: character.initial_rarity,
    max_rarity: character.max_rarity,
    role: character.role,
    attack_attributes: character.attack_attributes,
    tag_names: (character.tag_ids || []).map(id => maps.character_tag?.get(id) || `ID:${id}`),
    attack_attribute_names: (character.attack_attributes || []).map(id => maps.attack_attribute?.get(id) || `ID:${id}`),
    role_name: maps.role?.get(character.role) || `ID:${character.role}`,
  };
}

// ========== 9. 主流程 ==========
if (!tables.character) {
  console.error('❌ character.json 未找到');
  process.exit(1);
}

// 读取排除角色列表
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

let characters = Array.from(tables.character.values()).filter(c => !excludeIds.has(c.id));
console.log(`👥 有效角色数量：${characters.length}（共 ${tables.character.size} 个，排除 ${tables.character.size - characters.length} 个）`);

['jp', 'cn'].forEach(lang => {
  const langDir = path.join(publicDataDir, lang);
  if (fs.existsSync(langDir)) {
    fs.rmSync(langDir, { recursive: true, force: true });
  }
  fs.mkdirSync(langDir, { recursive: true });

  const index = [];
  characters.forEach(char => {
    const localizedChar = buildLocalizedChar(char, lang);
    fs.writeFileSync(
      path.join(langDir, `${char.id}.json`),
      JSON.stringify(localizedChar, null, 2),
      'utf-8'
    );
    index.push(buildIndexEntry(char, lang));
  });

  fs.writeFileSync(
    path.join(langDir, 'character_index.json'),
    JSON.stringify(index, null, 2),
    'utf-8'
  );

  console.log(`✅ [${lang}] 已生成 ${characters.length} 个角色文件及索引`);
});