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
    debugNoSkills: 'スキルデータがありません',
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
    debugNoSkills: '技能数据缺失',
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

function getCardState(id) {
  if (!cardStates[id]) {
    cardStates[id] = { evo: 'post', range: 'inrange', showTransform: false };
  }
  return cardStates[id];
}

function setCardState(id, newState) {
  cardStates[id] = { ...cardStates[id], ...newState };
}

async function toggleCardDetail(id) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;

  if (detailDiv.classList.contains('open')) {
    detailDiv.classList.remove('open');
    return;
  }

  detailDiv.innerHTML = `<div class="loading">${t('loading')}</div>`;
  detailDiv.classList.add('open');

  try {
    const char = await loadCharacter(id);
    // 调试输出：打印角色对象
    console.log(`[Debug] Loaded character ${id}:`, char);
    console.log(`_skills:`, char._skills);
    console.log(`_exSkills:`, char._exSkills);
    console.log(`_rangeSkills:`, char._rangeSkills);
    if (char._transform) console.log(`_transform._skills:`, char._transform._skills);

    const state = getCardState(id);
    renderDetailContent(id, char, state);
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">${t('loadFailed')}</div>`;
  }
}

function renderDetailContent(id, char, state) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;

  let activeChar = char;
  if (state.showTransform && char._transform) {
    activeChar = char._transform;
    console.log(`[Debug] Showing transform for ${id}:`, activeChar._skills);
  }

  detailDiv.innerHTML = generateDetailHTML(id, activeChar, char, state);
  bindCardButtons(id, activeChar, char, state);
}

function generateDetailHTML(id, activeChar, originalChar, state) {
  const tagNames = getField(activeChar, 'tag_names');
  const attrNames = getField(activeChar, 'attack_attribute_names').join(' / ');
  const roleName = getField(activeChar, 'role_name');
  const baseCharName = getField(activeChar, 'base_character_name');
  const seriesName = getField(activeChar, 'original_title_name');
  const traitColorName = getField(activeChar, 'trait_color_name');
  const supportColorName = getField(activeChar, 'support_color_name');
  const startDate = activeChar.start_at ? new Date(activeChar.start_at).toLocaleDateString('ja-JP') : '不明';
  const isAlchemist = activeChar.is_alchemist ? t('yes') : t('no');

  let skillsHTML = '';
  const typeText = t('skillType');
  const rangeGroup = activeChar._rangeSkills ? activeChar._rangeSkills['inrange'] : null;

  const skills = activeChar._skills || [];
  const exSkills = activeChar._exSkills || [];

  // 调试信息：显示技能数量
  skillsHTML += `<div style="font-size:12px;color:#888;">[Debug] 技能组数: ${skills.length}, EX技能数: ${exSkills.length}</div>`;

  skills.forEach(group => {
    let levels = [];
    if (state.range === 'inrange' && rangeGroup) {
      if (group.type === 'normal1') levels = rangeGroup.skill1 || [];
      else if (group.type === 'normal2') levels = rangeGroup.skill2 || [];
      else levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
    } else {
      levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution;
    }
    if (!levels || levels.length === 0) {
      // 即使没有技能，也显示占位符
      skillsHTML += `
        <div class="skill-group" data-group="${group.type}">
          <div class="skill-group-header">
            <span class="skill-group-title">${typeText[group.type] || group.type}</span>
          </div>
          <div class="skill-levels">${t('none')}</div>
        </div>`;
      return;
    }

    skillsHTML += `
      <div class="skill-group" data-group="${group.type}">
        <div class="skill-group-header">
          <span class="skill-group-title">${typeText[group.type] || group.type}</span>
        </div>
        <div class="skill-levels">${renderSkillLevels(levels)}</div>
      </div>`;
  });

  if (exSkills.length > 0) {
    skillsHTML += `
      <div class="skill-group" data-group="extra">
        <div class="skill-group-header">
          <span class="skill-group-title">${t('skillType').extra}</span>
        </div>
        <div class="skill-levels">${renderSkillLevels(exSkills)}</div>
      </div>`;
  } else if (skills.length === 0) {
    skillsHTML += `<div class="no-data">${t('debugNoSkills')}</div>`;
  }

  let abilitiesHTML = renderAbilitiesHTML(activeChar, state.evo);

  const colorSwatch = `
    <div style="display:flex; align-items:center; gap:8px; margin:8px 0;">
      <span>调和颜色：</span>
      <span style="color:${getColorHex(traitColorName)}; font-weight:bold;">${traitColorName || '?'}</span>
      <svg width="30" height="30" viewBox="0 0 30 30" style="flex-shrink:0;">
        <polygon points="15,0 0,15 15,30" fill="${getColorHex(traitColorName)}" />
        <polygon points="15,0 30,15 15,30" fill="${getColorHex(supportColorName)}" />
      </svg>
      <span style="color:${getColorHex(supportColorName)}; font-weight:bold;">${supportColorName || '?'}</span>
    </div>`;

  return `
    <div class="section-title">${t('basicStatus')}</div>
    <div class="stat-grid">
      ${renderStat(t('statLabels').hp, activeChar.initial_status?.hp)}
      ${renderStat(t('statLabels').attack, activeChar.initial_status?.attack)}
      ${renderStat(t('statLabels').magic, activeChar.initial_status?.magic)}
      ${renderStat(t('statLabels').defense, activeChar.initial_status?.defense)}
      ${renderStat(t('statLabels').mental, activeChar.initial_status?.mental)}
      ${renderStat(t('statLabels').speed, activeChar.initial_status?.speed)}
    </div>
    <div>${t('attribute')}: ${attrNames} | ${t('role')}: ${roleName} | ${t('alchemist')}: ${isAlchemist}</div>
    ${colorSwatch}
    <div class="section-title">${t('skillSection')}</div>
    ${skillsHTML}
    <div id="abilities-${id}">${abilitiesHTML}</div>
    ${activeChar.leader_skill ? `
      <div class="section-title">${t('leaderSkillSection')}</div>
      <div class="skill-detail-card" style="border-left-color:#eab308;">
        <div class="skill-name">${activeChar.leader_skill.name || t('leaderSkillSection')}</div>
        <div class="skill-desc">${activeChar.leader_skill.description || ''}</div>
      </div>` : ''}
  `;
}

function renderSkillLevels(levels) {
  let html = '';
  if (levels.length > 1) {
    html += '<div class="level-tabs">';
    levels.forEach((skill, idx) => {
      html += `<button class="level-tab" data-index="${idx}">${t('level')} ${idx+1}</button>`;
    });
    html += '</div>';
  }
  const defaultIndex = levels.length - 1;
  if (levels[defaultIndex]) {
    html += `<div class="skill-card-container">${renderSkillCard(levels[defaultIndex])}</div>`;
  }
  return html;
}

function renderSkillCard(skill) {
  const target = getField(skill, 'target_name') || skill.skill_target_type || '?';
  const attr = (skill.attack_attributes || []).map(a => {
    const map = {1:'斬',2:'打',3:'突',5:'火',6:'氷',7:'雷',8:'風'};
    return map[a] || a;
  }).join('/');
  let desc = skill.description || '';
  if (skill.effects) {
    skill.effects.forEach((eff, i) => {
      const raw = eff.value ?? 0;
      const val = raw / 100;
      const display = Number.isInteger(val) ? val : val.toFixed(1);
      desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), display);
    });
  }
  const wt = 200 + (skill.wait ?? 0);
  return `<div class="skill-detail-card">
    <div class="skill-name">${skill.name || '??'} <small>(ID:${skill.id})</small></div>
    <div class="skill-desc">${desc}</div>
    <div class="skill-stats">
      <span class="skill-stat">${t('target')}: ${target}</span>
      ${attr ? `<span class="skill-stat">${t('attribute')}: ${attr}</span>` : ''}
      <span class="skill-stat">${t('power')}: ${skill.power ?? 0}%</span>
      <span class="skill-stat">${t('break')}: ${skill.break_power ?? 0}%</span>
      <span class="skill-stat">${t('wt')}: ${wt}</span>
      <span class="skill-stat">${t('limit')}: ${skill.limit_count ?? '—'}</span>
    </div>
  </div>`;
}

function renderAbilitiesHTML(char, evoState) {
  const abilityMap = char._skillDetails || {};
  const evolvedIds = new Set(char.all_skill_evolved_ability_ids || []);
  const normalIds = (char.ability_ids || []).filter(id => !evolvedIds.has(id));
  const evoIds = evoState === 'post' ? (char.all_skill_evolved_ability_ids || []) : [];
  const allIds = [...new Set([...normalIds, ...evoIds])];
  const abilities = allIds.map(id => abilityMap[id]).filter(Boolean);
  const supportIds = char.support_ability_ids || [];

  let html = `<div class="section-title">${t('abilityTitle')}</div>`;
  if (abilities.length === 0) {
    html += `<div class="no-data">${t('none')}</div>`;
  } else {
    abilities.forEach(a => { html += renderAbilityCard(a); });
  }

  html += `<div class="section-title">${t('supportAbilityTitle')}</div>`;
  if (supportIds.length === 0) {
    html += `<div class="no-data">${t('none')}</div>`;
  } else {
    const maxRarity = char.max_rarity || 8;
    const defaultIdx = Math.min(maxRarity - 1, supportIds.length - 1);
    html += `<div class="level-tabs support-rarity-tabs">`;
    const labels = t('rarityLabel');
    supportIds.forEach((sid, idx) => {
      if (sid == null) return;
      html += `<button class="level-tab support-rarity-btn" data-support-idx="${idx}">${labels[idx]}</button>`;
    });
    html += `</div>`;
    const ability = abilityMap[supportIds[defaultIdx]];
    html += `<div class="support-ability-content">${ability ? renderAbilityCard(ability) : `<div class="no-data">${t('none')}</div>`}</div>`;
  }
  return html;
}

function renderAbilityCard(ability) {
  let desc = ability.description || '';
  if (ability.effects) {
    ability.effects.forEach((eff, i) => {
      const raw = eff.value ?? 0;
      const val = raw / 100;
      const display = Number.isInteger(val) ? val : val.toFixed(1);
      desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), display);
    });
  }
  return `<div class="ability-card">
    <div class="ability-name">${ability.name || `ID:${ability.id}`}</div>
    <div>${desc}</div>
  </div>`;
}

function renderStat(label, value) {
  return `<div class="stat-item"><div class="stat-value">${value ?? '?'}</div><div class="stat-label">${label}</div></div>`;
}

function getColorHex(name) {
  if (!name) return '#CCCCCC';
  return COLOR_MAP[name] || '#CCCCCC';
}

function bindCardButtons(id, activeChar, originalChar, state) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (!card) return;

  const buttonsDiv = card.querySelector('.switch-buttons');
  if (buttonsDiv) {
    buttonsDiv.innerHTML = '';
    const hasEvolution = (activeChar._skills || []).some(s => s.post_evolution.length > 0);
    const hasRange = Object.keys(activeChar._rangeSkills || {}).length > 0;
    const hasTransform = originalChar._transform != null;

    if (hasEvolution) {
      const btn = document.createElement('button');
      btn.textContent = t('switchText');
      btn.className = state.evo === 'post' ? 'active' : '';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newEvo = state.evo === 'post' ? 'pre' : 'post';
        setCardState(id, { evo: newEvo });
        renderDetailContent(id, originalChar, getCardState(id));
      });
      buttonsDiv.appendChild(btn);
    }

    if (hasRange) {
      const btn = document.createElement('button');
      btn.textContent = t('switchText');
      btn.className = state.range === 'inrange' ? 'active' : '';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newRange = state.range === 'inrange' ? 'normal' : 'inrange';
        setCardState(id, { range: newRange });
        renderDetailContent(id, originalChar, getCardState(id));
      });
      buttonsDiv.appendChild(btn);
    }

    if (hasTransform) {
      const btn = document.createElement('button');
      btn.textContent = t('switchText');
      btn.className = state.showTransform ? 'active' : '';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setCardState(id, { showTransform: !state.showTransform });
        renderDetailContent(id, originalChar, getCardState(id));
      });
      buttonsDiv.appendChild(btn);
    }
  }

  const skillGroups = card.querySelectorAll('.skill-levels');
  skillGroups.forEach(group => {
    const tabs = group.querySelectorAll('.level-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const idx = parseInt(tab.dataset.index);
        const groupType = group.closest('.skill-group')?.dataset.group;
        let levelsArr = [];
        if (groupType === 'extra') {
          levelsArr = activeChar._exSkills || [];
        } else {
          const skillGroupObj = (activeChar._skills || []).find(g => g.type === groupType);
          if (skillGroupObj) {
            const rangeGroup = activeChar._rangeSkills?.['inrange'];
            if (state.range === 'inrange' && rangeGroup) {
              if (groupType === 'normal1') levelsArr = rangeGroup.skill1 || [];
              else if (groupType === 'normal2') levelsArr = rangeGroup.skill2 || [];
              else levelsArr = state.evo === 'post' ? skillGroupObj.post_evolution : skillGroupObj.pre_evolution;
            } else {
              levelsArr = state.evo === 'post' ? skillGroupObj.post_evolution : skillGroupObj.pre_evolution;
            }
          }
        }
        if (levelsArr[idx]) {
          group.querySelector('.skill-card-container').innerHTML = renderSkillCard(levelsArr[idx]);
          group.querySelectorAll('.level-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        }
      });
    });
  });

  const supportTabs = card.querySelectorAll('.support-rarity-btn');
  supportTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.supportIdx);
      const supportIds = activeChar.support_ability_ids || [];
      const abilityMap = activeChar._skillDetails || {};
      const ability = abilityMap[supportIds[idx]];
      const content = card.querySelector('.support-ability-content');
      if (content) {
        content.innerHTML = ability ? renderAbilityCard(ability) : `<div class="no-data">${t('none')}</div>`;
      }
      card.querySelectorAll('.support-rarity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function filterCards() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const name = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
    card.style.display = name.includes(query) ? '' : 'none';
  });
}

document.getElementById('applyFilterBtn').addEventListener('click', () => {
  const attrChecks = document.querySelectorAll('.attr-check:checked');
  activeFilters.attack_attributes = Array.from(attrChecks).map(cb => parseInt(cb.value));
  const roleChecks = document.querySelectorAll('.role-check:checked');
  activeFilters.role = Array.from(roleChecks).map(cb => parseInt(cb.value));
  renderAllCards();
  document.getElementById('filterPanel').style.display = 'none';
});

document.getElementById('clearFilterBtn').addEventListener('click', () => {
  document.querySelectorAll('.attr-check, .role-check').forEach(cb => cb.checked = false);
  activeFilters = { attack_attributes: [], role: [] };
  renderAllCards();
  document.getElementById('filterPanel').style.display = 'none';
});

document.getElementById('filterToggle').addEventListener('click', () => {
  const panel = document.getElementById('filterPanel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('btn-ja').addEventListener('click', () => switchLang('ja'));
document.getElementById('btn-cn').addEventListener('click', () => switchLang('cn'));

async function switchLang(lang) {
  if (currentLang === lang) return;
  currentLang = lang;
  document.getElementById('btn-ja').classList.toggle('active', lang === 'ja');
  document.getElementById('btn-cn').classList.toggle('active', lang === 'cn');
  updateUILanguage();
}

document.getElementById('btn-refresh').addEventListener('click', () => {
  if (confirm('确定要清除缓存并刷新数据？')) {
    location.reload(true);
  }
});

(async () => {
  updateUILanguage();
  await loadIndex();
  document.getElementById('sortSelect').value = 'sort_id';
  renderAllCards();
})();