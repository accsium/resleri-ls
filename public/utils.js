// ========== 多语言界面文本 ==========
const UI_TEXT = {
  ja: {
    pageTitle: 'レスレリ 角色图鉴',
    searchPlaceholder: '名前で検索...',
    skillSection: 'スキル',
    abilitySection: 'アビリティ',
    leaderSkillSection: 'リーダースキル',
    base: 'ベース',
    series: 'シリーズ',
    releaseDate: '実装日',
    joinDate: '加入日',
    attribute: '属性',
    role: 'ロール',
    alchemist: '錬金術士',
    yes: 'はい',
    no: 'いいえ',
    none: 'なし',
    loading: '読み込み中...',
    loadFailed: '読み込み失敗',
    initial: '初期',
    max: '最大',
    rarity: 'レアリティ',
    target: '対象',
    power: '威力',
    break: 'ブレイク',
    wt: 'WT',
    limit: '制限',
    switchText: '切替',
    level: 'Lv. ',
    initialWTLabel: '初期WT',
    skillType: {
      normal1: '通常攻撃1', normal2: '通常攻撃2', burst: 'バーストスキル',
      active1: 'アクティブ1', active2: 'アクティブ2', active3: 'アクティブ3',
      extra: 'EXスキル'
    },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    abilityTitle: '能力',
    supportAbilityTitle: '亜空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '並べ替え',
    filterLabel: 'フィルター',
    applyFilter: '適用',
    clearFilter: 'クリア',
  },
  cn: {
    pageTitle: '蕾斯莱莉 角色图鉴',
    searchPlaceholder: '搜索角色名称...',
    skillSection: '技能',
    abilitySection: '能力',
    leaderSkillSection: '队长技能',
    base: '原型',
    series: '系列',
    releaseDate: '实装日期',
    joinDate: '加入日期',
    attribute: '属性',
    role: '职业',
    alchemist: '炼金术士',
    yes: '是',
    no: '否',
    none: '无',
    loading: '加载中...',
    loadFailed: '加载失败',
    initial: '初期',
    max: '最大',
    rarity: '稀有度',
    target: '对象',
    power: '威力',
    break: '破防',
    wt: 'WT',
    limit: '限制',
    switchText: '切换',
    level: 'Lv. ',
    initialWTLabel: '初始WT',
    skillType: {
      normal1: '通常攻击1', normal2: '通常攻击2', burst: '爆发技能',
      active1: '主动1', active2: '主动2', active3: '主动3',
      extra: 'EX技能'
    },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    abilityTitle: '能力',
    supportAbilityTitle: '亚空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '排序',
    filterLabel: '筛选',
    applyFilter: '应用筛选',
    clearFilter: '清除',
  }
};

// 颜色名称 → hex 值
const COLOR_MAP = {
  '赤': '#E74C3C', '青': '#3498DB', '緑': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '红': '#E74C3C', '蓝': '#3498DB', '绿': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '白': '#FFFFFF', '黒': '#333333', '黑': '#333333',
};

// 当前语言，默认中文
let currentLang = 'cn';
let cardStates = {};
function t(key) { return UI_TEXT[currentLang][key] || key; }
function getField(obj, field) {
  if (currentLang === 'cn' && obj[field + '_cn'] !== undefined) return obj[field + '_cn'];
  return obj[field + '_ja'] || obj[field] || '';
}

// 稀有度转星星
function rarityToStars(r) {
  const map = {1:'★',2:'★★',3:'★★★',4:'★★★☆',5:'★★★★',6:'★★★★☆',7:'★★★★★',8:'★★★★★★'};
  return map[r] || '★'.repeat(r);
}

// 获取颜色 hex
function getColorHex(name) {
  return name ? (COLOR_MAP[name] || '#CCCCCC') : '#CCCCCC';
}