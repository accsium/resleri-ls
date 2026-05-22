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

  if (view === 'chara_dex') {
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

function handleSearch() { if (currentView === 'chara_dex') filterCards(); }

// ... 其余函数保持不变，与之前提供的 app.js 完全一致 ...
function handleSearch() { if (currentView === 'chara_dex') filterCards(); }

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
  if (currentView === 'chara_dex') searchInput.placeholder = t('searchPlaceholder');
  else searchInput.placeholder = currentLang === 'cn' ? '搜索收藏...' : 'コレクション検索...';
  buildSortSelect(); updateOrderButton(); buildFilterPanel();
  if (currentView === 'chara_dex') renderAllCards();
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
document.getElementById('nav-guide').onclick = () => switchView('chara_dex');
document.getElementById('nav-collection').onclick = () => switchView('collection');

(async () => {
  updateUILanguage();
  await loadIndex();
  renderAllCards();
  loadBuildTime();
})();