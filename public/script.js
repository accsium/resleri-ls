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
let loadedCharacters = {}; // 缓存已加载的角色数据

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

function rarityToStars(r) {
  const map = {1:'★',2:'★★',3:'★★★',4:'★★★☆',5:'★★★★',6:'★★★★☆',7:'★★★★★',8:'★★★★★★'};
  return map[r] || '★'.repeat(r);
}

function updateUILanguage() {
  document.title = t('pageTitle');
  document.getElementById('pageTitle').textContent = t('pageTitle');
  document.getElementById('searchInput').placeholder = t('searchPlaceholder');
  // 已渲染的卡片需要更新语言相关文字，简单起见直接重新渲染
  renderAllCards();
}

function renderAllCards() {
  const container = document.getElementById('cardContainer');
  container.innerHTML = '';
  characterIndex.forEach(c => {
    container.appendChild(createCard(c));
  });
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
  const tags = (getField(indexEntry, 'tag_names') || []).slice(0, 3); // 只显示前三个标签

  card.innerHTML = `
    <div class="card-header" data-id="${indexEntry.id}">
      <div>
        <div class="card-title">
          ${name}
          ${alias ? `<span class="alias">${alias}</span>` : ''}
        </div>
        <div class="rarity">${stars} (${indexEntry.initial_rarity}→${indexEntry.max_rarity})</div>
        <div class="attrs">${attrs} | ${role}</div>
        <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <div class="switch-buttons"></div>
    </div>
    <div class="card-detail" data-id="${indexEntry.id}"></div>
  `;

  // 点击标题区域展开/折叠
  const header = card.querySelector('.card-header');
  header.addEventListener('click', () => toggleCardDetail(indexEntry.id));

  return card;
}

async function toggleCardDetail(id) {
  const detailDiv = document.querySelector(`.card-detail[data-id="${id}"]`);
  if (!detailDiv) return;

  // 如果已展开，则折叠
  if (detailDiv.classList.contains('open')) {
    detailDiv.classList.remove('open');
    return;
  }

  // 加载并渲染详情
  detailDiv.innerHTML = `<div class="loading">${t('loading')}</div>`;
  detailDiv.classList.add('open');

  try {
    const char = await loadCharacter(id);
    detailDiv.innerHTML = renderDetailHTML(char);
    // 绑定切换按钮事件
    bindSwitchButtons(id, char);
  } catch (e) {
    detailDiv.innerHTML = `<div class="no-data">${t('loadFailed')}</div>`;
  }
}

function renderDetailHTML(char) {
  const tagNames = getField(char, 'tag_names');
  const attrNames = getField(char, 'attack_attribute_names').join(' / ');
  const roleName = getField(char, 'role_name');
  const baseCharName = getField(char, 'base_character_name');
  const seriesName = getField(char, 'original_title_name');
  const traitColorName = getField(char, 'trait_color_name');
  const supportColorName = getField(char, 'support_color_name');
  const startDate = char.start_at ? new Date(char.start_at).toLocaleDateString('ja-JP') : '不明';
  const isAlchemist = char.is_alchemist ? t('yes') : t('no');

  // 技能渲染
  let skillsHTML = '';
  const typeText = t('skillType');
  (char._skills || []).forEach(group => {
    // 默认显示进化后最高等级
    const levels = group.post_evolution.length > 0 ? group.post_evolution : group.pre_evolution;
    if (levels.length === 0) return;
    skillsHTML += `
      <div class="skill-group">
        <div class="skill-group-header">
          <span class="skill-group-title">${typeText[group.type] || group.type}</span>
        </div>
        <div class="skill-levels" data-group="${group.type}">
          ${renderSkillLevels(levels, 0)}
        </div>
      </div>`;
  });

  // EX 技能
  if (char._exSkills && char._exSkills.length > 0) {
    skillsHTML += `
      <div class="skill-group">
        <div class="skill-group-header">
          <span class="skill-group-title">${t('skillType').extra}</span>
        </div>
        <div class="skill-levels" data-group="extra">
          ${renderSkillLevels(char._exSkills, 0)}
        </div>
      </div>`;
  }

  // 能力
  let abilitiesHTML = renderAbilitiesHTML(char, 'post'); // 默认进化后

  // 调和颜色
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
      ${renderStat(t('statLabels').hp, char.initial_status?.hp)}
      ${renderStat(t('statLabels').attack, char.initial_status?.attack)}
      ${renderStat(t('statLabels').magic, char.initial_status?.magic)}
      ${renderStat(t('statLabels').defense, char.initial_status?.defense)}
      ${renderStat(t('statLabels').mental, char.initial_status?.mental)}
      ${renderStat(t('statLabels').speed, char.initial_status?.speed)}
    </div>
    <div>${t('attribute')}: ${attrNames} | ${t('role')}: ${roleName} | ${t('alchemist')}: ${isAlchemist}</div>
    ${colorSwatch}
    <div class="section-title">${t('skillSection')}</div>
    ${skillsHTML}
    <div id="abilities-${char.id}">${abilitiesHTML}</div>
    ${char.leader_skill ? `
      <div class="section-title">${t('leaderSkillSection')}</div>
      <div class="skill-detail-card" style="border-left-color:#eab308;">
        <div class="skill-name">${char.leader_skill.name || t('leaderSkillSection')}</div>
        <div class="skill-desc">${char.leader_skill.description || ''}</div>
      </div>` : ''}
  `;
}

function renderSkillLevels(levels, activeIndex) {
  let html = '';
  if (levels.length > 1) {
    html += `<div class="level-tabs">`;
    levels.forEach((skill, idx) => {
      html += `<button class="level-tab ${idx === activeIndex ? 'active' : ''}" data-index="${idx}">${t('level')} ${idx+1}</button>`;
    });
    html += `</div>`;
  }
  if (levels[activeIndex]) {
    html += renderSkillCard(levels[activeIndex]);
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
    const ability = abilityMap[supportIds[defaultIdx]];
    html += `<div class="level-tabs">`;
    const labels = t('rarityLabel');
    supportIds.forEach((sid, idx) => {
      if (sid == null) return;
      html += `<button class="level-tab ${idx === defaultIdx ? 'active' : ''}" data-support-idx="${idx}">${labels[idx]}</button>`;
    });
    html += `</div>`;
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

// 切换按钮绑定与事件
function bindSwitchButtons(id, char) {
  const card = document.querySelector(`.card[data-id="${id}"]`);
  const buttonsDiv = card.querySelector('.switch-buttons');
  buttonsDiv.innerHTML = '';

  // 进化切换
  const hasEvolution = (char._skills || []).some(s => s.post_evolution.length > 0);
  const hasRange = Object.keys(char._rangeSkills || {}).length > 0;
  const hasTransform = char._transform != null;

  if (hasEvolution) {
    const btn = document.createElement('button');
    btn.textContent = t('switchText');
    btn.className = 'active';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const detail = card.querySelector('.card-detail');
      if (detail.classList.contains('open')) {
        // 切换状态并重新渲染详情
        toggleEvolution(id);
      }
    });
    buttonsDiv.appendChild(btn);
  }
  // range 切换、变身切换可类似添加，此处略
}

function toggleEvolution(id) {
  // 此函数为实现简单，可存储当前状态并重新渲染详情
  // 完整实现可参考之前的 panel.dataset.evo 逻辑，这里简化，直接刷新详情
  const detail = document.querySelector(`.card-detail[data-id="${id}"]`);
  if (detail) {
    detail.classList.remove('open');
    toggleCardDetail(id); // 重新打开
  }
}

function filterCards() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const name = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
    card.style.display = name.includes(query) ? '' : 'none';
  });
}

// 语言切换
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
  renderAllCards();
})();