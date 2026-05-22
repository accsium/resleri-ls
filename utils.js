// ========== 多语言文本 ==========
const UI_TEXT = {
  ja: {
    pageTitle: 'レスレリ 角色图鉴',
    searchPlaceholder: '名前で検索...',
    skillSection: 'スキル',
    abilitySection: 'アビリティ',
    leaderSkillSection: 'リーダースキル',
    joinDate: '加入日',
    attribute: '属性',
    role: 'ロール',
    alchemist: '錬金術士',
    yes: 'はい', no: 'いいえ', none: 'なし',
    loading: '読み込み中...',
    loadFailed: '読み込み失敗',
    initial: '初期', max: '最大',
    maxRarityLabel: '最大レアリティ：',
    target: '対象', power: '威力', break: 'ブレイク', wt: 'WT', limit: '制限',
    switchText: '切替',
    level: 'Lv. ',
    initialWTLabel: '初期WT',
    skillType: { normal1: 'スキル1', normal2: 'スキル2', burst: 'バーストスキル', active: 'アクティブスキル', extra: 'EXスキル' },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    abilityTitle: '能力',
    supportAbilityTitle: '亜空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '並べ替え', filterLabel: 'フィルター', applyFilter: '適用', clearFilter: 'クリア',
    synthesisTitle: '調和',
    battleTraitTitle: 'バトルアイテム特性',
    equipTraitTitle: '装備アイテム特性',
    navGuide: '角色図鑑',
    navCollection: 'キャラコレクション',
    collectionPlaceholder: 'コレクション機能は近日公開'
  },
  cn: {
    pageTitle: '蕾斯莱莉 角色图鉴',
    searchPlaceholder: '搜索角色名称...',
    skillSection: '技能',
    abilitySection: '能力',
    leaderSkillSection: '队长技能',
    joinDate: '加入日期',
    attribute: '属性',
    role: '职业',
    alchemist: '炼金术士',
    yes: '是', no: '否', none: '无',
    loading: '加载中...',
    loadFailed: '加载失败',
    initial: '初期', max: '最大',
    maxRarityLabel: '最大星级：',
    target: '对象', power: '威力', break: '破防', wt: 'WT', limit: '限制',
    switchText: '切换',
    level: 'Lv. ',
    initialWTLabel: '初始WT',
    skillType: { normal1: '第一技能', normal2: '第二技能', burst: '爆发技能', active: '主动技能', extra: 'EX技能' },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    abilityTitle: '能力',
    supportAbilityTitle: '亚空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '排序', filterLabel: '筛选', applyFilter: '应用筛选', clearFilter: '清除',
    synthesisTitle: '调和',
    battleTraitTitle: '战斗道具特性',
    equipTraitTitle: '装备道具特性',
    navGuide: '角色图鉴',
    navCollection: '角色收藏',
    collectionPlaceholder: '收藏功能即将上线'
  }
};

const COLOR_MAP = {
  '赤': '#E74C3C', '青': '#3498DB', '緑': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '红': '#E74C3C', '蓝': '#3498DB', '绿': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '白': '#FFFFFF', '黒': '#333333', '黑': '#333333'
};

let currentLang = 'cn';
let cardStates = {};

const SORT_FIELDS = [
  { field: 'start_at', label_ja: '実装日', label_cn: '实装日期', priority: 0 },
  { field: 'initial_rarity', label_ja: '初期レアリティ', label_cn: '初始稀有度', priority: 1 },
  { field: 'id', label_ja: 'ID', label_cn: 'ID', priority: 2 },
  { field: 'max_rarity', label_ja: '最大レアリティ', label_cn: '最大稀有度', priority: 3 },
  { field: 'role', label_ja: 'ロール', label_cn: '职业', priority: 4 },
  { field: 'base_character_id', label_ja: 'ベースキャラ', label_cn: '原型', priority: 5 },
  { field: 'original_title_id', label_ja: 'シリーズ', label_cn: '系列', priority: 6 },
  { field: 'trait_color_id', label_ja: '調和色-左', label_cn: '调和颜色-左', priority: 7 },
  { field: 'support_color_id', label_ja: '調和色-右', label_cn: '调和颜色-右', priority: 8 }
];

function t(k) { return UI_TEXT[currentLang][k] || k; }
function getField(o, f) {
  if (currentLang === 'cn' && o[f+'_cn'] !== undefined) return o[f+'_cn'];
  return o[f+'_ja'] || o[f] || '';
}
function rarityToStars(r) {
  const map = {1:'★',2:'★★',3:'★★★',4:'★★★☆',5:'★★★★',6:'★★★★☆',7:'★★★★★',8:'★★★★★★'};
  return map[r] || '★'.repeat(r);
}
function getColorHex(n) { return n ? (COLOR_MAP[n] || '#CCCCCC') : '#CCCCCC'; }