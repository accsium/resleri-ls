// ========== utils.js 内容 ==========
// 多语言界面文本
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
      normal1: 'スキル1', normal2: 'スキル2', burst: 'バーストスキル',
      active: 'アクティブスキル', extra: 'EXスキル'
    },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    abilityTitle: '能力',
    supportAbilityTitle: '亜空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '並べ替え',
    filterLabel: 'フィルター',
    applyFilter: '適用',
    clearFilter: 'クリア',
    synthesisTitle: '調和',
    battleTraitTitle: 'バトルアイテム特性',
    equipTraitTitle: '装備アイテム特性',
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
      normal1: '第一技能', normal2: '第二技能', burst: '爆发技能',
      active: '主动技能', extra: 'EX技能'
    },
    statLabels: { hp: 'HP', speed: '速度', attack: '物攻', defense: '物防', magic: '魔攻', mental: '魔防' },
    abilityTitle: '能力',
    supportAbilityTitle: '亚空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
    sortLabel: '排序',
    filterLabel: '筛选',
    applyFilter: '应用筛选',
    clearFilter: '清除',
    synthesisTitle: '调和',
    battleTraitTitle: '战斗道具特性',
    equipTraitTitle: '装备道具特性',
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
  if (currentLang === 'cn' && obj[field + '_cn'] !== undefined) return obj[field + '_cn'];
  return obj[field + '_ja'] || obj[field] || '';
}
function rarityToStars(r) {
  const map = {1:'★',2:'★★',3:'★★★',4:'★★★☆',5:'★★★★',6:'★★★★☆',7:'★★★★★',8:'★★★★★★'};
  return map[r] || '★'.repeat(r);
}
function getColorHex(name) { return name ? (COLOR_MAP[name] || '#CCCCCC') : '#CCCCCC'; }

let cardStates = {};

const AVAILABLE_SORT_FIELDS = [
  { field: 'start_at', label_ja: '実装日', label_cn: '实装日期', priority: 0 },
  { field: 'id', label_ja: 'ID', label_cn: 'ID', priority: 1 },
  { field: 'initial_rarity', label_ja: '初期レアリティ', label_cn: '初始稀有度', priority: 2 },
  { field: 'max_rarity', label_ja: '最大レアリティ', label_cn: '最大稀有度', priority: 3 },
  { field: 'role', label_ja: 'ロール', label_cn: '职业', priority: 4 },
  { field: 'base_character_id', label_ja: 'ベースキャラ', label_cn: '原型', priority: 5 },
  { field: 'original_title_id', label_ja: 'シリーズ', label_cn: '系列', priority: 6 },
  { field: 'trait_color_id', label_ja: '調和色-左', label_cn: '调和颜色-左', priority: 7 },
  { field: 'support_color_id', label_ja: '調和色-右', label_cn: '调和颜色-右', priority: 8 },
];

// ========== avatar.js 内容 ==========
function renderAvatar(id, traitColor, supportColor, size = 300) {
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;
  const imgId = `avatar-img-${id}`;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
      <polygon points="150,0 300,150 150,300" fill="${supportHex}" />
      <defs>
        <clipPath id="clip-${id}">
          <polygon points="22,44 278,44 278,172 150,300 22,172" />
        </clipPath>
      </defs>
      <image id="${imgId}" href="${fallbackPath}" x="22" y="44" height="256"
             clip-path="url(#clip-${id})" preserveAspectRatio="xMidYMax meet" />
    </svg>
  `;
}

function initAvatar(id) {
  const img = document.getElementById(`avatar-img-${id}`);
  if (!img) return;
  const realSrc = `images/characters/${id}.png`;
  const testImg = new Image();
  testImg.onload = () => { img.setAttribute('href', realSrc); };
  testImg.src = realSrc;
}

// ========== card.js 内容 ==========
function renderSynthesisModule(char) {
  const traitName = getField(char, 'trait_color_name') || '?';
  const supportName = getField(char, 'support_color_name') || '?';
  const battleTraits = getField(char, 'battle_tool_trait_names') || [];
  const equipTraits = getField(char, 'equipment_tool_trait_names') || [];
  const allTraits = [...battleTraits, ...equipTraits];

  return `
    <div class="synthesis-module">
      <div class="synthesis-color-row">
        <span style="color:${getColorHex(traitName)}">${traitName}</span>
        <svg width="20" height="20" viewBox="0 0 30 30">
          <polygon points="15,0 0,15 15,30" fill="${getColorHex(traitName)}" />
          <polygon points="15,0 30,15 15,30" fill="${getColorHex(supportName)}" />
        </svg>
        <span style="color:${getColorHex(supportName)}">${supportName}</span>
      </div>
      <div class="synthesis-traits">
        ${allTraits.map(trait => `<div class="trait-tag">${trait}</div>`).join('')}
      </div>
    </div>
  `;
}

function createToggleSwitch(type, checked, label) {
  return `
    <label class="toggle-switch" data-type="${type}" title="${label}">
      <input type="checkbox" ${checked ? 'checked' : ''}>
      <span class="slider"></span>
    </label>
  `;
}

function createCard(indexEntry) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = indexEntry.id;

  const name = currentLang === 'cn' ? (indexEntry.name_cn || indexEntry.name_ja) : indexEntry.name_ja;
  const alias = indexEntry.another_name || '';
  const minStars = rarityToStars(indexEntry.initial_rarity);
  const maxStars = rarityToStars(indexEntry.max_rarity);
  const maxRarity = indexEntry.max_rarity || 8;
  const role = getField(indexEntry, 'role_name');
  const tags = (getField(indexEntry, 'tag_names') || []).slice(0, 3);
  const releaseDate = indexEntry.start_at ? new Date(indexEntry.start_at).toLocaleDateString('ja-JP') : '—';
  const status = indexEntry.initial_status || {};
  const initialWT = indexEntry.initial_wt != null ? indexEntry.initial_wt : '—';

  const avatarHTML = renderAvatar(indexEntry.id, getField(indexEntry, 'trait_color_name'), getField(indexEntry, 'support_color_name'), 75);

  const statOrder = ['initialWT', 'hp', 'speed', 'attack', 'defense', 'magic', 'mental'];
  const statCards = statOrder.map(key => {
    let label, value;
    if (key === 'initialWT') {
      label = t('initialWTLabel');
      value = initialWT;
    } else {
      label = t('statLabels')[key];
      value = status[key] ?? '?';
    }
    return `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
  }).join('');

  card.innerHTML = `
    <div class="card-header">
      <div class="card-part1">
        <div class="avatar-section">
          <div class="avatar-col">${avatarHTML}</div>
          <div class="initial-rarity">${minStars}</div>
          <div class="attrs">${getField(indexEntry, 'attack_attribute_names').join(' / ')} | ${role}</div>
        </div>
        <div class="info-section">
          <div class="info-header">
            <div class="card-title">
              ${name}${alias ? `<span class="alias">${alias}</span>` : ''}
              <span class="char-id">ID:${indexEntry.id}</span>
            </div>
            <div class="header-buttons">
              <div class="switch-buttons"></div>
              <button class="expand-btn" data-action="toggle" aria-label="展开">▼</button>
            </div>
          </div>
          <div class="info-lower">
            <div class="info-left">
              <div class="max-rarity" style="color: ${maxRarity === 8 ? '#ff69b4' : '#b8860b'}">${maxStars}</div>
              <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
              <div class="release-date">${t('joinDate')}: ${releaseDate}</div>
            </div>
            <div class="synthesis-section">
              <div class="synthesis-placeholder"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-part2">
        <div class="stats-row">${statCards}</div>
      </div>
    </div>
    <div class="card-detail"></div>
  `;

  const expandBtn = card.querySelector('.expand-btn');
  expandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const detailDiv = card.querySelector('.card-detail');
    const willBeOpen = !detailDiv.classList.contains('open');
    toggleCardDetail(indexEntry.id);
    expandBtn.innerHTML = willBeOpen ? '▲' : '▼';
    expandBtn.setAttribute('aria-label', willBeOpen ? '收起' : '展开');
  });

  loadCharacter(indexEntry.id).then(char => {
    if (char) {
      const synthSection = card.querySelector('.synthesis-section');
      if (synthSection) synthSection.innerHTML = renderSynthesisModule(char);
      updateSwitchButtonsState(card, getCardState(indexEntry.id), char);
    }
  });

  initAvatar(indexEntry.id);

  return card;
}

function updateSwitchButtonsState(card, state, char) {
  const buttonsDiv = card.querySelector('.switch-buttons');
  if (!buttonsDiv || !char) return;
  const hasEvo = (char._skills || []).some(s => s.post_evolution.length > 0);
  const hasRange = Object.keys(char._rangeSkills || {}).length > 0;
  const hasTransform = char._transform != null;

  let html = '';
  if (hasEvo) html += createToggleSwitch('evo', state.evo === 'post', '切换进化状态');
  if (hasRange) html += createToggleSwitch('range', state.range === 'inrange', '切换范围状态');
  if (hasTransform) html += createToggleSwitch('transform', state.showTransform, '切换变身状态');

  buttonsDiv.innerHTML = html;

  buttonsDiv.querySelectorAll('.toggle-switch input').forEach(input => {
    input.addEventListener('change', (e) => {
      const type = e.target.closest('.toggle-switch').dataset.type;
      const id = parseInt(card.dataset.id);
      const currentState = getCardState(id);
      switch(type) {
        case 'evo': setCardState(id, { evo: currentState.evo === 'post' ? 'pre' : 'post' }); break;
        case 'range': setCardState(id, { range: currentState.range === 'inrange' ? 'normal' : 'inrange' }); break;
        case 'transform': setCardState(id, { showTransform: !currentState.showTransform }); break;
      }
      const detailDiv = card.querySelector('.card-detail.open');
      if (detailDiv) {
        const ch = loadedCharacters[id];
        if (ch) renderDetailContent(id, ch, getCardState(id));
      }
    });
  });
}

function getCardState(id) {
  if (!cardStates[id]) cardStates[id] = { evo: 'post', range: 'inrange', showTransform: false };
  return cardStates[id];
}
function setCardState(id, newState) { cardStates[id] = { ...cardStates[id], ...newState }; }

// ========== script.js 内容 ==========
let characterIndex = [];
let loadedCharacters = {};
let activeSortFields = [...AVAILABLE_SORT_FIELDS].sort((a, b) => a.priority - b.priority);
let currentSortOrder = 'desc';
let activeFilters = { attack_attributes: [], role: [] };

async function loadIndex() {
  const resp = await fetch('data/character_index.json');
  characterIndex = await resp.json();
}
async function loadCharacter(id) {
  if (loadedCharacters[id]) return loadedCharacters[id];
  const resp = await fetch(`data/${id}.json`);
  const char = await resp.json();
  loadedCharacters[id] = char;
  return char;
}

function compareCharacters(a, b) {
  for (const sf of activeSortFields) {
    const order = currentSortOrder === 'desc' ? -1 : 1;
    let valA = a[sf.field], valB = b[sf.field];
    if (Array.isArray(valA)) valA = valA[0];
    if (Array.isArray(valB)) valB = valB[0];
    if (valA == null && valB == null) continue;
    if (valA == null) return 1 * order;
    if (valB == null) return -1 * order;
    if (typeof valA === 'string' && typeof valB === 'string') { const cmp = valA.localeCompare(valB); if (cmp !== 0) return cmp * order; }
    else if (valA < valB) return -1 * order;
    else if (valA > valB) return 1 * order;
  }
  return 0;
}

function applyFilters(char) {
  if (activeFilters.attack_attributes.length > 0) {
    const attrs = char.attack_attributes || [];
    if (!activeFilters.attack_attributes.some(a => attrs.includes(a))) return false;
  }
  if (activeFilters.role.length > 0 && !activeFilters.role.includes(char.role)) return false;
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
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '__default__';
  defaultOpt.textContent = currentLang === 'cn' ? '默认排序' : 'デフォルト';
  if (activeSortFields[0]?.field === 'start_at' && activeSortFields[1]?.field === 'id') defaultOpt.selected = true;
  select.appendChild(defaultOpt);
  AVAILABLE_SORT_FIELDS.forEach(sf => {
    const opt = document.createElement('option');
    opt.value = sf.field;
    opt.textContent = currentLang === 'cn' ? sf.label_cn : sf.label_ja;
    if (activeSortFields[0]?.field === sf.field) opt.selected = true;
    select.appendChild(opt);
  });
  select.onchange = () => {
    const chosenField = select.value;
    if (chosenField === '__default__') {
      activeSortFields = [...AVAILABLE_SORT_FIELDS].sort((a, b) => a.priority - b.priority);
    } else {
      const newList = [...AVAILABLE_SORT_FIELDS];
      const idx = newList.findIndex(sf => sf.field === chosenField);
      if (idx !== -1) {
        const [chosen] = newList.splice(idx, 1);
        newList.unshift(chosen);
        activeSortFields = newList.sort((a, b) => {
          if (a.field === chosen.field) return -1;
          if (b.field === chosen.field) return 1;
          return a.priority - b.priority;
        });
      }
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
  getFilteredAndSortedCharacters().forEach(c => container.appendChild(createCard(c)));
  filterCards();
}

async function toggleCardDetail(id) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;
  if (detailDiv.classList.contains('open')) { detailDiv.classList.remove('open'); return; }
  detailDiv.innerHTML = `<div class="loading">${t('loading')}</div>`;
  detailDiv.classList.add('open');
  try {
    const char = await loadCharacter(id);
    if (!char) throw new Error('角色数据为空');
    renderDetailContent(id, char, getCardState(id));
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">${t('loadFailed')}: ${e.message || e}</div>`;
  }
}

function renderDetailContent(id, char, state) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;
  try {
    let activeChar = char;
    if (state.showTransform && char._transform) activeChar = char._transform;
    detailDiv.innerHTML = generateDetailHTML(activeChar, state);
    bindInnerButtons(id, activeChar, char, state);
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">渲染失败：${e.message || e}</div>`;
  }
}

function generateDetailHTML(activeChar, state) {
  let html = '';
  const allSkillTypes = [];

  if (activeChar.leader_skill) {
    allSkillTypes.push({ type: 'leader', name: t('leaderSkillSection'), levels: [activeChar.leader_skill] });
  }

  const skills = activeChar._skills || [];
  const typeText = t('skillType');
  const rangeGroup = activeChar._rangeSkills ? activeChar._rangeSkills['inrange'] : null;

  // 将 active 技能统一合并
  const activeSkills = [];
  skills.forEach(group => {
    if (group.type.startsWith('active')) {
      let levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
      if (!levels || levels.length === 0) levels = group.post_evolution.length > 0 ? group.post_evolution : group.pre_evolution;
      if (levels && levels.length > 0) activeSkills.push(...levels);
    }
  });

  if (activeSkills.length > 0) {
    allSkillTypes.push({ type: 'active', name: t('skillType').active, levels: activeSkills });
  }

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
      if (levels && levels.length > 0) {
        allSkillTypes.push({ type: group.type, name: typeText[group.type] || group.type, levels });
      }
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
  document.querySelectorAll('.card').forEach(c => {
    const name = c.querySelector('.card-title')?.textContent?.toLowerCase() || '';
    c.style.display = name.includes(q) ? '' : 'none';
  });
}

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

document.getElementById('btn-ja').onclick = () => switchLang('ja');
document.getElementById('btn-cn').onclick = () => switchLang('cn');
async function switchLang(lang) {
  if (currentLang === lang) return;
  const openedCard = document.querySelector('.card-detail.open');
  const openedId = openedCard ? parseInt(openedCard.closest('.card').dataset.id) : null;
  currentLang = lang;
  document.getElementById('btn-ja').classList.toggle('active', lang === 'ja');
  document.getElementById('btn-cn').classList.toggle('active', lang === 'cn');
  updateUILanguage();
  if (openedId) {
    await new Promise(r => setTimeout(r, 0));
    const detailDiv = document.querySelector(`.card[data-id="${openedId}"] .card-detail`);
    if (detailDiv && !detailDiv.classList.contains('open')) await toggleCardDetail(openedId);
    else if (detailDiv && detailDiv.classList.contains('open')) {
      const state = getCardState(openedId);
      const ch = loadedCharacters[openedId];
      if (ch) renderDetailContent(openedId, ch, state);
    }
  }
}

document.getElementById('btn-refresh').onclick = () => { if (confirm('确定要清除缓存并刷新数据？')) location.reload(true); };

(async () => {
  updateUILanguage();
  await loadIndex();
  renderAllCards();
})();