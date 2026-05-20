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
  if (currentLang === 'cn' && obj[field + '_cn'] !== undefined) return obj[field + '_cn'];
  return obj[field + '_ja'] || obj[field] || '';
}

let characterIndex = [];
let loadedCharacters = {};
const cardStates = {};

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

function compareCharacters(a, b) {
  const field = currentSortField;
  const order = currentSortOrder === 'desc' ? -1 : 1;
  let valA = a[field], valB = b[field];
  if (Array.isArray(valA)) valA = valA[0];
  if (Array.isArray(valB)) valB = valB[0];
  if (valA == null && valB == null) return 0;
  if (valA == null) return 1 * order;
  if (valB == null) return -1 * order;
  if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * order;
  return (valA - valB) * order;
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
    const opt = document.createElement('option');
    opt.value = sf.field;
    opt.textContent = currentLang === 'cn' ? sf.label_cn : sf.label_ja;
    if (sf.field === currentSortField) opt.selected = true;
    select.appendChild(opt);
  });
  select.onchange = () => { currentSortField = select.value; renderAllCards(); };
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
  const status = indexEntry.initial_status || {};
  const initialWT = indexEntry.initial_wt != null ? indexEntry.initial_wt : '—';

  const traitColorName = getField(indexEntry, 'trait_color_name');
  const supportColorName = getField(indexEntry, 'support_color_name');
  const colorSwatch = (traitColorName || supportColorName) ? `
    <div class="color-swatch-inline">
      <span style="color:${getColorHex(traitColorName)}">${traitColorName || '?'}</span>
      <svg width="26" height="26" viewBox="0 0 30 30">
        <polygon points="15,0 0,15 15,30" fill="${getColorHex(traitColorName)}" />
        <polygon points="15,0 30,15 15,30" fill="${getColorHex(supportColorName)}" />
      </svg>
      <span style="color:${getColorHex(supportColorName)}">${supportColorName || '?'}</span>
    </div>` : '';

  // 基础属性小卡片（顺序：hp, speed, attack, defense, magic, mental）
  const statCards = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">${t('statLabels').hp}</div><div class="stat-value">${status.hp ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').speed}</div><div class="stat-value">${status.speed ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').attack}</div><div class="stat-value">${status.attack ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').defense}</div><div class="stat-value">${status.defense ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').magic}</div><div class="stat-value">${status.magic ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').mental}</div><div class="stat-value">${status.mental ?? '?'}</div></div>
    </div>`;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-left">
        <div class="card-title">
          ${name}${alias ? `<span class="alias">${alias}</span>` : ''}
          <span class="initial-wt-badge">${t('initialWTLabel')}: ${initialWT}</span>
        </div>
        <div class="rarity">${stars} (${indexEntry.initial_rarity}→${indexEntry.max_rarity})</div>
        <div class="attrs">${attrs} | ${role}</div>
        <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="release-date">${t('releaseDate')}: ${releaseDate}</div>
        ${statCards}
      </div>
      <div class="card-right">
        ${colorSwatch}
        <div class="switch-buttons"></div>
      </div>
    </div>
    <div class="card-detail"></div>
  `;

  card.querySelector('.card-header').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    toggleCardDetail(indexEntry.id);
  });

  return card;
}

function getCardState(id) {
  if (!cardStates[id]) cardStates[id] = { evo: 'post', range: 'inrange', showTransform: false };
  return cardStates[id];
}

function setCardState(id, newState) { cardStates[id] = { ...cardStates[id], ...newState }; }

async function toggleCardDetail(id) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;
  if (detailDiv.classList.contains('open')) { detailDiv.classList.remove('open'); return; }

  detailDiv.innerHTML = `<div class="loading">${t('loading')}</div>`;
  detailDiv.classList.add('open');

  try {
    const char = await loadCharacter(id);
    renderDetailContent(id, char, getCardState(id));
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">${t('loadFailed')}</div>`;
  }
}

function renderDetailContent(id, char, state) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;

  let activeChar = char;
  if (state.showTransform && char._transform) activeChar = char._transform;

  detailDiv.innerHTML = generateDetailHTML(activeChar, state);
  bindCardButtons(id, activeChar, char, state);
}

function generateDetailHTML(activeChar, state) {
  // 队长技能（如果有）
  let leaderHTML = '';
  if (activeChar.leader_skill) {
    leaderHTML = `
    <div class="section-block">
      <div class="banner-title">${t('leaderSkillSection')}</div>
      <div class="content-block">
        ${renderSkillCardNew(activeChar.leader_skill, true)}
      </div>
    </div>`;
  }

  // 技能列表
  let skillsHTML = '';
  const typeText = t('skillType');
  const rangeGroup = activeChar._rangeSkills ? activeChar._rangeSkills['inrange'] : null;
  const skills = activeChar._skills || [];

  if (skills.length > 0) {
    let innerHTML = '';
    skills.forEach(group => {
      let levels = [];
      if (state.range === 'inrange' && rangeGroup) {
        if (group.type === 'normal1') levels = rangeGroup.skill1 || [];
        else if (group.type === 'normal2') levels = rangeGroup.skill2 || [];
        else levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
      } else {
        levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
      }
      if (!levels || levels.length === 0) levels = group.post_evolution.length > 0 ? group.post_evolution : group.pre_evolution;

      const levelTabs = levels.length > 1 ? `<div class="level-tabs">${levels.map((s, i) => `<button class="level-tab ${i === levels.length - 1 ? 'active' : ''}" data-index="${i}">${t('level')} ${i+1}</button>`).join('')}</div>` : '';
      const skillCard = levels[levels.length - 1] ? renderSkillCardNew(levels[levels.length - 1]) : '';

      innerHTML += `<div class="skill-group" data-group="${group.type}">
        <div class="skill-group-header">
          <span class="skill-group-title">${typeText[group.type] || group.type}</span>
          ${levelTabs}
        </div>
        ${skillCard ? `<div class="skill-card-container">${skillCard}</div>` : `<div class="no-data">${t('none')}</div>`}
      </div>`;
    });

    // EX技能
    const exSkills = activeChar._exSkills || [];
    if (exSkills.length > 0) {
      const levelTabs = exSkills.length > 1 ? `<div class="level-tabs">${exSkills.map((s, i) => `<button class="level-tab ${i === exSkills.length - 1 ? 'active' : ''}" data-index="${i}">${t('level')} ${i+1}</button>`).join('')}</div>` : '';
      const skillCard = exSkills[exSkills.length - 1] ? renderSkillCardNew(exSkills[exSkills.length - 1]) : '';
      innerHTML += `<div class="skill-group" data-group="extra">
        <div class="skill-group-header">
          <span class="skill-group-title">${t('skillType').extra}</span>
          ${levelTabs}
        </div>
        ${skillCard ? `<div class="skill-card-container">${skillCard}</div>` : `<div class="no-data">${t('none')}</div>`}
      </div>`;
    }

    skillsHTML = `
    <div class="section-block">
      <div class="banner-title">${t('skillSection')}</div>
      <div class="content-block">${innerHTML}</div>
    </div>`;
  }

  // 能力区块
  const abilitiesHTML = renderAbilitiesHTML(activeChar, state.evo);

  return `${leaderHTML}${skillsHTML}${abilitiesHTML}`;
}

function renderSkillCardNew(skill, isLeader = false) {
  const title = skill.name || `ID:${skill.id}`;
  let desc = skill.description || '';
  if (skill.effects) {
    skill.effects.forEach((eff, i) => {
      const val = (eff.value ?? 0) / 100;
      desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), Number.isInteger(val) ? val : val.toFixed(1));
    });
  }
  const target = getField(skill, 'target_name') || skill.skill_target_type || '?';
  const attr = (skill.attack_attributes || []).map(a => ({1:'斬',2:'打',3:'突',5:'火',6:'氷',7:'雷',8:'風'}[a] || a)).join('/');
  const wt = 200 + (skill.wait ?? 0);

  return `<div class="skill-card-new">
    <div class="banner-title">${title} <small>(ID:${skill.id})</small></div>
    <div class="content-block">
      <div class="skill-desc">${desc}</div>
      <div class="skill-stats">
        <span class="skill-stat">${t('target')}: ${target}</span>
        ${attr ? `<span class="skill-stat">${t('attribute')}: ${attr}</span>` : ''}
        <span class="skill-stat">${t('power')}: ${skill.power ?? 0}%</span>
        <span class="skill-stat">${t('break')}: ${skill.break_power ?? 0}%</span>
        <span class="skill-stat">${t('wt')}: ${wt}</span>
        <span class="skill-stat">${t('limit')}: ${skill.limit_count ?? '—'}</span>
      </div>
    </div>
  </div>`;
}

function renderAbilitiesHTML(char, evoState) {
  const map = char._skillDetails || {};
  const evolvedIds = new Set(char.all_skill_evolved_ability_ids || []);
  const normalIds = (char.ability_ids || []).filter(id => !evolvedIds.has(id));
  const evoIds = evoState === 'post' ? (char.all_skill_evolved_ability_ids || []) : [];
  const allIds = [...new Set([...normalIds, ...evoIds])];
  const abilities = allIds.map(id => map[id]).filter(Boolean);
  const supportIds = char.support_ability_ids || [];

  let html = `
    <div class="section-block">
      <div class="banner-title">${t('abilityTitle')}</div>
      <div class="content-block">
        ${abilities.length ? abilities.map(a => renderAbilityCardNew(a)).join('') : `<div class="no-data">${t('none')}</div>`}
      </div>
    </div>`;

  html += `
    <div class="section-block">
      <div class="banner-title support-ability-header">
        <span>${t('supportAbilityTitle')}</span>
        ${supportIds.length ? `
          <div class="support-rarity-tabs">
            ${supportIds.map((sid, idx) => {
              if (sid == null) return '';
              const maxRarity = char.max_rarity || 8;
              const defaultIdx = Math.min(maxRarity - 1, supportIds.length - 1);
              return `<button class="level-tab support-rarity-btn ${idx === defaultIdx ? 'active' : ''}" data-support-idx="${idx}">${t('rarityLabel')[idx]}</button>`;
            }).join('')}
          </div>` : ''}
      </div>
      <div class="content-block">
        ${supportIds.length ? `<div class="support-ability-content">${map[supportIds[Math.min((char.max_rarity || 8) - 1, supportIds.length - 1)]] ? renderAbilityCardNew(map[supportIds[Math.min((char.max_rarity || 8) - 1, supportIds.length - 1)]]) : `<div class="no-data">${t('none')}</div>`}</div>` : `<div class="no-data">${t('none')}</div>`}
      </div>
    </div>`;

  return html;
}

function renderAbilityCardNew(ability) {
  let desc = ability.description || '';
  if (ability.effects) {
    ability.effects.forEach((eff, i) => {
      const val = (eff.value ?? 0) / 100;
      desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), Number.isInteger(val) ? val : val.toFixed(1));
    });
  }
  return `<div class="ability-card-new">
    <div class="banner-title">${ability.name || `ID:${ability.id}`}</div>
    <div class="content-block">
      <div class="ability-desc">${desc}</div>
    </div>
  </div>`;
}

function getColorHex(name) { return name ? (COLOR_MAP[name] || '#CCCCCC') : '#CCCCCC'; }

function bindCardButtons(id, activeChar, originalChar, state) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (!card) return;

  const buttonsDiv = card.querySelector('.switch-buttons');
  if (buttonsDiv) {
    buttonsDiv.innerHTML = '';
    const hasEvo = (activeChar._skills || []).some(s => s.post_evolution.length > 0);
    const hasRange = Object.keys(activeChar._rangeSkills || {}).length > 0;
    const hasTransform = originalChar._transform != null;

    if (hasEvo) {
      const btn = document.createElement('button'); btn.textContent = t('switchText');
      btn.className = state.evo === 'post' ? 'active' : '';
      btn.onclick = (e) => { e.stopPropagation(); setCardState(id, { evo: state.evo === 'post' ? 'pre' : 'post' }); renderDetailContent(id, originalChar, getCardState(id)); };
      buttonsDiv.appendChild(btn);
    }
    if (hasRange) {
      const btn = document.createElement('button'); btn.textContent = t('switchText');
      btn.className = state.range === 'inrange' ? 'active' : '';
      btn.onclick = (e) => { e.stopPropagation(); setCardState(id, { range: state.range === 'inrange' ? 'normal' : 'inrange' }); renderDetailContent(id, originalChar, getCardState(id)); };
      buttonsDiv.appendChild(btn);
    }
    if (hasTransform) {
      const btn = document.createElement('button'); btn.textContent = t('switchText');
      btn.className = state.showTransform ? 'active' : '';
      btn.onclick = (e) => { e.stopPropagation(); setCardState(id, { showTransform: !state.showTransform }); renderDetailContent(id, originalChar, getCardState(id)); };
      buttonsDiv.appendChild(btn);
    }
  }

  card.querySelectorAll('.skill-group').forEach(group => {
    const tabs = group.querySelectorAll('.level-tab');
    const skillCardContainer = group.querySelector('.skill-card-container');
    const groupType = group.dataset.group;
    tabs.forEach(tab => {
      tab.onclick = () => {
        const idx = parseInt(tab.dataset.index);
        let levelsArr = [];
        if (groupType === 'extra') levelsArr = activeChar._exSkills || [];
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
        if (levelsArr && levelsArr[idx] && skillCardContainer) {
          skillCardContainer.innerHTML = renderSkillCardNew(levelsArr[idx]);
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
      const content = card.querySelector('.support-ability-content');
      if (content) content.innerHTML = ability ? renderAbilityCardNew(ability) : `<div class="no-data">${t('none')}</div>`;
      card.querySelectorAll('.support-rarity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
}

function filterCards() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.card').forEach(c => c.style.display = c.querySelector('.card-title')?.textContent.toLowerCase().includes(q) ? '' : 'none');
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
      const char = loadedCharacters[openedId];
      if (char) renderDetailContent(openedId, char, state);
    }
  }
}

document.getElementById('btn-refresh').onclick = () => { if (confirm('确定要清除缓存并刷新数据？')) location.reload(true); };

(async () => {
  updateUILanguage();
  await loadIndex();
  document.getElementById('sortSelect').value = 'sort_id';
  renderAllCards();
})();