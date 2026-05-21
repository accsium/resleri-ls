// 生成调和模块 HTML（使用 synthesis）
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

// 生成单个滑块开关 HTML
function createToggleSwitch(type, checked, label) {
  return `
    <label class="toggle-switch" data-type="${type}" title="${label}">
      <input type="checkbox" ${checked ? 'checked' : ''}>
      <span class="slider"></span>
    </label>
  `;
}

// 创建卡片
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

  // 基础属性
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

  // 绑定展开/收起按钮事件
  const expandBtn = card.querySelector('.expand-btn');
  expandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const detailDiv = card.querySelector('.card-detail');
    const willBeOpen = !detailDiv.classList.contains('open');
    toggleCardDetail(indexEntry.id);
    expandBtn.innerHTML = willBeOpen ? '▲' : '▼';
    expandBtn.setAttribute('aria-label', willBeOpen ? '收起' : '展开');
  });

  // 加载角色详情以填充调和模块和切换按钮
  loadCharacter(indexEntry.id).then(char => {
    if (char) {
      const synthSection = card.querySelector('.synthesis-section');
      if (synthSection) {
        synthSection.innerHTML = renderSynthesisModule(char);
      }
      updateSwitchButtonsState(card, getCardState(indexEntry.id), char);
    }
  });

  // 异步加载真实头像
  initAvatar(indexEntry.id);

  return card;
}

// 更新开关状态
function updateSwitchButtonsState(card, state, char) {
  const buttonsDiv = card.querySelector('.switch-buttons');
  if (!buttonsDiv || !char) return;

  const hasEvo = (char._skills || []).some(s => s.post_evolution.length > 0);
  const hasRange = Object.keys(char._rangeSkills || {}).length > 0;
  const hasTransform = char._transform != null;

  let html = '';

  if (hasEvo) {
    html += createToggleSwitch('evo', state.evo === 'post', '切换进化状态');
  }
  if (hasRange) {
    html += createToggleSwitch('range', state.range === 'inrange', '切换范围状态');
  }
  if (hasTransform) {
    html += createToggleSwitch('transform', state.showTransform, '切换变身状态');
  }

  buttonsDiv.innerHTML = html;

  // 绑定开关事件
  buttonsDiv.querySelectorAll('.toggle-switch input').forEach(input => {
    input.addEventListener('change', (e) => {
      const type = e.target.closest('.toggle-switch').dataset.type;
      const id = parseInt(card.dataset.id);
      const currentState = getCardState(id);
      switch(type) {
        case 'evo':
          setCardState(id, { evo: currentState.evo === 'post' ? 'pre' : 'post' });
          break;
        case 'range':
          setCardState(id, { range: currentState.range === 'inrange' ? 'normal' : 'inrange' });
          break;
        case 'transform':
          setCardState(id, { showTransform: !currentState.showTransform });
          break;
      }
      // 如果卡片已展开，刷新详情
      const detailDiv = card.querySelector('.card-detail.open');
      if (detailDiv) {
        const char = loadedCharacters[id];
        if (char) renderDetailContent(id, char, getCardState(id));
      }
    });
  });
}

// 卡片状态管理
function getCardState(id) {
  if (!cardStates[id]) cardStates[id] = { evo: 'post', range: 'inrange', showTransform: false };
  return cardStates[id];
}

function setCardState(id, newState) {
  cardStates[id] = { ...cardStates[id], ...newState };
}