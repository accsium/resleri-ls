// ========== 创建卡片 ==========
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

// ========== 详情展开 ==========
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

  // 支援能力部分（含不可达星级样式）
  if (supportIds.length > 0) {
    const maxRarity = activeChar.max_rarity || 8;
    const defaultIdx = Math.min(maxRarity - 1, supportIds.length - 1);
    const rarityMap = [1, 2, 3, 4, 5, 6, 7, 8];
    const initialRarity = activeChar.initial_rarity || 1;

    const rarityTabs = `<div class="support-rarity-tabs">${supportIds.map((sid, idx) => {
      if (sid == null) return '';
      const rarity = rarityMap[idx];
      const isUnreachable = rarity < initialRarity || rarity > maxRarity;
      return `<button class="level-tab support-rarity-btn ${idx === defaultIdx ? 'active' : ''} ${isUnreachable ? 'support-unreachable' : ''}" 
              data-support-idx="${idx}">${t('rarityLabel')[idx]}</button>`;
    }).join('')}</div>`;

    const currentIdx = defaultIdx;
    const currentRarity = rarityMap[currentIdx];
    const currentUnreachable = currentRarity < initialRarity || currentRarity > maxRarity;
    const supportAbility = abilityMap[supportIds[currentIdx]];

    html += `<div class="banner-title"><span>${t('supportAbilityTitle')}</span>${rarityTabs}</div>
    <div class="content-block support-ability-content${currentUnreachable ? ' support-unreachable' : ''}">
      ${supportAbility ? renderAbilityCard(supportAbility) : `<div class="no-data">${t('none')}</div>`}
      ${currentUnreachable ? `<div class="support-note">该角色目前无法到达此星级。</div>` : ''}
    </div>`;
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

// ========== 内部按钮绑定（修复版） ==========
function bindInnerButtons(id, activeChar, originalChar, state) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if (!card) return;

  // 技能等级切换
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

  // 支援能力星级切换（已更新，包含不可达星级的注释）
  card.querySelectorAll('.support-rarity-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.supportIdx);
      const supportIds = activeChar.support_ability_ids || [];
      const ability = (activeChar._skillDetails || {})[supportIds[idx]];
      const content = card.querySelector('.support-ability-content');
      if (!content) return;

      const rarityMap = [1, 2, 3, 4, 5, 6, 7, 8];
      const currentRarity = rarityMap[idx];
      const initialRarity = activeChar.initial_rarity || 1;
      const maxRarity = activeChar.max_rarity || 8;
      const isUnreachable = currentRarity < initialRarity || currentRarity > maxRarity;

      content.innerHTML = (ability ? renderAbilityCard(ability) : `<div class="no-data">${t('none')}</div>`) +
        (isUnreachable ? `<div class="support-note">该角色目前无法到达此星级。</div>` : '');

      card.querySelectorAll('.support-rarity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
}

function filterCards() {
  if (currentView !== 'chara_dex') return;
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#guideContainer .card').forEach(c => {
    const name = c.querySelector('.p1-title')?.textContent?.toLowerCase() || '';
    c.style.display = name.includes(q) ? '' : 'none';
  });
}