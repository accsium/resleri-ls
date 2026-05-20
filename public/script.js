const UI_TEXT = {
  ja: {
    pageTitle: 'レスレリ 角色图鉴',
    searchPlaceholder: '名前で検索...',
    basicStatus: '基本ステータス',
    skillSection: 'スキル',
    abilitySection: 'アビリティ',
    leaderSkillSection: 'リーダースキル',
    base: 'ベース',
    series: 'シリーズ',
    releaseDate: '実装日',
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
    level: 'Lv',
    initialWTLabel: '初期WT',
    skillType: {
      normal1: '通常攻撃1', normal2: '通常攻撃2', burst: 'バーストスキル',
      active1: 'アクティブ1', active2: 'アクティブ2', active3: 'アクティブ3',
      extra: 'EXスキル'
    },
    statLabels: { hp: 'HP', attack: '物攻', magic: '魔攻', defense: '物防', mental: '魔防', speed: '速度' },
    abilityTitle: '能力',
    supportAbilityTitle: '亜空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '並べ替え',
    filterLabel: 'フィルター',
    applyFilter: '適用',
    clearFilter: 'クリア',
  },
  cn: {
    pageTitle: '雷斯雷利 角色图鉴',
    searchPlaceholder: '搜索角色名称...',
    basicStatus: '基础属性',
    skillSection: '技能',
    abilitySection: '能力',
    leaderSkillSection: '队长技能',
    base: '原型',
    series: '系列',
    releaseDate: '实装日期',
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
    level: '等级',
    initialWTLabel: '初始WT',
    skillType: {
      normal1: '通常攻击1', normal2: '通常攻击2', burst: '爆发技能',
      active1: '主动1', active2: '主动2', active3: '主动3',
      extra: 'EX技能'
    },
    statLabels: { hp: 'HP', attack: '物攻', magic: '魔攻', defense: '物防', mental: '魔防', speed: '速度' },
    abilityTitle: '能力',
    supportAbilityTitle: '亚空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '排序',
    filterLabel: '筛选',
    applyFilter: '应用筛选',
    clearFilter: '清除',
  }
};

const COLOR_MAP = {
  '赤': '#E74C3C', '青': '#3498DB', '緑': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '红': '#E74C3C', '蓝': '#3498DB', '绿': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '白': '#FFFFFF', '黒': '#333333', '黑': '#333333',
};

let currentLang = 'cn';
function t(key) { return UI_TEXT[currentLang][key] || key; }

function getField(obj, field) {
  if (currentLang === 'cn' && obj[field + '_cn'] !== undefined) {
    return obj[field + '_cn'];
  }
  return obj[field + '_ja'] || obj[field] || '';
}

let characterIndex = [];
let loadedCharacters = {};
const cardStates = {};

// 可用排序字段
const AVAILABLE_SORT_FIELDS = [
  { field: 'sort_id', label_ja: '実装日+ID', label_cn: '实装日期+ID' },
  { field: 'start_at', label_ja: '実装日', label_cn: '实装日期' },
  { field: 'initial_rarity', label_ja: '初期レアリティ', label_cn: '初始稀有度' },
  { field: 'max_rarity', label_ja: '最大レアリティ', label_cn: '最大稀有度' },
  { field: 'role', label_ja: 'ロール', label_cn: '职业' },
  { field: 'id', label_ja: 'ID', label_cn: 'ID' },
  { field: 'base_character_id', label_ja: 'ベースキャラ', label_cn: '原型' },
  { field: 'original_title_id', label_ja: 'シリーズ', label_cn: '系列' },
  { field: 'trait_color_id', label_ja: '特性色', label_cn: '特性色' },
  { field: 'support_color_id', label_ja: '支援色', label_cn: '支援色' },
];

let currentSortField = 'sort_id';
let currentSortOrder = 'desc';

let activeFilters = { attack_attributes: [], role: [] };

async function loadIndex() {
  const resp = await fetch('data/character_index.json');
  characterIndex = await resp.json();
  // 确保 sort_id 存在（旧索引兼容）
  characterIndex.forEach(c => {
    if (!c.sort_id && c.start_at) {
      const dateStr = c.start_at.substring(0, 10).replace(/-/g, '');
      const yymmdd = dateStr.substring(2);
      c.sort_id = parseInt(yymmdd + String(c.id).padStart(5, '0'));
    }
  });
}

async function loadCharacter(id) {
  if (loadedCharacters[id]) return loadedCharacters[id];
  const resp = await fetch(`data/${id}.json`);
  const char = await resp.json();
  loadedCharacters[id] = char;
  return char;
}

function rarityToStars(r) {
  const map = {1:'★',2:'★★',3:'★★★',4:'★★★☆',5:'★★★★',6:'★★★★☆',7:'★★★★★',8:'★★★★★★'};
  return map[r] || '★'.repeat(r);
}

// 排序比较函数
function compareCharacters(a, b) {
  const field = currentSortField;
  const order = currentSortOrder === 'desc' ? -1 : 1;
  let valA = a[field];
  let valB = b[field];
  if (Array.isArray(valA)) valA = valA[0];
  if (Array.isArray(valB)) valB = valB[0];
  if (valA == null && valB == null) return 0;
  if (valA == null) return 1 * order;
  if (valB == null) return -1 * order;
  if (typeof valA === 'string' && typeof valB === 'string') {
    const cmp = valA.localeCompare(valB);
    if (cmp !== 0) return cmp * order;
  } else {
    if (valA < valB) return -1 * order;
    if (valA > valB) return 1 * order;
  }
  return 0;
}

function applyFilters(char) {
  if (activeFilters.attack_attributes.length > 0) {
    const attrs = char.attack_attributes || [];
    if (!activeFilters.attack_attributes.some(a => attrs.includes(a))) return false;
  }
  if (activeFilters.role.length > 0) {
    if (!activeFilters.role.includes(char.role)) return false;
  }
  return true;
}

function getFilteredAndSortedCharacters() {
  let filtered = characterIndex.filter(applyFilters);
  filtered.sort(compareCharacters);
  return filtered;
}

function updateUILanguage() {
  document.title = t('pageTitle');
  document.getElementById('pageTitle').textContent = t('pageTitle');
  document.getElementById('searchInput').placeholder = t('searchPlaceholder');
  buildSortSelect();
  updateOrderButton();
  buildFilterPanel();
  renderAllCards();
}

function buildSortSelect() {
  const select = document.getElementById('sortSelect');
  if (!select) return;
  select.innerHTML = '';
  AVAILABLE_SORT_FIELDS.forEach(sf => {
    const option = document.createElement('option');
    option.value = sf.field;
    option.textContent = currentLang === 'cn' ? sf.label_cn : sf.label_ja;
    if (sf.field === currentSortField) option.selected = true;
    select.appendChild(option);
  });
  select.onchange = () => {
    currentSortField = select.value;
    renderAllCards();
  };
}

function updateOrderButton() {
  const btn = document.getElementById('orderToggle');
  if (!btn) return;
  btn.textContent = currentSortOrder === 'desc' ? '↓' : '↑';
  btn.className = 'order-btn' + (currentSortOrder === 'desc' ? ' desc' : '');
}

document.getElementById('orderToggle').addEventListener('click', () => {
  currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
  updateOrderButton();
  renderAllCards();
});

function buildFilterPanel() {
  const attrDiv = document.getElementById('attrFilters');
  const roleDiv = document.getElementById('roleFilters');
  if (!attrDiv || !roleDiv) return;
  const attrMap = {1:'斬',2:'打',3:'突',5:'火',6:'氷',7:'雷',8:'風'};
  const attrMapCn = {1:'斩',2:'打',3:'突',5:'火',6:'冰',7:'雷',8:'风'};
  attrDiv.innerHTML = Object.entries(attrMap).map(([id, name]) => {
    const label = currentLang === 'cn' ? attrMapCn[id] : name;
    return `<label><input type="checkbox" value="${id}" class="attr-check">${label}</label>`;
  }).join('');
  const roleMap = {1:'攻',2:'破',3:'防',4:'輔'};
  const roleMapCn = {1:'攻',2:'破',3:'防',4:'辅'};
  roleDiv.innerHTML = Object.entries(roleMap).map(([id, name]) => {
    const label = currentLang === 'cn' ? roleMapCn[id] : name;
    return `<label><input type="checkbox" value="${id}" class="role-check">${label}</label>`;
  }).join('');
}

function renderAllCards() {
  const container = document.getElementById('cardContainer');
  container.innerHTML = '';
  const filteredSorted = getFilteredAndSortedCharacters();
  filteredSorted.forEach(c => container.appendChild(createCard(c)));
  filterCards();
}

function createCard(indexEntry) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = indexEntry.id;

  const name = currentLang === 'cn' ? (indexEntry.name_cn || indexEntry.name_ja) : indexEntry.name_ja;
  const alias = indexEntry.another_name || '';
  const stars = rarityToStars(indexEntry.initial_rarity);
  const attrs = getField(indexEntry, 'attack_attribute_names').join(' / ');
  const role = getField(indexEntry, 'role_name');
  const tags = (getField(indexEntry, 'tag_names') || []).slice(0, 3);
  const releaseDate = indexEntry.start_at ? new Date(indexEntry.start_at).toLocaleDateString('ja-JP') : '—';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-main-info">
        <div class="card-title">
          ${name}
          ${alias ? `<span class="alias">${alias}</span>` : ''}
        </div>
        <div class="rarity">${stars} (${indexEntry.initial_rarity}→${indexEntry.max_rarity})</div>
        <div class="attrs">${attrs} | ${role}</div>
        <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="release-date">${releaseDate}</div>
      </div>
      <div class="switch-buttons"></div>
    </div>
    <div class="card-detail"></div>
  `;

  const header = card.querySelector('.card-header');
  header.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    toggleCardDetail(indexEntry.id);
  });

  return card;
}

// 其余函数与之前版本一致，包括 toggleCardDetail、renderDetailContent、generateDetailHTML 等
// 注意：bindCardButtons 中需要确保技能等级切换和支援能力切换使用正确的数据
// 此处省略，因为它们与之前对话中的版本基本一致，只增加 release-date 显示