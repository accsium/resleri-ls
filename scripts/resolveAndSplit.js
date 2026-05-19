const fs = require('fs');
const path = require('path');
const config = require('./resolveConfig');

const dataDir = path.join(__dirname, '..', 'data');
const outputDir = path.join(__dirname, '..', 'public', 'data', 'characters');

// ========== 1. 加载所有实体表 ==========
const tables = {};
for (const [entityName, entityConfig] of Object.entries(config.entities)) {
  const filePath = path.join(dataDir, entityConfig.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ 文件 ${entityConfig.file} 不存在，跳过实体 ${entityName}`);
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  // 转为 Map，以 idField 为键快速查找
  tables[entityName] = new Map(raw.map(item => [item[entityConfig.idField], item]));
}

// ========== 2. 递归补全引用 ==========
function resolveRefs(obj, entityName) {
  const entityConfig = config.entities[entityName];
  if (!entityConfig) return obj;

  const resolved = JSON.parse(JSON.stringify(obj));  // 深拷贝

  // 处理简单的数组引用（如 normal1_skill_ids → skill）
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

  // 处理嵌套引用（如 effects 数组、leader_skill.abilities）
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
            targetArray[index] = {
              ...item,
              _detail: resolveRefs(detail, refConfig.target)
            };
          }
        });
      }
    }
  }

  return resolved;
}

// ========== 3. 处理角色并输出文件 ==========
// 清空旧文件（避免残留已删除的角色）
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

const characters = tables.character ? Array.from(tables.character.values()) : [];
const index = [];

characters.forEach(char => {
  const fullChar = resolveRefs(char, 'character');

  // 生成轻量索引条目（只取排序/筛选需要的字段，注意不要包含技能等大对象）
  index.push({
    id: fullChar.id,
    name: fullChar.name,
    another_name: fullChar.another_name,
    initial_rarity: fullChar.initial_rarity,
    max_rarity: fullChar.max_rarity,
    role: fullChar.role,
    attack_attributes: fullChar.attack_attributes,
    tag_ids: fullChar.tag_ids,
    // 可根据需要添加更多用于列表的字段，但请保持轻量
  });

  // 保存完整角色文件
  fs.writeFileSync(
    path.join(outputDir, `${fullChar.id}.json`),
    JSON.stringify(fullChar, null, 2),
    'utf-8'
  );
});

// 保存索引文件
fs.writeFileSync(
  path.join(outputDir, '..', 'character_index.json'),
  JSON.stringify(index, null, 2),
  'utf-8'
);

console.log(`✅ 已生成 ${characters.length} 个角色文件及索引`);