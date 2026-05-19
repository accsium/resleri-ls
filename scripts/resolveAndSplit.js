const fs = require('fs');
const path = require('path');
const config = require('./resolveConfig');

const dataDir = path.join(__dirname, '..', 'data');
const publicDataDir = path.join(__dirname, '..', 'public', 'data');

// ========== 1. 加载所有实体表 ==========
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

// ========== 2. 加载日文和中文映射表 ==========
function loadMapFile(name) {
  const filePath = path.join(dataDir, 'jp', `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // 转换为 Map: id -> name
    if (Array.isArray(raw)) {
      return new Map(raw.map(item => [item.id, item.name]));
    } else if (typeof raw === 'object') {
      // 对象格式 { "50001": { "name": "..." } }
      const map = new Map();
      for (const [id, obj] of Object.entries(raw)) {
        map.set(Number(id), obj.name || id);
      }
      return map;
    }
  }
  return new Map();
}

const jpMaps = {
  tag: loadMapFile('character_tag'),
  base_character: loadMapFile('base_character'),
  equipment_tool_trait: loadMapFile('equipment_tool_trait'),
  original_title: loadMapFile('original_title'),
  attack_attribute: loadMapFile('attack_attribute'),
  role: loadMapFile('role'),
};

const cnMaps = {};
for (const key of Object.keys(jpMaps)) {
  const filePath = path.join(dataDir, 'cn', `${key}.json`);
  if (fs.existsSync(filePath)) {
    cnMaps[key] = loadMapFile(key); // 会从 cn 目录加载
  } else {
    cnMaps[key] = jpMaps[key]; // 回退到日文
  }
}

// ========== 3. 收集角色的所有技能/能力 ID（不修改角色对象） ==========
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

// 递归补全效果引用（沿用配置中的 nestedReferences 定义）
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

// 构建角色的 _skillDetails 字典
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

// ========== 4. 生成特定语言的角色对象 ==========
function buildLocalizedChar(character, lang) {
  const maps = lang === 'cn' ? cnMaps : jpMaps;
  const char = JSON.parse(JSON.stringify(character)); // 深拷贝

  // 替换映射字段（保留原始 id，添加 _name 字段）
  char.tag_names = (char.tag_ids || []).map(id => maps.tag?.get(id) || `ID:${id}`);
  char.base_character_name = maps.base_character?.get(char.base_character_id) || `ID:${char.base_character_id}`;
  char.original_title_name = maps.original_title?.get(char.original_title_id) || `ID:${char.original_title_id}`;
  // 属性名称数组（attack_attributes 是数组）
char.attack_attribute_names = (char.attack_attributes || []).map(id => maps.attack_attribute?.get(id) || `ID:${id}`);

// 定位名称
char.role_name = maps.role?.get(char.role) || `ID:${char.role}`;
  // 如果需要 equipment_tool_trait 名称，可类似添加，但角色数据中可能只有 id 数组
  if (char.equipment_tool_trait_ids) {
    char.equipment_tool_trait_names = char.equipment_tool_trait_ids.map(id => maps.equipment_tool_trait?.get(id) || `ID:${id}`);
  }

  // 附加技能详情（语言无关）
  char._skillDetails = buildSkillDetails(character);

  return char;
}

// ========== 5. 生成索引条目 ==========
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
    tag_names: (character.tag_ids || []).map(id => maps.tag?.get(id) || `ID:${id}`),
	attack_attribute_names: (character.attack_attributes || []).map(id => maps.attack_attribute?.get(id) || `ID:${id}`),
    role_name: maps.role?.get(character.role) || `ID:${character.role}`,
  };
}

// ========== 6. 主流程 ==========
if (!tables.character) {
  console.error('❌ character.json 未找到，无法生成角色数据');
  process.exit(1);
}

const characters = Array.from(tables.character.values());

// 清空旧文件
['jp', 'cn'].forEach(lang => {
  const dir = path.join(publicDataDir, lang);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
});

// 生成两种语言的文件
['jp', 'cn'].forEach(lang => {
  const index = [];

  characters.forEach(char => {
    const localizedChar = buildLocalizedChar(char, lang);

    // 保存角色文件
    const charFilePath = path.join(publicDataDir, lang, `${char.id}.json`);
    fs.writeFileSync(charFilePath, JSON.stringify(localizedChar, null, 2), 'utf-8');

    // 添加到索引
    index.push(buildIndexEntry(char, lang));
  });

  // 保存索引文件
  const indexFilePath = path.join(publicDataDir, lang, 'character_index.json');
  fs.writeFileSync(indexFilePath, JSON.stringify(index, null, 2), 'utf-8');
});

console.log(`✅ 已生成 ${characters.length} 个角色的日文/中文数据文件`);
