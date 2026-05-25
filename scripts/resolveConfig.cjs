// 实体定义与引用关系配置
const config = {
  entities: {
    character: {
      file: 'character.json',
      idField: 'id',
      nestedReferences: {
        // 队长技能中的能力引用
        'leader_skill.abilities': {
          arrayField: 'abilities',
          refField: 'ability_id',
          target: 'ability'
        }
      }
    },

    skill: {
      file: 'skill.json',
      idField: 'id',
      nestedReferences: {
        'effects': {
          arrayField: 'effects',
          refField: 'id',
          target: 'effect'
        }
      }
    },

    ability: {
      file: 'ability.json',
      idField: 'id',
      nestedReferences: {
        'effects': {
          arrayField: 'effects',
          refField: 'id',
          target: 'effect'
        }
      }
    },

    effect: {
      file: 'effect.json',
      idField: 'id'
    }
  }
};

module.exports = config;