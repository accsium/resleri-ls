// 生成调和模块 HTML（使用 synthesis）
function renderSynthesisModule(char) {
  const traitName = getField(char, 'trait_color_name') || '?';
  const supportName = getField(char, 'support_color_name') || '?';
  const battleTraits = getField(char, 'battle_tool_trait_names') || [];
  const equipTraits = getField(char, 'equipment_tool_trait_names') || [];

  // 合并所有特性词条，每个单独一行
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

// 创建卡片（新布局）
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

  // 基础属性顺序：初始WT, HP, 速度, 物攻, 物防, 魔攻, 魔防
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
      <div class="card-upper">
        <div class="avatar-section">
          <div class="avatar-col">${avatarHTML}</div>
          <div class="initial-rarity">${minStars}</div>
          <div class="attrs">${getField(indexEntry, 'attack_attribute_names').join(' / ')} | ${role}</div>
        </div>
        <div class="info-section">
          <div class="card-title">
            ${name}${alias ? `<span class="alias">${alias}</span>` : ''}
            <span class="char-id">ID:${indexEntry.id}</span>
          </div>
          <div class="release-date">${t('joinDate')}: ${releaseDate}</div>
          <div class="max-rarity" style="color: ${maxRarity === 8 ? '#ff69b4' : '#b8860b'}">${maxStars}</div>
          <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
        <div class="synthesis-section">
          <div class="synthesis-placeholder"></div>
        </div>
      </div>
      <div class="switch-buttons"></div>
      <div class="card-lower">
        <div class="stats-row">${statCards}</div>
      </div>
    </div>
    <div class="card-detail"></div>
  `;

  // 加载角色详情以填充调和模块和切换按钮
  loadCharacter(indexEntry.id).then(char => {
    if (char) {
      const synthesisSection = card.querySelector('.synthesis-section');
      if (synthesisSection) {
        synthesisSection.innerHTML = renderSynthesisModule(char);
      }
      updateSwitchButtonsState(card, getCardState(indexEntry.id), char);
    }
  });

  // 异步加载真实头像
  initAvatar(indexEntry.id);

  card.querySelector('.card-header').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    toggleCardDetail(indexEntry.id);
  });

  return card;
}

// 卡片状态管理
function getCardState(id) {
  if (!cardStates[id]) cardStates[id] = { evo: 'post', range: 'inrange', showTransform: false };
  return cardStates[id];
}

function setCardState(id, newState) {
  cardStates[id] = { ...cardStates[id], ...newState };
}