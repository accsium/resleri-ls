import { ref } from 'vue'

const UI_TEXT = {
  ja: {
    pageTitle: 'レスレリ図鑑',
    searchPlaceholder: 'キャラ名・ID・作品名を検索...',
    skillSearchPlaceholder: 'スキル名・説明で検索...',
    skillSection: 'スキル',
    abilityTitle: '能力',
    leaderSkillSection: 'リーダースキル',
    joinDate: '加入日',
    gachaEnd: '卡池结束',
    permanentStatus: '恒常状態',
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
    skillType: { normal1: 'スキル1', normal2: 'スキル2', burst: 'バーストスキル', active: 'アクティブスキル', ex: 'EXスキル' },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    supportAbilityTitle: '亜空支援能力',
    navGuide: 'キャラ図鑑',
    navCollection: '所持キャラ',
    navSkills: 'スキル一覧',
    navLeaderSkills: 'リーダースキル',
    navSupportAbility: '支援能力',
    navEvents: 'イベント',
    navContest: 'ダメコン履歴',
    navGachas: 'ガチャ一覧',
    navTest: 'テスト',
    collectionSave: '保存',
    collectionSaved: '保存しました',
    collectionCopyLink: 'リンクをコピー',
    collectionCopied: 'コピーしました',
    collectionSequential: '一覧',
    collectionMatrix: '分類',
    collectionOwnedCount: '所持 {n} / {total}',
    collectionNoMatch: '条件に一致するキャラクターがいません',
    confirmRefresh: 'キャッシュをクリアしてデータを再読み込みしますか？',
    applyFilter: '適用', clearFilter: 'クリア',
    // 表格列标签
    id: 'ID', avatar: 'アバター', characterName: 'キャラ名',
    skillTypeLabel: '種類', skillStateLabel: '状態',
    damage: 'ダメージ', breakDef: 'ブレイク', heal: '回復',
    skillName: 'スキル名', description: '説明',
    startDate: '開始日', endDate: '終了日', eventName: 'イベント名', revivalDate: '復刻日',
    gachaName: 'ガチャ名', gacha: 'ガチャ', characters: 'キャラクター', memoria: 'メモリア',
    maxRarity: '最大レア', targetAttr: '対象属性', targetRole: '対象ロール', targetTag: '対象タグ',
    supportAbilityDesc: '支援能力説明',
    effectLabel: '効果',
    episodeName: 'エピソード名',
    // 技能状态值
    state_evolve_base: '進化前', state_evolve_alt: '進化後',
    state_range_base: '内側', state_range_alt: '外側',
    state_change_base: '変身後', state_change_alt: '変身前',
    // 技能对象筛选
    targetFilter: { ally: '味方', enemy: '敵', single: '単体', all: '全体', other: 'その他' },
    // 筛选面板
    initialRarity: '初期レア', traitColor: '調和色', specialMechanism: '特殊機能',
    itemTrait: 'アイテム特性', equipmentTrait: '装備特性',
    tags: 'タグ', voiceActorLabel: '声優', seriesLabel: 'シリーズ', originalTitleLabel: '原作',
    traitLang: '特性言語', allOption: 'すべて',
    langJA: '日本語', langCN: '中文',
    // 恒常化状态
    permanentTrue: '恒常化済', permanentFalse: '未恒常化', permanentLimited: '恒常化対象外',
    // 特殊机制
    specialEvo: '進化', specialRange: '範囲変化', specialTransform: '変身',
    // 切换标签
    toggleEvo: '進化', toggleRange: '範囲', toggleTransform: '変身',
    // 角色卡片详情
    expandDetail: '展開 ▼', collapseDetail: '閉じる ▲',
    fullnameLabel: 'フルネーム', basicInfo: '基本情報',
    fesInitial: '初期',
    characterAbility: 'キャラクター能力', boardAbility: '光玉板能力',
    unreachableNote: '（このキャラクターは現在このレアリティに到達できません。）',
    synthesis: '調合',
    // 分页
    pageTotal: '全 {tp} ページ', pageItemCount: '（{ti} 件）',
    jumpTo: '移動', pageUnit: 'ページ', perPage: '表示件数', itemUnit: '件',
    // 排序搜索
    sortLabel: '並び替え', descOrder: '↓ 降順', ascOrder: '↑ 昇順', searchLabel: '検索',
    // 收藏
    loadCode: '読み込み', owned: '所持', unowned: '未所持',
    colorLabel: 'カラー', bwLabel: '白黒',
    selectAll: '全選択', invertSelect: '反転', avatarSize: 'アバターサイズ',
    saveFailed: '保存に失敗しました。ブラウザのストレージ容量またはプライバシー設定を確認してください。',
  },
  cn: {
    pageTitle: '蕾斯莱莉图鉴',
    searchPlaceholder: '搜索角色名、ID、作品名...',
    skillSearchPlaceholder: '搜索技能名或描述...',
    skillSection: '技能',
    abilityTitle: '能力',
    leaderSkillSection: '队长技能',
    joinDate: '加入日期',
    gachaEnd: '卡池结束',
    permanentStatus: '恒常化状态',
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
    skillType: { normal1: '一技能', normal2: '二技能', burst: '爆发技能', active: '主动技能', ex: 'EX技能' },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    supportAbilityTitle: '亚空支援能力',
    navGuide: '角色图鉴',
    navCollection: '角色收藏',
    navSkills: '技能一览',
    navLeaderSkills: '队长技能',
    navSupportAbility: '支援能力',
    navEvents: '活动信息',
    navContest: '竞技场信息',
    navGachas: '卡池信息',
    navTest: '测试',
    collectionSave: '保存',
    collectionSaved: '已保存',
    collectionCopyLink: '复制链接',
    collectionCopied: '已复制',
    collectionSequential: '一览',
    collectionMatrix: '分类',
    collectionOwnedCount: '已拥有 {n} / {total}',
    collectionNoMatch: '没有符合条件的角色',
    confirmRefresh: '确定要清除缓存并刷新数据？',
    applyFilter: '应用筛选', clearFilter: '清除',
    // 表格列标签
    id: 'ID', avatar: '头像', characterName: '角色名',
    skillTypeLabel: '种类', skillStateLabel: '状态',
    damage: '伤害', breakDef: '破防', heal: '治疗',
    skillName: '技能名', description: '描述',
    startDate: '开始日期', endDate: '结束日期', eventName: '名称', revivalDate: '复刻日期',
    gachaName: '卡池名', gacha: '卡池', characters: '角色', memoria: '回忆',
    maxRarity: '最大星级', targetAttr: '目标属性', targetRole: '目标职业', targetTag: '目标标签',
    supportAbilityDesc: '支援能力描述',
    effectLabel: '效果',
    episodeName: '名称',
    // 技能状态值
    state_evolve_base: '进化前', state_evolve_alt: '进化后',
    state_range_base: '内圈', state_range_alt: '外圈',
    state_change_base: '变身后', state_change_alt: '变身前',
    // 技能对象筛选
    targetFilter: { ally: '友方', enemy: '敌方', single: '单体', all: '全体', other: '其他' },
    // 筛选面板
    initialRarity: '初始星级', traitColor: '调和颜色', specialMechanism: '特殊机制',
    itemTrait: '道具词条', equipmentTrait: '装备词条',
    tags: '标签', voiceActorLabel: '声优', seriesLabel: '系列', originalTitleLabel: '作品出处',
    traitLang: '词条语言', allOption: '全部',
    langJA: '日语', langCN: '中文',
    // 恒常化状态
    permanentTrue: '已恒常化', permanentFalse: '未恒常化', permanentLimited: '非恒常角色',
    // 特殊机制
    specialEvo: '进化', specialRange: '范围变化', specialTransform: '变身',
    // 切换标签
    toggleEvo: '进化', toggleRange: '范围', toggleTransform: '变身',
    // 角色卡片详情
    expandDetail: '展开 ▼', collapseDetail: '收起 ▲',
    fullnameLabel: '全名', basicInfo: '基础信息',
    fesInitial: '初始',
    characterAbility: '角色能力', boardAbility: '光玉板能力',
    unreachableNote: '（该角色目前无法到达此星级。）',
    synthesis: '调和',
    // 分页
    pageTotal: '共 {tp} 页', pageItemCount: '（{ti} 条）',
    jumpTo: '跳到', pageUnit: '页', perPage: '每页', itemUnit: '条',
    // 排序搜索
    sortLabel: '排序', descOrder: '↓ 降序', ascOrder: '↑ 升序', searchLabel: '搜索',
    // 收藏
    loadCode: '读取', owned: '已拥有', unowned: '未拥有',
    colorLabel: '彩色', bwLabel: '黑白',
    selectAll: '全选', invertSelect: '反选', avatarSize: '头像尺寸',
    saveFailed: '保存失败，请检查浏览器存储空间或隐私设置。',
  }
}

const ATTR_IDS    = [5, 6, 7, 8, 1, 2, 3]  // 魔法优先，物理在后
const TRAIT_COLOR_HEX = { 1: '#3498DB', 2: '#9B59B6', 3: '#F1C40F', 4: '#E74C3C', 5: '#2ECC71' }

/** (size + 3) << (scale + 3) — size 0-7, scale 为自然数 */
export const getSizePx = (scale, size) => (size + 3) << (scale + 3)

const SORT_FIELDS = [
  { field: 'start_at',    label_ja: '実装日',   label_cn: '加入时间' },
  { field: 'id',          label_ja: 'ID',        label_cn: 'ID' },
  { field: 'initial_rarity', label_ja: '初期レア', label_cn: '初始星级' },
  { field: 'tag_count',   label_ja: 'タグ数',   label_cn: '标签数' },
  { field: 'hp',          label_ja: 'HP',        label_cn: 'HP' },
  { field: 'speed',       label_ja: '速度',     label_cn: '速度' },
  { field: 'attack',      label_ja: '物攻',     label_cn: '物攻' },
  { field: 'defense',     label_ja: '物防',     label_cn: '物防' },
  { field: 'magic',       label_ja: '魔攻',     label_cn: '魔攻' },
  { field: 'mental',      label_ja: '魔防',     label_cn: '魔防' },
  { field: 'initial_wt',  label_ja: '初期WT',   label_cn: '初始WT' },
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

  return { currentLang, t, getField, setLang, getTraitColorHex, SORT_FIELDS, TRAIT_COLOR_HEX, ATTR_IDS }
}
