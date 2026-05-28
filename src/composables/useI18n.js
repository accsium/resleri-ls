import { ref } from 'vue'

const UI_TEXT = {
  ja: {
    pageTitle: 'レスレリ 角色图鉴',
    searchPlaceholder: 'キャラ・スキル・アビリティを検索...',
    skillSection: 'スキル',
    abilityTitle: '能力',
    leaderSkillSection: 'リーダースキル',
    joinDate: '加入日',
    gachaEnd: '卡池结束',
    permanentDate: '恒常状態',
    permanentTime: '恒常化日',
    attribute: '属性',
    role: 'ロール',
    none: 'なし',
    loading: '読み込み中...',
    loadFailed: '読み込み失敗',
    maxRarityLabel: '最大レアリティ：',
    target: '対象', dmgPower: 'ダメージ倍率', breakPower: 'ブレイク倍率', healPower: '回復倍率', wt: 'WT', limit: '制限',
    level: 'Lv. ',
    initialWTLabel: '初期WT',
    skillType: { normal1: 'スキル1', normal2: 'スキル2', burst: 'バーストスキル', active: 'アクティブスキル', extra: 'EXスキル' },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    supportAbilityTitle: '亜空支援能力',
    navGuide: '角色図鑑',
    navCollection: 'キャラコレクション',
    collectionPlaceholder: 'コレクション機能は近日公開',
    applyFilter: '適用', clearFilter: 'クリア',
  },
  cn: {
    pageTitle: '蕾斯莱莉 角色图鉴',
    searchPlaceholder: '搜索角色、技能、能力...',
    skillSection: '技能',
    abilityTitle: '能力',
    leaderSkillSection: '队长技能',
    joinDate: '加入日期',
    gachaEnd: '卡池结束',
    permanentDate: '恒常化状态',
    permanentTime: '恒常化时间',
    attribute: '属性',
    role: '职业',
    none: '无',
    loading: '加载中...',
    loadFailed: '加载失败',
    maxRarityLabel: '最大星级：',
    target: '对象', dmgPower: '伤害倍率', breakPower: '破防倍率', healPower: '治疗倍率', wt: 'WT', limit: '限制',
    level: 'Lv. ',
    initialWTLabel: '初始WT',
    skillType: { normal1: '第一技能', normal2: '第二技能', burst: '爆发技能', active: '主动技能', extra: 'EX技能' },
    level: 'Lv. ',
    initialWTLabel: '初始WT',
    skillType: { normal1: '第一技能', normal2: '第二技能', burst: '爆发技能', active: '主动技能', extra: 'EX技能' },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    supportAbilityTitle: '亚空支援能力',
    navGuide: '角色图鉴',
    navCollection: '角色收藏',
    collectionPlaceholder: '收藏功能即将上线',
    applyFilter: '应用筛选', clearFilter: '清除',
  }
}

const ATTR_MAP    = { 1: '斬', 2: '打', 3: '突', 5: '火', 6: '氷', 7: '雷', 8: '風' }
const ATTR_MAP_CN = { 1: '斩', 2: '打', 3: '突', 5: '火', 6: '冰', 7: '雷', 8: '风' }
const ROLE_MAP    = { 1: '攻', 2: '破', 3: '防', 4: '輔' }
const ROLE_MAP_CN = { 1: '攻', 2: '破', 3: '防', 4: '辅' }
const TRAIT_COLOR_HEX = { 1: '#3498DB', 2: '#9B59B6', 3: '#F1C40F', 4: '#E74C3C', 5: '#2ECC71' }

const SORT_CATEGORIES = [
  {
    key: 'character',
    label_ja: 'キャラ情報',
    label_cn: '角色信息',
    fields: [
      { field: 'start_at',        label_ja: '実装日',     label_cn: '加入时间' },
      { field: 'initial_rarity',  label_ja: '初期レア',   label_cn: '初始稀有度' },
      { field: 'id',              label_ja: 'ID',          label_cn: 'ID' },
      { field: 'base_character_name', label_ja: '名前',   label_cn: '名字' },
      { field: 'fullname',        label_ja: 'フルネーム', label_cn: '全名' },
      { field: 'overlay_name',    label_ja: '作品',       label_cn: '作品出处' },
      { field: 'tag_count',       label_ja: 'タグ数',     label_cn: '标签数' },
    ]
  },
  {
    key: 'stats',
    label_ja: '基礎ステータス',
    label_cn: '基础数值',
    fields: [
      { field: 'initial_wt',      label_ja: '初期WT',     label_cn: '初始WT' },
      { field: 'hp',              label_ja: 'HP',          label_cn: 'HP' },
      { field: 'speed',           label_ja: '速度',       label_cn: '速度' },
      { field: 'attack',          label_ja: '物攻',       label_cn: '物攻' },
      { field: 'defense',         label_ja: '物防',       label_cn: '物防' },
      { field: 'magic',           label_ja: '魔攻',       label_cn: '魔攻' },
      { field: 'mental',          label_ja: '魔防',       label_cn: '魔防' },
    ]
  },
  {
    key: 'skill',
    label_ja: 'スキル',
    label_cn: '技能数值',
  }
]

const SKILL_TYPE_OPTS = [
  { key: 'normal1', label_ja: 'スキル1', label_cn: '一技能' },
  { key: 'normal2', label_ja: 'スキル2', label_cn: '二技能' },
  { key: 'burst',   label_ja: 'バースト', label_cn: '爆发技能' },
]

const SKILL_STAT_OPTS = [
  { key: 'dmg_power',   label_ja: 'ダメージ倍率', label_cn: '伤害倍率' },
  { key: 'break_power', label_ja: 'ブレイク倍率', label_cn: '破防倍率' },
  { key: 'heal_power',  label_ja: '回復倍率',     label_cn: '治疗倍率' },
  { key: 'wait',        label_ja: 'WT',            label_cn: 'WT' },
]

const currentLang = ref('cn')

export function useI18n() {
  function t(key) {
    return UI_TEXT[currentLang.value]?.[key] || key
  }

  function getField(obj, field) {
    if (currentLang.value === 'cn' && obj[field + '_cn'] !== undefined) {
      return obj[field + '_cn']
    }
    return obj[field + '_ja'] || obj[field] || ''
  }

  function setLang(lang) {
    currentLang.value = lang
  }

  function getTraitColorHex(id) {
    return TRAIT_COLOR_HEX[id] || '#CCCCCC'
  }

  return { currentLang, t, getField, setLang, getTraitColorHex, SORT_CATEGORIES, SKILL_TYPE_OPTS, SKILL_STAT_OPTS, TRAIT_COLOR_HEX, ATTR_MAP, ATTR_MAP_CN, ROLE_MAP, ROLE_MAP_CN }
}
