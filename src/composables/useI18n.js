import { ref } from 'vue'

const UI_TEXT = {
  ja: {
    pageTitle: 'レスレリ 角色图鉴',
    searchPlaceholder: '名前で検索...',
    skillSection: 'スキル',
    abilityTitle: '能力',
    leaderSkillSection: 'リーダースキル',
    joinDate: '加入日',
    attribute: '属性',
    role: 'ロール',
    none: 'なし',
    loading: '読み込み中...',
    loadFailed: '読み込み失敗',
    maxRarityLabel: '最大レアリティ：',
    target: '対象', power: '威力', break: 'ブレイク', wt: 'WT', limit: '制限',
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
    searchPlaceholder: '搜索角色名称...',
    skillSection: '技能',
    abilityTitle: '能力',
    leaderSkillSection: '队长技能',
    joinDate: '加入日期',
    attribute: '属性',
    role: '职业',
    none: '无',
    loading: '加载中...',
    loadFailed: '加载失败',
    maxRarityLabel: '最大星级：',
    target: '对象', power: '威力', break: '破防', wt: 'WT', limit: '限制',
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

const TRAIT_COLOR_HEX = { 1: '#3498DB', 2: '#9B59B6', 3: '#F1C40F', 4: '#E74C3C', 5: '#2ECC71' }

const SORT_FIELDS = [
  { field: 'start_at',        label_ja: '実装日',          label_cn: '实装日期',     priority: 0 },
  { field: 'initial_rarity',  label_ja: '初期レアリティ',  label_cn: '初始稀有度',    priority: 1 },
  { field: 'id',              label_ja: 'ID',                label_cn: 'ID',              priority: 2 },
  { field: 'max_rarity',      label_ja: '最大レアリティ',  label_cn: '最大稀有度',    priority: 3 },
  { field: 'role',            label_ja: 'ロール',           label_cn: '职业',             priority: 4 },
  { field: 'base_character_id', label_ja: 'ベースキャラ',  label_cn: '原型',             priority: 5 },
  { field: 'original_title_id', label_ja: 'シリーズ',      label_cn: '系列',             priority: 6 },
  { field: 'trait_color_id',  label_ja: '調和色-左',        label_cn: '调和颜色-左',   priority: 7 },
  { field: 'support_color_id', label_ja: '調和色-右',       label_cn: '调和颜色-右',   priority: 8 }
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

  return { currentLang, t, getField, setLang, getTraitColorHex, SORT_FIELDS, TRAIT_COLOR_HEX }
}
