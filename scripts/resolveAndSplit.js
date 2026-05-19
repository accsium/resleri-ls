const fs = require('fs');
const path = require('path');
const config = require('./resolveConfig');

const dataDir = path.join(__dirname, '..', 'data');
const outputDir = path.join(__dirname, '..', 'public', 'data', 'characters');

// 1. 加载所有实体表
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

// 2. 递归补全函数
function resolveRefs(obj, entityName) {
  const entityConfig = config.entities[entityName];
  if (!entityConfig) return obj;
  const resolved = JSON.parse(JSON.stringify(obj));

  if (entityConfig.references) {
    for (const [field, targetEntity] of Object.entries(entityConfig.references)) {
      if (resolved[field] && Array.isArray(resolved[field])) {
        resolved[field] = resolved[field].map(id => {
          const detail = tables[targetEntity]?.get(id);
          return detail ? resolveRefs(detail, targetEntity) : id;
        });
      }
    }
  }

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
            targetArray[index] = { ...item, _detail: resolveRefs(detail, refConfig.target) };
          }
        });
      }
    }
  }
  return resolved;
}

// 3. 处理角色
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

const characters = tables.character ? Array.from(tables.character.values()) : [];
const index = [];

characters.forEach(char => {
  const fullChar = resolveRefs(char, 'character');
  index.push({
    id: fullChar.id,
    name: fullChar.name,
    another_name: fullChar.another_name,
    initial_rarity: fullChar.initial_rarity,
    max_rarity: fullChar.max_rarity,
    role: fullChar.role,
    attack_attributes: fullChar.attack_attributes,
    tag_ids: fullChar.tag_ids,
  });

  fs.writeFileSync(
    path.join(outputDir, `${char.id}.json`),
    JSON.stringify(fullChar, null, 2),
    'utf-8'
  );
});

// 保存索引
fs.writeFileSync(
  path.join(outputDir, '..', 'character_index.json'),
  JSON.stringify(index, null, 2),
  'utf-8'
);

console.log(`✅ 已生成 ${characters.length} 个角色文件及索引`);
