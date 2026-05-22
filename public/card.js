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
  const avatarHTML = renderAvatarComponent(indexEntry, 100);

  const maxStarCountMap = {1:1,2:2,3:3,5:4,7:5,8:6};
  const maxStarCount = maxStarCountMap[indexEntry.max_rarity] || 0;
  const maxStarScale = 0.5;
  const maxStarVisibleW = Math.round((67 - 20) * maxStarScale);
  const maxStarTotalW = maxStarCount * maxStarVisibleW;
  const maxStarRow = maxStarCount > 0 ? `<div class="max-rarity-row"><span class="max-rarity-label">${t('maxRarityLabel')}</span><span style="display:inline-block;position:relative;width:${maxStarTotalW}px;height:${Math.round(64 * maxStarScale)}px;overflow:visible;">${renderStarGroup(indexEntry.max_rarity, maxStarScale)}</span></div>` : '';

  const attrsText = getField(indexEntry, 'attack_attribute_names').join(' / ') + ' | ' + role;

  card.innerHTML = `<div class="card-header">
    <div class="card-p1">
      <div class="p1-left"><span class="p1-attrs">${attrsText}</span><span class="p1-title">${baseName}${alias?`<span class="alias">${alias}</span>`:''}</span></div>
      <div class="switch-buttons"></div>
    </div>
    <div class="card-p2">
      <div class="p2-col p2-col1">
        <div class="avatar-col">${avatarHTML}</div>
        <div class="inline-traits">${traits.map(t => `<span class="trait-tag">${t}</span>`).join('')}</div>
      </div>
      <div class="p2-col p2-col2">
        <div class="char-id">ID:${indexEntry.id}</div>
        ${maxStarRow}
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

  loadCharacter(indexEntry.id).then(char => { if (char) updateSwitchButtonsState(card, getCardState(indexEntry.id), char); });
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