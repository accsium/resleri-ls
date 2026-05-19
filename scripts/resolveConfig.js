// 实体定义与引用关系配置
const config = {
  entities: {
    character: {
      file: 'character.json',
      idField: 'id',
      references: {
        // 技能类 ID → 指向 skill
        normal1_skill_ids: 'skill',
        normal2_skill_ids: 'skill',
        burst_skill_ids: 'skill',
        evolved_normal1_skill_ids: 'skill',
        evolved_normal2_skill_ids: 'skill',
        evolved_burst_skill_ids: 'skill',
        extra_skill_ids: 'skill',
        // 能力/被动类 ID → 指向 ability
        ability_ids: 'ability',
        board_ability1_ids: 'ability',
        board_ability2_ids: 'ability',
        board_ability3_ids: 'ability',
        all_skill_evolved_ability_ids: 'ability',
        support_ability_ids: 'ability',
      },
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
      references: {},
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
      references: {},
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
      idField: 'id',
      references: {}    // 叶子实体，无引用
    }
  }
};

module.exports = config;