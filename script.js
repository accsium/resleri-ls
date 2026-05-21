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
    equipTraitTitle: '装備アイテム特性'
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
    equipTraitTitle: '装备道具特性'
  }
};

const COLOR_MAP = {
  '赤': '#E74C3C', '青': '#3498DB', '緑': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '红': '#E74C3C', '蓝': '#3498DB', '绿': '#2ECC71', '黄': '#F1C40F', '紫': '#9B59B6',
  '白': '#FFFFFF', '黒': '#333333', '黑': '#333333'
};

let currentLang = 'cn';
const t = k => UI_TEXT[currentLang][k] || k;
const getField = (o, f) => currentLang === 'cn' && o[f+'_cn'] !== undefined ? o[f+'_cn'] : (o[f+'_ja'] || o[f] || '');
const getColorHex = n => n ? (COLOR_MAP[n] || '#CCCCCC') : '#CCCCCC';

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

// ========== 星星组件（通用） ==========
function renderStarGroup(rarity, scale = 0.5) {
  const starCountMap = {1:1, 2:2, 3:3, 5:4, 7:5, 8:6};
  const count = starCountMap[rarity] || 0;
  if (count === 0) return '';
  const starFile = rarity === 8 ? 'star_2.png' : 'star_1.png';
  const w = Math.round(67 * scale);
  const h = Math.round(64 * scale);
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `<img src="image/misc/${starFile}" alt="" style="width:${w}px;height:${h}px;flex-shrink:0;">`;
  }
  return `<span class="stars-group" style="display:inline-flex;gap:0;align-items:center;">${html}</span>`;
}

// ========== 头像组件 ==========
function renderAvatarSVG(id, traitColor, supportColor, size = 300) {
  const traitHex = getColorHex(traitColor), supportHex = getColorHex(supportColor);
  const imgId = `avatar-img-${id}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <polygon points="150,0 0,150 150,300" fill="${traitHex}"/><polygon points="150,0 300,150 150,300" fill="${supportHex}"/>
    <defs>
      <linearGradient id="gt-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/></linearGradient>
      <linearGradient id="gl-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/></linearGradient>
      <linearGradient id="gr-${id}" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/></linearGradient>
      <mask id="mask-${id}">
        <rect x="22" y="44" width="256" height="128" fill="white"/><polygon points="22,172 278,172 150,300" fill="white"/>
        <rect x="22" y="44" width="256" height="15" fill="url(#gt-${id})"/>
        <rect x="22" y="44" width="15" height="128" fill="url(#gl-${id})"/>
        <rect x="263" y="44" width="15" height="128" fill="url(#gr-${id})"/>
      </mask>
    </defs>
    <image id="${imgId}" href="image/misc/00000.png" x="22" y="44" width="256" height="256" mask="url(#mask-${id})" preserveAspectRatio="xMidYMax meet"/>
  </svg>`;
}

function initAvatar(card, id) {
  const img = card.querySelector(`#avatar-img-${id}`);
  if (!img) return;
  const test = new Image();
  test.onload = () => img.setAttribute('href', `image/character/${id}.png`);
  test.src = `image/character/${id}.png`;
}

function renderAvatarComponent(indexEntry, size = 75) {
  const id = indexEntry.id;
  const traitColor = getField(indexEntry, 'trait_color_name');
  const supportColor = getField(indexEntry, 'support_color_name');
  const attrId = (indexEntry.attack_attributes || [])[0];
  const roleId = indexEntry.role;

  const starCountMap = {1:1, 2:2, 3:3, 5:4, 7:5, 8:6};
  const starCount = starCountMap[indexEntry.initial_rarity] || 0;
  const starWidth = 33.5, starHeight = 32;
  const totalWidth = starCount * starWidth;
  const startX = (300 - totalWidth) / 2;
  const startY = 300 - starHeight;
  const starsContainer = starCount > 0
    ? `<div style="position:absolute; left:${startX}px; top:${startY}px; width:${totalWidth}px; height:${starHeight}px;">${renderStarGroup(indexEntry.initial_rarity, 0.5)}</div>`
    : '';

  const attrIcon = attrId ? `<img src="image/misc/attack_attribute_${attrId}.png" class="attr-icon" style="position:absolute; left:0px; top:0px; width:29.5px; height:28px;" alt="">` : '';

  let roleIcon = '';
  if (roleId) {
    const rolePos = {
      1: { left: 272.875, top: 2.375, width: 24, height: 24 },
      2: { left: 269.75, top: 0, width: 30.25, height: 28.75 },
      3: { left: 269.875, top: 1.25, width: 30, height: 26.25 },
      4: { left: 270, top: 2, width: 29.75, height: 24.75 }
    };
    const p = rolePos[roleId] || rolePos[1];
    roleIcon = `<img src="image/misc/role_${roleId}.png" class="role-icon" style="position:absolute; left:${p.left}px; top:${p.top}px; width:${p.width}px; height:${p.height}px;" alt="">`;
  }

  const svg = renderAvatarSVG(id, traitColor, supportColor, 300);

  return `
    <div class="avatar-component" style="width:${size}px; height:${size}px; position:relative; overflow:hidden;">
      <div class="avatar-svg-container" style="transform:scale(${size/300}); transform-origin:0 0; width:300px; height:300px;">
        ${svg}
        ${starsContainer}
        ${attrIcon}
        ${roleIcon}
      </div>
    </div>
  `;
}

// ========== 调和模块 ==========
function renderSynthesisModule(char) {
  const traitName = getField(char, 'trait_color_name') || '?';
  const supportName = getField(char, 'support_color_name') || '?';
  const traits = [...(getField(char, 'battle_tool_trait_names')||[]), ...(getField(char, 'equipment_tool_trait_names')||[])];
  return `<div class="synthesis-module">
    <div class="synthesis-color-row">
      <span style="color:${getColorHex(traitName)}">${traitName}</span>
      <svg width="20" height="20" viewBox="0 0 30 30"><polygon points="15,0 0,15 15,30" fill="${getColorHex(traitName)}"/><polygon points="15,0 30,15 15,30" fill="${getColorHex(supportName)}"/></svg>
      <span style="color:${getColorHex(supportName)}">${supportName}</span>
    </div>
    <div class="synthesis-traits">${traits.map(t => `<div class="trait-tag">${t}</div>`).join('')}</div>
  </div>`;
}

function createToggleSwitch(type, checked, label) {
  return `<label class="toggle-switch" data-type="${type}" title="${label}"><input type="checkbox" ${checked?'checked':''}><span class="slider"></span></label>`;
}

// ========== 创建卡片 ==========
function createCard(indexEntry) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = indexEntry.id;

  const baseName = getField(indexEntry, 'base_character_name') || (currentLang === 'cn' ? (indexEntry.name_cn || indexEntry.name_ja) : indexEntry.name_ja);
  const alias = indexEntry.another_name || '';
  const role = getField(indexEntry, 'role_name');
  const tags = (getField(indexEntry, 'tag_names') || []).slice(0, 3);
  const releaseDate = indexEntry.start_at ? new Date(indexEntry.start_at).toLocaleDateString('ja-JP') : '—';
  const status = indexEntry.initial_status || {};
  const initialWT = indexEntry.initial_wt ?? '—';

  const statOrder = ['initialWT', 'hp', 'speed', 'attack', 'defense', 'magic', 'mental'];
  const statCards = statOrder.map(key => {
    const label = key === 'initialWT' ? t('initialWTLabel') : t('statLabels')[key];
    const value = key === 'initialWT' ? initialWT : (status[key] ?? '?');
    return `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
  }).join('');

  const traits = [...(getField(indexEntry, 'battle_tool_trait_names')||[]), ...(getField(indexEntry, 'equipment_tool_trait_names')||[])];

  const avatarHTML = renderAvatarComponent(indexEntry, 75);

  card.innerHTML = `<div class="card-header">
    <div class="card-p1">
      <div class="p1-title">${baseName}${alias?`<span class="alias">${alias}</span>`:''}<span class="char-id">ID:${indexEntry.id}</span></div>
      <div class="switch-buttons"></div>
    </div>
    <div class="card-p2">
      <div class="p2-col p2-col1">
        <div class="avatar-col">${avatarHTML}</div>
        <div class="attrs">${getField(indexEntry, 'attack_attribute_names').join(' / ')} | ${role}</div>
        <div class="inline-traits">${traits.map(t => `<span class="trait-tag">${t}</span>`).join('')}</div>
      </div>
      <div class="p2-col p2-col2">
        <div class="max-rarity-row">
          <span class="max-rarity-label">${t('maxRarityLabel')}</span>
          ${renderStarGroup(indexEntry.max_rarity, 0.5)}
        </div>
        <div class="tags">${tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        <div class="release-date">${t('joinDate')}: ${releaseDate}</div>
        <div class="stats-row">${statCards}</div>
      </div>
      <div class="p2-col p2-col3">
        <button class="expand-btn" data-action="toggle" aria-label="展开">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#5b6e82" stroke-width="2" fill="none"/>
            <path d="M9 10 L12 13 L15 10" stroke="#5b6e82" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div><div class="card-detail"></div>`;

  card.querySelector('.expand-btn').onclick = e => {
    e.stopPropagation();
    const detailDiv = card.querySelector('.card-detail');
    const willOpen = !detailDiv.classList.contains('open');
    toggleCardDetail(indexEntry.id);
    const svg = card.querySelector('.expand-btn svg');
    if (svg) {
      svg.innerHTML = willOpen
        ? '<circle cx="12" cy="12" r="10" stroke="#5b6e82" stroke-width="2" fill="none"/><path d="M9 14 L12 11 L15 14" stroke="#5b6e82" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<circle cx="12" cy="12" r="10" stroke="#5b6e82" stroke-width="2" fill="none"/><path d="M9 10 L12 13 L15 10" stroke="#5b6e82" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  };

  loadCharacter(indexEntry.id).then(char => {
    if (char) updateSwitchButtonsState(card, getCardState(indexEntry.id), char);
  });
  initAvatar(card, indexEntry.id);
  return card;
}

function updateSwitchButtonsState(card, state, char) {
  const div = card.querySelector('.switch-buttons');
  if (!div || !char) return;
  const hasEvo = (char._skills||[]).some(s => s.post_evolution.length > 0);
  const hasRange = Object.keys(char._rangeSkills || {}).length > 0;
  const hasTransform = char._transform != null;
  div.innerHTML = (hasEvo?createToggleSwitch('evo',state.evo==='post','切换进化状态'):'') +
                  (hasRange?createToggleSwitch('range',state.range==='inrange','切换范围状态'):'') +
                  (hasTransform?createToggleSwitch('transform',state.showTransform,'切换变身状态'):'');
  div.querySelectorAll('.toggle-switch input').forEach(inp => {
    inp.onchange = () => {
      const type = inp.closest('.toggle-switch').dataset.type;
      const id = parseInt(card.dataset.id);
      const cs = getCardState(id);
      switch(type) {
        case 'evo': setCardState(id, { evo: cs.evo === 'post' ? 'pre' : 'post' }); break;
        case 'range': setCardState(id, { range: cs.range === 'inrange' ? 'normal' : 'inrange' }); break;
        case 'transform': setCardState(id, { showTransform: !cs.showTransform }); break;
      }
      const detailDiv = card.querySelector('.card-detail.open');
      if (detailDiv) { const ch = loadedCharacters[id]; if (ch) renderDetailContent(id, ch, getCardState(id)); }
    };
  });
}

function getCardState(id) { return cardStates[id] || (cardStates[id] = { evo:'post', range:'inrange', showTransform:false }); }
function setCardState(id, ns) { cardStates[id] = { ...cardStates[id], ...ns }; }

// ========== 全局数据 ==========
let characterIndex = [], loadedCharacters = {};
let activeSortFields = [...SORT_FIELDS].sort((a,b) => a.priority - b.priority);
let currentSortOrder = 'desc';
let activeFilters = { attack_attributes: [], role: [] };

async function loadIndex() { const r = await fetch('data/character_index.json'); characterIndex = await r.json(); }
async function loadCharacter(id) {
  if (loadedCharacters[id]) return loadedCharacters[id];
  const r = await fetch(`data/${id}.json`);
  return loadedCharacters[id] = await r.json();
}

function compareCharacters(a, b) {
  for (const sf of activeSortFields) {
    const order = currentSortOrder === 'desc' ? -1 : 1;
    let va = a[sf.field], vb = b[sf.field];
    if (Array.isArray(va)) va = va[0];
    if (Array.isArray(vb)) vb = vb[0];
    if (va == null && vb == null) continue;
    if (va == null) return 1 * order;
    if (vb == null) return -1 * order;
    if (typeof va === 'string') { const c = va.localeCompare(vb); if (c) return c * order; }
    else if (va < vb) return -1 * order; else if (va > vb) return 1 * order;
  }
  return 0;
}

function applyFilters(char) {
  if (activeFilters.attack_attributes.length && !activeFilters.attack_attributes.some(a => (char.attack_attributes||[]).includes(a))) return false;
  if (activeFilters.role.length && !activeFilters.role.includes(char.role)) return false;
  return true;
}

function getFilteredAndSortedCharacters() {
  const filtered = characterIndex.filter(applyFilters);
  filtered.sort(compareCharacters);
  return filtered;
}

// ========== UI 更新 ==========
function updateUILanguage() {
  document.title = t('pageTitle');
  document.getElementById('pageTitle').textContent = t('pageTitle');
  document.getElementById('searchInput').placeholder = t('searchPlaceholder');
  buildSortSelect(); updateOrderButton(); buildFilterPanel(); renderAllCards();
}

function buildSortSelect() {
  const sel = document.getElementById('sortSelect');
  if (!sel) return;
  sel.innerHTML = '';
  SORT_FIELDS.forEach(sf => {
    const opt = document.createElement('option');
    opt.value = sf.field;
    opt.textContent = currentLang === 'cn' ? sf.label_cn : sf.label_ja;
    if (activeSortFields[0]?.field === sf.field) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.onchange = () => {
    const field = sel.value;
    const list = [...SORT_FIELDS];
    const idx = list.findIndex(sf => sf.field === field);
    if (idx !== -1) {
      const [chosen] = list.splice(idx, 1);
      list.unshift(chosen);
      activeSortFields = list.sort((a,b) => (a.field===field ? -1 : b.field===field ? 1 : a.priority-b.priority));
    }
    renderAllCards();
  };
}

function updateOrderButton() {
  const btn = document.getElementById('orderToggle');
  if (!btn) return;
  btn.textContent = currentSortOrder === 'desc' ? '↓' : '↑';
  btn.className = 'order-btn' + (currentSortOrder === 'desc' ? ' desc' : '');
}

function buildFilterPanel() {
  const attrDiv = document.getElementById('attrFilters'), roleDiv = document.getElementById('roleFilters');
  if (!attrDiv || !roleDiv) return;
  const attrMap = {1:'斬',2:'打',3:'突',5:'火',6:'氷',7:'雷',8:'風'}, attrMapCn = {1:'斩',2:'打',3:'突',5:'火',6:'冰',7:'雷',8:'风'};
  attrDiv.innerHTML = Object.entries(attrMap).map(([id,name]) => `<label><input type="checkbox" value="${id}" class="attr-check">${currentLang==='cn'?attrMapCn[id]:name}</label>`).join('');
  const roleMap = {1:'攻',2:'破',3:'防',4:'輔'}, roleMapCn = {1:'攻',2:'破',3:'防',4:'辅'};
  roleDiv.innerHTML = Object.entries(roleMap).map(([id,name]) => `<label><input type="checkbox" value="${id}" class="role-check">${currentLang==='cn'?roleMapCn[id]:name}</label>`).join('');
}

function renderAllCards() {
  const container = document.getElementById('cardContainer');
  container.innerHTML = '';
  const cards = getFilteredAndSortedCharacters().map(c => createCard(c));
  cards.forEach(c => { container.appendChild(c); initAvatar(c, parseInt(c.dataset.id)); });
  filterCards();
}

// ========== 详情展开（带固定头部） ==========
async function toggleCardDetail(id) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;
  if (detailDiv.classList.contains('open')) {
    detailDiv.classList.remove('open');
    const card = detailDiv.closest('.card');
    card.classList.remove('card-sticky');
    if (card._stickyHandler) {
      window.removeEventListener('scroll', card._stickyHandler);
      delete card._stickyHandler;
    }
    return;
  }

  detailDiv.innerHTML = `<div class="loading">${t('loading')}</div>`;
  detailDiv.classList.add('open');

  try {
    const char = await loadCharacter(id);
    if (!char) throw new Error('角色数据为空');
    renderDetailContent(id, char, getCardState(id));

    const card = detailDiv.closest('.card');
    card.classList.add('card-sticky');
    initStickyCard(card);
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">${t('loadFailed')}: ${e.message || e}</div>`;
  }
}

function initStickyCard(card) {
  if (card._stickyHandler) window.removeEventListener('scroll', card._stickyHandler);

  const header = card.querySelector('.card-header');
  const detailDiv = card.querySelector('.card-detail');

  const handler = () => {
    if (!card.classList.contains('card-sticky')) return;
    const headerRect = header.getBoundingClientRect();
    if (headerRect.top <= 0) {
      detailDiv.style.maxHeight = `${window.innerHeight - header.offsetHeight}px`;
      detailDiv.style.overflowY = 'auto';
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.zIndex = '5';
      header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    } else {
      detailDiv.style.maxHeight = '';
      detailDiv.style.overflowY = '';
      header.style.position = '';
      header.style.top = '';
      header.style.zIndex = '';
      header.style.boxShadow = '';
    }
    if (detailDiv.scrollTop + detailDiv.clientHeight >= detailDiv.scrollHeight - 1) {
      card.classList.remove('card-sticky');
      detailDiv.style.maxHeight = '';
      detailDiv.style.overflowY = '';
      header.style.position = '';
      header.style.top = '';
      header.style.zIndex = '';
      header.style.boxShadow = '';
      window.removeEventListener('scroll', handler);
      delete card._stickyHandler;
    }
  };

  card._stickyHandler = handler;
  window.addEventListener('scroll', handler);
  handler();
}

function renderDetailContent(id, char, state) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;
  try {
    let activeChar = char;
    if (state.showTransform && char._transform) activeChar = char._transform;
    detailDiv.innerHTML = generateDetailHTML(activeChar, state, id, char);
    bindInnerButtons(id, activeChar, char, state);
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">渲染失败：${e.message || e}</div>`;
  }
}

function generateDetailHTML(activeChar, state, id, originalChar) {
  let html = '';
  const allSkillTypes = [];

  if (activeChar.leader_skill) {
    allSkillTypes.push({ type: 'leader', name: t('leaderSkillSection'), levels: [activeChar.leader_skill] });
  }

  const skills = activeChar._skills || [];
  const typeText = t('skillType');
  const rangeGroup = activeChar._rangeSkills ? activeChar._rangeSkills['inrange'] : null;

  const activeLevels = [];
  skills.forEach(group => {
    if (group.type.startsWith('active')) {
      let levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
      if (!levels || levels.length === 0) levels = group.post_evolution.length > 0 ? group.post_evolution : group.pre_evolution;
      if (levels && levels.length > 0) activeLevels.push(...levels);
    }
  });
  if (activeLevels.length > 0) allSkillTypes.push({ type: 'active', name: t('skillType').active, levels: activeLevels });

  skills.forEach(group => {
    if (group.type === 'normal1' || group.type === 'normal2' || group.type === 'burst') {
      let levels = [];
      if (state.range === 'inrange' && rangeGroup) {
        if (group.type === 'normal1') levels = rangeGroup.skill1 || [];
        else if (group.type === 'normal2') levels = rangeGroup.skill2 || [];
        else levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
      } else {
        levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
      }
      if (!levels || levels.length === 0) levels = group.post_evolution.length > 0 ? group.post_evolution : group.pre_evolution;
      if (levels && levels.length > 0) allSkillTypes.push({ type: group.type, name: typeText[group.type] || group.type, levels });
    }
  });

  const exSkills = activeChar._exSkills || [];
  if (exSkills.length > 0) allSkillTypes.push({ type: 'extra', name: t('skillType').extra, levels: exSkills });

  if (allSkillTypes.length > 0) {
    html += `<div class="section-title">${t('skillSection')}</div>`;
    allSkillTypes.forEach(skillType => {
      html += `<div class="subsection-title">${skillType.name}</div>`;
      const levels = skillType.levels;
      const currentSkill = levels[levels.length - 1] || {};
      const skillName = currentSkill.name || '??';
      const skillId = currentSkill.id || '';
      const levelTabs = (skillType.type !== 'leader' && levels.length > 1)
        ? `<div class="level-tabs">${levels.map((s, i) => `<button class="level-tab ${i === levels.length - 1 ? 'active' : ''}" data-index="${i}">${t('level')}${i+1}</button>`).join('')}</div>`
        : '';
      html += `<div class="skill-group" data-group="${skillType.type}">`;
      html += `<div class="banner-title"><span>${skillName} <small>(ID:${skillId})</small></span>${levelTabs}</div>`;
      if (skillType.type === 'leader') {
        html += `<div class="content-block"><div class="skill-desc">${currentSkill.description || ''}</div></div>`;
      } else {
        html += `<div class="content-block">${currentSkill ? renderSkillCard(currentSkill) : `<div class="no-data">${t('none')}</div>`}</div>`;
      }
      html += `</div>`;
    });
  }

  const abilityMap = activeChar._skillDetails || {};
  const evolvedIds = new Set(activeChar.all_skill_evolved_ability_ids || []);
  const normalIds = (activeChar.ability_ids || []).filter(id => !evolvedIds.has(id));
  const evoIds = state.evo === 'post' ? (activeChar.all_skill_evolved_ability_ids || []) : [];
  const allAbilityIds = [...new Set([...normalIds, ...evoIds])];
  const abilities = allAbilityIds.map(id => abilityMap[id]).filter(Boolean);
  const supportIds = activeChar.support_ability_ids || [];

  html += `<div class="section-title">${t('abilityTitle')}</div>`;
  abilities.forEach(a => {
    html += `<div class="banner-title">${a.name || `ID:${a.id}`}</div>`;
    html += `<div class="content-block">${renderAbilityCard(a)}</div>`;
  });
  if (abilities.length === 0 && supportIds.length === 0) html += `<div class="no-data">${t('none')}</div>`;

  if (supportIds.length > 0) {
    const maxRarity = activeChar.max_rarity || 8;
    const defaultIdx = Math.min(maxRarity - 1, supportIds.length - 1);
    const supportAbility = abilityMap[supportIds[defaultIdx]];
    const rarityTabs = `<div class="support-rarity-tabs">${supportIds.map((sid, idx) => {
      if (sid == null) return '';
      return `<button class="level-tab support-rarity-btn ${idx === defaultIdx ? 'active' : ''}" data-support-idx="${idx}">${t('rarityLabel')[idx]}</button>`;
    }).join('')}</div>`;
    html += `<div class="banner-title"><span>${t('supportAbilityTitle')}</span>${rarityTabs}</div>`;
    html += `<div class="content-block">${supportAbility ? renderAbilityCard(supportAbility) : `<div class="no-data">${t('none')}</div>`}</div>`;
  }

  if (originalChar) {
    html += `<div id="synthesis-bottom">${renderSynthesisModule(originalChar)}</div>`;
  }

  return html;
}

function renderSkillCard(skill) {
  const target = getField(skill, 'target_name') || skill.skill_target_type || '?';
  const attr = (skill.attack_attributes || []).map(a => ({1:'斬',2:'打',3:'突',5:'火',6:'氷',7:'雷',8:'風'}[a] || a)).join('/');
  let desc = skill.description || '';
  if (skill.effects) skill.effects.forEach((eff, i) => desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100));
  const wt = 200 + (skill.wait ?? 0);
  return `<div class="skill-desc">${desc}</div>
    <div class="skill-stats">
      <span class="skill-stat">${t('target')}: ${target}</span>
      ${attr ? `<span class="skill-stat">${t('attribute')}: ${attr}</span>` : ''}
      <span class="skill-stat">${t('power')}: ${skill.power ?? 0}%</span>
      <span class="skill-stat">${t('break')}: ${skill.break_power ?? 0}%</span>
      <span class="skill-stat">${t('wt')}: ${wt}</span>
      <span class="skill-stat">${t('limit')}: ${skill.limit_count ?? '—'}</span>
    </div>`;
}

function renderAbilityCard(a) {
  let desc = a.description || '';
  if (a.effects) a.effects.forEach((eff, i) => desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100));
  return `<div>${desc}</div>`;
}

function bindInnerButtons(id, activeChar, originalChar, state) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (!card) return;

  card.querySelectorAll('.skill-group').forEach(group => {
    const tabs = group.querySelectorAll('.level-tab');
    const contentBlock = group.querySelector('.content-block');
    const groupType = group.dataset.group;
    tabs.forEach(tab => {
      tab.onclick = () => {
        const idx = parseInt(tab.dataset.index);
        let levelsArr = [];
        if (groupType === 'extra') levelsArr = activeChar._exSkills || [];
        else if (groupType === 'leader') return;
        else {
          const skillObj = (activeChar._skills || []).find(g => g.type === groupType);
          if (skillObj) {
            const rg = activeChar._rangeSkills?.['inrange'];
            if (state.range === 'inrange' && rg) {
              if (groupType === 'normal1') levelsArr = rg.skill1 || [];
              else if (groupType === 'normal2') levelsArr = rg.skill2 || [];
              else levelsArr = state.evo === 'post' ? skillObj.post_evolution : skillObj.pre_evolution;
            } else levelsArr = state.evo === 'post' ? skillObj.post_evolution : skillObj.pre_evolution;
            if (!levelsArr || levelsArr.length === 0) levelsArr = skillObj.post_evolution.length > 0 ? skillObj.post_evolution : skillObj.pre_evolution;
          }
        }
        if (levelsArr && levelsArr[idx] && contentBlock) {
          contentBlock.innerHTML = renderSkillCard(levelsArr[idx]);
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        }
      };
    });
  });

  card.querySelectorAll('.support-rarity-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.supportIdx);
      const supportIds = activeChar.support_ability_ids || [];
      const ability = (activeChar._skillDetails || {})[supportIds[idx]];
      const content = card.querySelector('.support-ability-content') || card.querySelector('.content-block:last-of-type');
      if (content) content.innerHTML = ability ? renderAbilityCard(ability) : `<div class="no-data">${t('none')}</div>`;
      card.querySelectorAll('.support-rarity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
}

function filterCards() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.card').forEach(c => c.style.display = c.querySelector('.p1-title')?.textContent?.toLowerCase().includes(q) ? '' : 'none');
}

// ========== 筛选面板事件 ==========
document.getElementById('applyFilterBtn').onclick = () => {
  activeFilters.attack_attributes = Array.from(document.querySelectorAll('.attr-check:checked')).map(cb => parseInt(cb.value));
  activeFilters.role = Array.from(document.querySelectorAll('.role-check:checked')).map(cb => parseInt(cb.value));
  renderAllCards();
  document.getElementById('filterPanel').style.display = 'none';
};
document.getElementById('clearFilterBtn').onclick = () => {
  document.querySelectorAll('.attr-check, .role-check').forEach(cb => cb.checked = false);
  activeFilters = { attack_attributes: [], role: [] };
  renderAllCards();
  document.getElementById('filterPanel').style.display = 'none';
};
document.getElementById('filterToggle').onclick = () => {
  const p = document.getElementById('filterPanel');
  p.style.display = p.style.display === 'none' ? 'flex' : 'none';
};
document.getElementById('orderToggle').onclick = () => {
  currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
  updateOrderButton();
  renderAllCards();
};

// ========== 语言切换 ==========
document.getElementById('btn-ja').onclick = () => switchLang('ja');
document.getElementById('btn-cn').onclick = () => switchLang('cn');
async function switchLang(lang) {
  if (currentLang === lang) return;
  const opened = document.querySelector('.card-detail.open');
  const openedId = opened ? parseInt(opened.closest('.card').dataset.id) : null;
  currentLang = lang;
  document.getElementById('btn-ja').classList.toggle('active', lang==='ja');
  document.getElementById('btn-cn').classList.toggle('active', lang==='cn');
  updateUILanguage();
  if (openedId) {
    await new Promise(r => setTimeout(r, 0));
    const detailDiv = document.querySelector(`.card[data-id="${openedId}"] .card-detail`);
    if (detailDiv && !detailDiv.classList.contains('open')) await toggleCardDetail(openedId);
    else if (detailDiv?.classList.contains('open')) {
      const state = getCardState(openedId);
      const ch = loadedCharacters[openedId];
      if (ch) renderDetailContent(openedId, ch, state);
    }
  }
}

// ========== 更新时间 ==========
async function loadBuildTime() {
  try {
    const resp = await fetch('data/meta.json');
    const meta = await resp.json();
    const buildTime = new Date(meta.build_time);
    const gmt8 = new Date(buildTime.getTime() + 8 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${gmt8.getUTCFullYear()}/${pad(gmt8.getUTCMonth() + 1)}/${pad(gmt8.getUTCDate())} ${pad(gmt8.getUTCHours())}:${pad(gmt8.getUTCMinutes())}:${pad(gmt8.getUTCSeconds())} GMT+08:00`;

    const localOffset = -new Date().getTimezoneOffset();
    if (localOffset === 480) {
      document.getElementById('updateTime').textContent = `更新时间 ${timeStr}`;
    } else {
      const localStr = buildTime.toLocaleString();
      const sign = localOffset >= 0 ? '+' : '-';
      const hours = Math.floor(Math.abs(localOffset) / 60);
      const minutes = Math.abs(localOffset) % 60;
      const gmt = `GMT${sign}${pad(hours)}:${pad(minutes)}`;
      document.getElementById('updateTime').textContent = `更新时间 ${localStr} (${gmt})`;
    }
  } catch (e) {
    document.getElementById('updateTime').textContent = '更新时间 — (GMT+08:00)';
  }
}

document.getElementById('btn-refresh').onclick = () => { if (confirm('确定要清除缓存并刷新数据？')) location.reload(true); };

(async () => {
  updateUILanguage();
  await loadIndex();
  renderAllCards();
  loadBuildTime();
})();