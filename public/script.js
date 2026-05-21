// ========== 全局数据 ==========
let characterIndex = [];
let loadedCharacters = {};

// 当前激活的排序字段列表（按优先级排列）
let activeSortFields = [...AVAILABLE_SORT_FIELDS].sort((a, b) => a.priority - b.priority);
// 全局排序方向
let currentSortOrder = 'desc';
let activeFilters = { attack_attributes: [], role: [] };

// ========== 数据加载 ==========
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

// ========== 排序与筛选 ==========
function compareCharacters(a, b) {
  for (const sf of activeSortFields) {
    const order = currentSortOrder === 'desc' ? -1 : 1;
    let valA = a[sf.field], valB = b[sf.field];
    if (Array.isArray(valA)) valA = valA[0];
    if (Array.isArray(valB)) valB = valB[0];
    if (valA == null && valB == null) continue;
    if (valA == null) return 1 * order;
    if (valB == null) return -1 * order;
    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.localeCompare(valB);
      if (cmp !== 0) return cmp * order;
    } else if (valA < valB) return -1 * order;
    else if (valA > valB) return 1 * order;
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

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '__default__';
  defaultOpt.textContent = currentLang === 'cn' ? '默认排序' : 'デフォルト';
  if (activeSortFields[0]?.field === 'start_at' && activeSortFields[1]?.field === 'id') {
    defaultOpt.selected = true;
  }
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
  // 为每个卡片绑定切换按钮事件（使用事件委托）
  bindGlobalSwitchButtons();
  filterCards();
}

// 全局切换按钮绑定（事件委托）
function bindGlobalSwitchButtons() {
  document.getElementById('cardContainer').addEventListener('click', async (e) => {
    const btn = e.target.closest('.switch-buttons button');
    if (!btn) return;
    e.stopPropagation();
    const card = btn.closest('.card');
    const id = parseInt(card.dataset.id);
    const state = getCardState(id);
    // 判断按钮类型
    if (btn.classList.contains('evo-btn')) {
      const newEvo = state.evo === 'post' ? 'pre' : 'post';
      setCardState(id, { evo: newEvo });
      // 如果卡片已展开，刷新详情
      const detailDiv = card.querySelector('.card-detail.open');
      if (detailDiv) {
        const char = loadedCharacters[id];
        if (char) renderDetailContent(id, char, getCardState(id));
      }
      // 更新按钮状态
      updateSwitchButtonsState(card, getCardState(id), loadedCharacters[id]);
    } else if (btn.classList.contains('range-btn')) {
      const newRange = state.range === 'inrange' ? 'normal' : 'inrange';
      setCardState(id, { range: newRange });
      const detailDiv = card.querySelector('.card-detail.open');
      if (detailDiv) {
        const char = loadedCharacters[id];
        if (char) renderDetailContent(id, char, getCardState(id));
      }
      updateSwitchButtonsState(card, getCardState(id), loadedCharacters[id]);
    } else if (btn.classList.contains('transform-btn')) {
      setCardState(id, { showTransform: !state.showTransform });
      const detailDiv = card.querySelector('.card-detail.open');
      if (detailDiv) {
        const char = loadedCharacters[id];
        if (char) renderDetailContent(id, char, getCardState(id));
      }
      updateSwitchButtonsState(card, getCardState(id), loadedCharacters[id]);
    }
  });
}

// 更新卡片上的切换按钮状态（高亮）
function updateSwitchButtonsState(card, state, char) {
  const buttonsDiv = card.querySelector('.switch-buttons');
  if (!buttonsDiv || !char) return;
  const hasEvo = (char._skills || []).some(s => s.post_evolution.length > 0);
  const hasRange = Object.keys(char._rangeSkills || {}).length > 0;
  const hasTransform = char._transform != null;

  buttonsDiv.innerHTML = '';
  if (hasEvo) {
    const btn = document.createElement('button');
    btn.textContent = t('switchText');
    btn.className = 'evo-btn' + (state.evo === 'post' ? ' active' : '');
    buttonsDiv.appendChild(btn);
  }
  if (hasRange) {
    const btn = document.createElement('button');
    btn.textContent = t('switchText');
    btn.className = 'range-btn' + (state.range === 'inrange' ? ' active' : '');
    buttonsDiv.appendChild(btn);
  }
  if (hasTransform) {
    const btn = document.createElement('button');
    btn.textContent = t('switchText');
    btn.className = 'transform-btn' + (state.showTransform ? ' active' : '');
    buttonsDiv.appendChild(btn);
  }
}

// 卡片详情展开/折叠（保持不变）
async function toggleCardDetail(id) { /* ... 同之前版本 ... */ }
function renderDetailContent(id, char, state) { /* ... 同之前版本 ... */ }
function generateDetailHTML(activeChar, state) { /* ... 同之前版本 ... */ }
function renderSkillCard(skill) { /* ... 同之前版本 ... */ }
function renderAbilityCard(a) { /* ... 同之前版本 ... */ }

// 初始化所有卡片的切换按钮（在加载角色数据后）
async function initAllSwitchButtons() {
  const cards = document.querySelectorAll('.card');
  for (const card of cards) {
    const id = parseInt(card.dataset.id);
    if (!loadedCharacters[id]) {
      try { await loadCharacter(id); } catch(e) {}
    }
    const char = loadedCharacters[id];
    if (char) {
      updateSwitchButtonsState(card, getCardState(id), char);
    }
  }
}

// 首次加载后初始化切换按钮
(async () => {
  updateUILanguage();
  await loadIndex();
  renderAllCards();
  // 预加载角色数据以显示切换按钮
  await initAllSwitchButtons();
})();