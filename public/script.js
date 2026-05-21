// 全局数据
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

// ========== 数据加载 ==========
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

// ========== 排序与筛选 ==========
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

// ========== UI 更新 ==========
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

// ========== 卡片详情展开 ==========
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
    detailDiv.innerHTML = `<div class="no-data">${t('loadFailed')}: ${e.message}</div>`;
  }
}

function renderDetailContent(id, char, state) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;

  try {
    let activeChar = char;
    if (state.showTransform && char._transform) activeChar = char._transform;
    detailDiv.innerHTML = generateDetailHTML(activeChar, state);
    bindCardButtons(id, activeChar, char, state);
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">渲染失败：${e.message}</div>`;
  }
}

function generateDetailHTML(activeChar, state) {
  let html = '';

  // 队长技能
  if (activeChar.leader_skill) {
    html += `<div class="section-title">${t('leaderSkillSection')}</div>`;
    html += `<div class="banner-title">${activeChar.leader_skill.name || t('leaderSkillSection')}</div>`;
    html += `<div class="content-block"><div class="skill-desc">${activeChar.leader_skill.description || ''}</div></div>`;
  }

  // 技能区块
  const skills = activeChar._skills || [];
  const exSkills = activeChar._exSkills || [];
  if (skills.length > 0 || exSkills.length > 0) {
    html += `<div class="section-title">${t('skillSection')}</div>`;

    const typeText = t('skillType');
    const rangeGroup = activeChar._rangeSkills ? activeChar._rangeSkills['inrange'] : null;

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

      html += `<div class="subsection-title">${typeText[group.type] || group.type}</div>`;

      const levelTabs = levels.length > 1 ? `<div class="level-tabs">${levels.map((s, i) => `<button class="level-tab ${i === levels.length - 1 ? 'active' : ''}" data-index="${i}">${t('level')}${i+1}</button>`).join('')}</div>` : '';
      const skillCard = levels[levels.length - 1] ? renderSkillCard(levels[levels.length - 1]) : '';

      html += `<div class="skill-group" data-group="${group.type}">`;
      html += `<div class="banner-title">${levelTabs}</div>`;
      html += `<div class="content-block">${skillCard || `<div class="no-data">${t('none')}</div>`}</div>`;
      html += `</div>`;
    });

    if (exSkills.length > 0) {
      html += `<div class="subsection-title">${t('skillType').extra}</div>`;
      const levelTabs = exSkills.length > 1 ? `<div class="level-tabs">${exSkills.map((s, i) => `<button class="level-tab ${i === exSkills.length - 1 ? 'active' : ''}" data-index="${i}">${t('level')}${i+1}</button>`).join('')}</div>` : '';
      const skillCard = exSkills[exSkills.length - 1] ? renderSkillCard(exSkills[exSkills.length - 1]) : '';
      html += `<div class="skill-group" data-group="extra">`;
      html += `<div class="banner-title">${levelTabs}</div>`;
      html += `<div class="content-block">${skillCard || `<div class="no-data">${t('none')}</div>`}</div>`;
      html += `</div>`;
    }
  }

  // 能力区块
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
  if (abilities.length === 0 && supportIds.length === 0) {
    html += `<div class="no-data">${t('none')}</div>`;
  }

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

function renderAbilityCard(a) {
  let desc = a.description || '';
  if (a.effects) a.effects.forEach((eff, i) => desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100));
  return `<div>${desc}</div>`;
}

// ========== 事件绑定 ==========
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
    const contentBlock = group.querySelector('.content-block');
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
        if (levelsArr && levelsArr[idx] && contentBlock) {
          contentBlock.innerHTML = renderSkillCard(levelsArr[idx]) || `<div class="no-data">${t('none')}</div>`;
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

// 搜索过滤
function filterCards() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.card').forEach(c => c.style.display = c.querySelector('.card-title')?.textContent.toLowerCase().includes(q) ? '' : 'none');
}

// 筛选面板事件
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

// 语言切换
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

// 初始化
(async () => {
  updateUILanguage();
  await loadIndex();
  document.getElementById('sortSelect').value = 'sort_id';
  renderAllCards();
})();