// 卡片创建（头像通过 .avatar-card-size 缩小为 75x75）
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

  const statCards = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">${t('statLabels').hp}</div><div class="stat-value">${status.hp ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').speed}</div><div class="stat-value">${status.speed ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').attack}</div><div class="stat-value">${status.attack ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').defense}</div><div class="stat-value">${status.defense ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').magic}</div><div class="stat-value">${status.magic ?? '?'}</div></div>
      <div class="stat-card"><div class="stat-label">${t('statLabels').mental}</div><div class="stat-value">${status.mental ?? '?'}</div></div>
    </div>`;

  const avatarHTML = renderAvatar(indexEntry.id, traitColorName, supportColorName, 75);

  card.innerHTML = `
    <div class="card-header">
      <div class="avatar-col">
        <div class="avatar-card-size">${avatarHTML}</div>
      </div>
      <div class="card-left">
        <div class="card-title">
          ${name}${alias ? `<span class="alias">${alias}</span>` : ''}
          <span class="initial-wt">${t('initialWTLabel')}: ${initialWT}</span>
        </div>
        <div class="rarity">${stars} (${indexEntry.initial_rarity}→${indexEntry.max_rarity})</div>
        <div class="attrs">${attrs} | ${role}</div>
        <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="release-date">${t('joinDate')}: ${releaseDate}</div>
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

// 获取卡片状态
function getCardState(id) {
  if (!cardStates[id]) cardStates[id] = { evo: 'post', range: 'inrange', showTransform: false };
  return cardStates[id];
}

// 设置卡片状态
function setCardState(id, newState) {
  cardStates[id] = { ...cardStates[id], ...newState };
}