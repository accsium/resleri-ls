let currentView = 'guide';
let characterIndex = [], loadedCharacters = {};
let activeSortFields = [...SORT_FIELDS].sort((a,b) => a.priority - b.priority);
let currentSortOrder = 'desc';
let activeFilters = { attack_attributes: [], role: [] };

// 视图切换
function switchView(view) {
  currentView = view;
  const guideContainer = document.getElementById('guideContainer');
  const collectionContainer = document.getElementById('collectionContainer');
  const guideControls = document.getElementById('guideControls');
  const filterPanel = document.getElementById('filterPanel');
  const navGuide = document.getElementById('nav-guide');
  const navCollection = document.getElementById('nav-collection');
  const searchInput = document.getElementById('searchInput');

  if (view === 'guide') {
    guideContainer.style.display = '';
    collectionContainer.style.display = 'none';
    if (guideControls) guideControls.style.display = '';
    if (filterPanel) filterPanel.style.display = 'none';
    navGuide.classList.add('active');
    navCollection.classList.remove('active');
    searchInput.placeholder = t('searchPlaceholder');
    renderAllCards();
  } else {
    guideContainer.style.display = 'none';
    collectionContainer.style.display = '';
    if (guideControls) guideControls.style.display = 'none';
    if (filterPanel) filterPanel.style.display = 'none';
    navGuide.classList.remove('active');
    navCollection.classList.add('active');
    searchInput.placeholder = currentLang === 'cn' ? '搜索收藏...' : 'コレクション検索...';
  }
}

function handleSearch() { if (currentView === 'guide') filterCards(); }

// 数据加载
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
    if (Array.isArray(va)) va = va[0]; if (Array.isArray(vb)) vb = vb[0];
    if (va == null && vb == null) continue;
    if (va == null) return 1 * order; if (vb == null) return -1 * order;
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

// UI 更新
function updateUILanguage() {
  document.title = t('pageTitle');
  document.getElementById('pageTitle').textContent = t('pageTitle');
  document.getElementById('nav-guide').textContent = t('navGuide');
  document.getElementById('nav-collection').textContent = t('navCollection');
  const searchInput = document.getElementById('searchInput');
  if (currentView === 'guide') searchInput.placeholder = t('searchPlaceholder');
  else searchInput.placeholder = currentLang === 'cn' ? '搜索收藏...' : 'コレクション検索...';
  buildSortSelect(); updateOrderButton(); buildFilterPanel();
  if (currentView === 'guide') renderAllCards();
}

function buildSortSelect() {
  const sel = document.getElementById('sortSelect');
  if (!sel) return;
  sel.innerHTML = '';
  SORT_FIELDS.forEach(sf => {
    const opt = document.createElement('option');
    opt.value = sf.field; opt.textContent = currentLang === 'cn' ? sf.label_cn : sf.label_ja;
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
  const container = document.getElementById('guideContainer');
  container.innerHTML = '';
  const cards = getFilteredAndSortedCharacters().map(c => createCard(c));
  cards.forEach(c => { container.appendChild(c); initAvatar(c, parseInt(c.dataset.id)); });
  filterCards();
}

// 详情展开
async function toggleCardDetail(id) {
  const detailDiv = document.querySelector(`.card[data-id="${id}"] .card-detail`);
  if (!detailDiv) return;
  if (detailDiv.classList.contains('open')) {
    detailDiv.classList.remove('open');
    const card = detailDiv.closest('.card');
    card.classList.remove('card-sticky');
    if (card._stickyHandler) { window.removeEventListener('scroll', card._stickyHandler); delete card._stickyHandler; }
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
  } catch (e) { detailDiv.innerHTML = `<div class="no-data">${t('loadFailed')}: ${e.message || e}</div>`; }
}

function initStickyCard(card) {
  if (card._stickyHandler) window.removeEventListener('scroll', card._stickyHandler);
  const header = card.querySelector('.card-header'), detailDiv = card.querySelector('.card-detail');
  const handler = () => {
    if (!card.classList.contains('card-sticky')) return;
    const headerRect = header.getBoundingClientRect();
    if (headerRect.top <= 0) {
      detailDiv.style.maxHeight = `${window.innerHeight - header.offsetHeight}px`;
      detailDiv.style.overflowY = 'auto';
      header.style.position = 'sticky'; header.style.top = '0'; header.style.zIndex = '5'; header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    } else {
      detailDiv.style.maxHeight = ''; detailDiv.style.overflowY = ''; header.style.position = ''; header.style.top = ''; header.style.zIndex = ''; header.style.boxShadow = '';
    }
    if (detailDiv.scrollTop + detailDiv.clientHeight >= detailDiv.scrollHeight - 1) {
      card.classList.remove('card-sticky');
      detailDiv.style.maxHeight = ''; detailDiv.style.overflowY = ''; header.style.position = ''; header.style.top = ''; header.style.zIndex = ''; header.style.boxShadow = '';
      window.removeEventListener('scroll', handler); delete card._stickyHandler;
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
  } catch (e) { detailDiv.innerHTML = `<div class="no-data">渲染失败：${e.message || e}</div>`; }
}

function generateDetailHTML(activeChar, state, id, originalChar) {
  let html = '';
  const allSkillTypes = [];
  if (activeChar.leader_skill) allSkillTypes.push({ type: 'leader', name: t('leaderSkillSection'), levels: [activeChar.leader_skill] });
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
      } else { levels = state.evo === 'post' ? group.post_evolution : group.pre_evolution; }
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
      const skillName = currentSkill.name || '??', skillId = currentSkill.id || '';
      const levelTabs = (skillType.type !== 'leader' && levels.length > 1) ? `<div class="level-tabs">${levels.map((s, i) => `<button class="level-tab ${i === levels.length - 1 ? 'active' : ''}" data-index="${i}">${t('level')}${i+1}</button>`).join('')}</div>` : '';
      html += `<div class="skill-group" data-group="${skillType.type}"><div class="banner-title"><span>${skillName} <small>(ID:${skillId})</small></span>${levelTabs}</div>`;
      if (skillType.type === 'leader') html += `<div class="content-block"><div class="skill-desc">${currentSkill.description || ''}</div></div>`;
      else html += `<div class="content-block">${currentSkill ? renderSkillCard(currentSkill) : `<div class="no-data">${t('none')}</div>`}</div>`;
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
  abilities.forEach(a => { html += `<div class="banner-title">${a.name || `ID:${a.id}`}</div><div class="content-block">${renderAbilityCard(a)}</div>`; });
  if (abilities.length === 0 && supportIds.length === 0) html += `<div class="no-data">${t('none')}</div>`;
  if (supportIds.length > 0) {
    const maxRarity = activeChar.max_rarity || 8, defaultIdx = Math.min(maxRarity - 1, supportIds.length - 1);
    const supportAbility = abilityMap[supportIds[defaultIdx]];
    const rarityTabs = `<div class="support-rarity-tabs">${supportIds.map((sid, idx) => sid == null ? '' : `<button class="level-tab support-rarity-btn ${idx === defaultIdx ? 'active' : ''}" data-support-idx="${idx}">${t('rarityLabel')[idx]}</button>`).join('')}</div>`;
    html += `<div class="banner-title"><span>${t('supportAbilityTitle')}</span>${rarityTabs}</div><div class="content-block">${supportAbility ? renderAbilityCard(supportAbility) : `<div class="no-data">${t('none')}</div>`}</div>`;
  }
  if (originalChar) html += `<div id="synthesis-bottom">${renderSynthesisModule(originalChar)}</div>`;
  return html;
}

function renderSkillCard(skill) {
  const target = getField(skill, 'target_name') || skill.skill_target_type || '?';
  const attr = (skill.attack_attributes || []).map(a => ({1:'斬',2:'打',3:'突',5:'火',6:'氷',7:'雷',8:'風'}[a] || a)).join('/');
  let desc = skill.description || '';
  if (skill.effects) skill.effects.forEach((eff, i) => desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100));
  const wt = 200 + (skill.wait ?? 0);
  return `<div class="skill-desc">${desc}</div><div class="skill-stats"><span class="skill-stat">${t('target')}: ${target}</span>${attr ? `<span class="skill-stat">${t('attribute')}: ${attr}</span>` : ''}<span class="skill-stat">${t('power')}: ${skill.power ?? 0}%</span><span class="skill-stat">${t('break')}: ${skill.break_power ?? 0}%</span><span class="skill-stat">${t('wt')}: ${wt}</span><span class="skill-stat">${t('limit')}: ${skill.limit_count ?? '—'}</span></div>`;
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
  if (currentView !== 'guide') return;
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#guideContainer .card').forEach(c => {
    const name = c.querySelector('.p1-title')?.textContent?.toLowerCase() || '';
    c.style.display = name.includes(q) ? '' : 'none';
  });
}

// 筛选面板事件
document.getElementById('applyFilterBtn').onclick = () => {
  activeFilters.attack_attributes = Array.from(document.querySelectorAll('.attr-check:checked')).map(cb => parseInt(cb.value));
  activeFilters.role = Array.from(document.querySelectorAll('.role-check:checked')).map(cb => parseInt(cb.value));
  renderAllCards(); document.getElementById('filterPanel').style.display = 'none';
};
document.getElementById('clearFilterBtn').onclick = () => {
  document.querySelectorAll('.attr-check, .role-check').forEach(cb => cb.checked = false);
  activeFilters = { attack_attributes: [], role: [] };
  renderAllCards(); document.getElementById('filterPanel').style.display = 'none';
};
document.getElementById('filterToggle').onclick = () => { const p = document.getElementById('filterPanel'); p.style.display = p.style.display === 'none' ? 'flex' : 'none'; };
document.getElementById('orderToggle').onclick = () => { currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc'; updateOrderButton(); renderAllCards(); };

// 语言切换
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
    else if (detailDiv?.classList.contains('open')) { const state = getCardState(openedId); const ch = loadedCharacters[openedId]; if (ch) renderDetailContent(openedId, ch, state); }
  }
}

// 更新时间
async function loadBuildTime() {
  try {
    const resp = await fetch('data/meta.json'); const meta = await resp.json();
    const buildTime = new Date(meta.build_time);
    const gmt8 = new Date(buildTime.getTime() + 8 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${gmt8.getUTCFullYear()}/${pad(gmt8.getUTCMonth() + 1)}/${pad(gmt8.getUTCDate())} ${pad(gmt8.getUTCHours())}:${pad(gmt8.getUTCMinutes())}:${pad(gmt8.getUTCSeconds())} GMT+08:00`;
    const localOffset = -new Date().getTimezoneOffset();
    if (localOffset === 480) document.getElementById('updateTime').textContent = `更新时间 ${timeStr}`;
    else { const localStr = buildTime.toLocaleString(); const sign = localOffset >= 0 ? '+' : '-'; const hours = Math.floor(Math.abs(localOffset) / 60); const minutes = Math.abs(localOffset) % 60; document.getElementById('updateTime').textContent = `更新时间 ${localStr} (GMT${sign}${pad(hours)}:${pad(minutes)})`; }
  } catch (e) { document.getElementById('updateTime').textContent = '更新时间 — (GMT+08:00)'; }
}

document.getElementById('btn-refresh').onclick = () => { if (confirm('确定要清除缓存并刷新数据？')) location.reload(true); };
document.getElementById('nav-guide').onclick = () => switchView('guide');
document.getElementById('nav-collection').onclick = () => switchView('collection');

(async () => {
  updateUILanguage();
  await loadIndex();
  renderAllCards();
  loadBuildTime();
})();