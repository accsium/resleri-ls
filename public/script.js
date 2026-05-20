// ========== 多语言文本定义 ==========
const UI_TEXT = {
  ja: {
    pageTitle: 'レスレリ 角色图鉴',
    searchPlaceholder: '名前で検索...',
    selectHint: '← 左のキャラクターを選択してください',
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
    evolutionSwitch: '切替',
    level: 'Lv',
    skillType: {
      normal1: '通常攻撃1', normal2: '通常攻撃2', burst: 'バーストスキル',
      active1: 'アクティブ1', active2: 'アクティブ2', active3: 'アクティブ3',
    },
    statLabels: { hp: 'HP', attack: '物攻', magic: '魔攻', defense: '物防', mental: '魔防', speed: '速度' },
    abilityTitle: '能力',
    supportAbilityTitle: '亜空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
  },
  cn: {
    pageTitle: '雷斯雷利 角色图鉴',
    searchPlaceholder: '搜索角色名称...',
    selectHint: '← 选择左侧角色查看详情',
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
    evolutionSwitch: '切换',
    level: '等级',
    skillType: {
      normal1: '通常攻击1', normal2: '通常攻击2', burst: '爆发技能',
      active1: '主动1', active2: '主动2', active3: '主动3',
    },
    statLabels: { hp: 'HP', attack: '物攻', magic: '魔攻', defense: '物防', mental: '魔防', speed: '速度' },
    abilityTitle: '能力',
    supportAbilityTitle: '亚空支援能力',
    rarityLabel: ['1星','2星','3星','3.5星','4星','4.5星','5星','6星'],
  }
};

// ========== 全局状态 ==========
let currentLang = 'cn';   // 默认中文
function t(key) { return UI_TEXT[currentLang][key] || key; }

let characterIndex = [];
let currentCharId = null;

function rarityToStars(r) {
  const map = {1:'★',2:'★★',3:'★★★',4:'★★★☆',5:'★★★★',6:'★★★★☆',7:'★★★★★',8:'★★★★★★'};
  return map[r] || '★'.repeat(r);
}

// ========== 数据加载 ==========
async function loadIndex() {
  const folder = currentLang === 'cn' ? 'cn' : 'jp';
  const resp = await fetch(`data/${folder}/character_index.json`);
  characterIndex = await resp.json();
}

async function loadCharacter(id) {
  const folder = currentLang === 'cn' ? 'cn' : 'jp';
  const resp = await fetch(`data/${folder}/${id}.json`);
  return await resp.json();
}

// ========== UI 语言更新 ==========
function updateUILanguage() {
  document.title = t('pageTitle');
  document.getElementById('pageTitle').textContent = t('pageTitle');
  document.getElementById('searchInput').placeholder = t('searchPlaceholder');
  const panel = document.getElementById('detailPanel');
  if (panel.children[0] && panel.children[0].classList.contains('loading')) {
    panel.innerHTML = `<div class="loading">${t('selectHint')}</div>`;
  }
}

// ========== 列表渲染 ==========
function renderList() {
  const listDiv = document.getElementById('characterList');
  const query = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  const filtered = characterIndex.filter(c =>
    c.name?.toLowerCase().includes(query) ||
    (c.another_name||'').toLowerCase().includes(query)
  );
  listDiv.innerHTML = filtered.map(c => {
    const stars = rarityToStars(c.initial_rarity);
    const alias = c.another_name || '';
    const attrs = (c.attack_attribute_names || []).join(' / ');
    const role = c.role_name || '';
    return `<div class="char-item" onclick="selectCharacter(${c.id})" data-id="${c.id}">
      <span class="rarity-stars">${stars}</span>
      <span class="char-name">${c.name}</span>
      <span class="char-alias">${alias}</span>
      <span style="margin-left:auto; font-size:12px; color:#666;">${attrs} ${role}</span>
    </div>`;
  }).join('');
}

// ========== 技能组内容渲染（等级切换） ==========
function renderSkillGroupContent(groupId, levels, activeIndex) {
  const container = document.querySelector(`.skill-content[data-group="${groupId}"]`);
  if (!container || levels.length === 0) return;
  let html = '';
  if (levels.length > 1) {
    html += `<div class="level-tabs">`;
    levels.forEach((skill, idx) => {
      html += `<button class="level-tab ${idx === activeIndex ? 'active' : ''}" data-group="${groupId}" data-index="${idx}">${t('level')} ${idx+1}</button>`;
    });
    html += `</div>`;
  }
  if (levels[activeIndex]) {
    html += renderSkillCard(levels[activeIndex]);
  }
  container.innerHTML = html;

  container.querySelectorAll('.level-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const idx = parseInt(this.dataset.index);
      const grp = this.dataset.group;
      renderSkillGroupContent(grp, levels, idx);
    });
  });
}

// ========== 详情渲染 ==========
function renderDetail(char) {
  const panel = document.getElementById('detailPanel');
  panel.charData = char;

  const tagNames = char.tag_names || [];
  const attrNames = (char.attack_attribute_names || []).join(' / ');
  const roleName = char.role_name || '?';
  const startDate = char.start_at ? new Date(char.start_at).toLocaleDateString('ja-JP') : '不明';
  const isAlchemist = char.is_alchemist ? t('yes') : t('no');

  const hasEvolution = (char._skills || []).some(s => s.post_evolution.length > 0);
  const initialEvo = hasEvolution ? 'post' : 'pre';
  panel.dataset.evo = initialEvo;

  let html = `
    <div class="detail-header">
      <div class="info">
        <h2>
          ${char.name} <span class="alias">${char.another_name || ''}</span>
          ${hasEvolution ? `<button id="evoSwitchBtn" class="evo-switch-btn active">${t('evolutionSwitch')}</button>` : ''}
        </h2>
        <div class="rarity">${t('initial')} ${rarityToStars(char.initial_rarity)} → ${t('max')} ${rarityToStars(char.max_rarity)} (${t('rarity')}: ${char.initial_rarity}→${char.max_rarity})</div>
        <div class="base-char">${t('base')}: ${char.base_character_name || '—'}</div>
        <div class="series">${t('series')}: ${char.original_title_name || '—'} | ${t('releaseDate')}: ${startDate}</div>
        <div style="margin-top:8px;">${tagNames.map(tg => `<span class="tag">${tg}</span>`).join('')}</div>
      </div>
    </div>
    <p style="margin:10px 0;font-style:italic;color:#555;">${char.description || ''}</p>
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
    <div class="section-title">${t('skillSection')}</div>
  `;

  const typeText = t('skillType');
  (char._skills || []).forEach(skillGroup => {
    const groupId = `skill-${skillGroup.type}`;
    html += `<div class="skill-group" id="${groupId}">
      <div class="skill-group-header">
        <span class="skill-group-title">${typeText[skillGroup.type] || skillGroup.type}</span>
      </div>
      <div class="skill-content" data-group="${groupId}"></div>
    </div>`;
  });

  // 能力区域容器（将在 renderAbilities 中填充）
  html += `<div id="abilityContainer"></div>`;

  // 队长技能
  if (char.leader_skill) {
    html += `<div class="section-title">${t('leaderSkillSection')}</div>
    <div class="skill-detail-card" style="border-left-color:#eab308;">
      <div class="skill-name">${char.leader_skill.name || t('leaderSkillSection')}</div>
      <div class="skill-desc">${char.leader_skill.description || ''}</div>
    </div>`;
  }

  panel.innerHTML = html;

  // 初始化所有技能组内容
  (char._skills || []).forEach(skillGroup => {
    const groupId = `skill-${skillGroup.type}`;
    const levels = initialEvo === 'post' ? skillGroup.post_evolution : skillGroup.pre_evolution;
    const activeIndex = levels.length > 0 ? levels.length - 1 : 0;
    renderSkillGroupContent(groupId, levels, activeIndex);
  });

  // 渲染能力区域
  renderAbilities(char, initialEvo);

  // 进化切换按钮事件
  const evoBtn = document.getElementById('evoSwitchBtn');
  if (evoBtn) {
    evoBtn.addEventListener('click', function() {
      const currentEvo = panel.dataset.evo;
      const newEvo = currentEvo === 'post' ? 'pre' : 'post';
      panel.dataset.evo = newEvo;
      this.classList.toggle('active', newEvo === 'post');
      (panel.charData._skills || []).forEach(skillGroup => {
        const groupId = `skill-${skillGroup.type}`;
        const levels = newEvo === 'post' ? skillGroup.post_evolution : skillGroup.pre_evolution;
        const activeIndex = levels.length > 0 ? levels.length - 1 : 0;
        renderSkillGroupContent(groupId, levels, activeIndex);
      });
      // 重新渲染能力区域（过滤进化能力）
      renderAbilities(panel.charData, newEvo);
    });
  }
}

function renderStat(label, value) {
  return `<div class="stat-item"><div class="stat-value">${value ?? '?'}</div><div class="stat-label">${label}</div></div>`;
}

// ========== 能力区域渲染 ==========
function renderAbilities(char, evoState) {
  const container = document.getElementById('abilityContainer');
  if (!container) return;
  const abilityMap = char._skillDetails || {};

  // 进化能力ID集合
  const evolvedIds = new Set(char.all_skill_evolved_ability_ids || []);

  // 普通能力：ability_ids 中排除进化能力ID
  const normalAbilityIds = (char.ability_ids || []).filter(id => !evolvedIds.has(id));
  // 进化后额外显示的能力
  const evoAbilityIds = evoState === 'post' ? (char.all_skill_evolved_ability_ids || []) : [];
  // 合并去重
  const allAbilityIds = [...new Set([...normalAbilityIds, ...evoAbilityIds])];
  const abilities = allAbilityIds.map(id => abilityMap[id]).filter(Boolean);

  // 支援能力
  const supportIds = char.support_ability_ids || [];

  let html = '';

  // 普通能力
  html += `<div class="section-title">${t('abilityTitle')}</div>`;
  if (abilities.length === 0) {
    html += `<div class="no-data">${t('none')}</div>`;
  } else {
    abilities.forEach(a => {
      html += renderAbilityCard(a);
    });
  }

  // 亚空支援能力
  html += `<div class="section-title">${t('supportAbilityTitle')}</div>`;
  if (supportIds.length === 0) {
    html += `<div class="no-data">${t('none')}</div>`;
  } else {
    const maxRarity = char.max_rarity || 8;
    const defaultIndex = Math.min(maxRarity - 1, supportIds.length - 1);
    const supportId = supportIds[defaultIndex];
    const supportAbility = supportId ? abilityMap[supportId] : null;

    const rarityLabels = t('rarityLabel');
    html += `<div class="level-tabs" id="supportRarityTabs">`;
    supportIds.forEach((sid, idx) => {
      if (sid == null) return;
      html += `<button class="level-tab ${idx === defaultIndex ? 'active' : ''}" data-index="${idx}">${rarityLabels[idx]}</button>`;
    });
    html += `</div>`;
    html += `<div id="supportAbilityCard">`;
    if (supportAbility) {
      html += renderAbilityCard(supportAbility);
    } else {
      html += `<div class="no-data">${t('none')}</div>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;

  // 绑定支援能力星级切换事件
  const tabs = document.getElementById('supportRarityTabs');
  if (tabs) {
    tabs.querySelectorAll('.level-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        tabs.querySelectorAll('.level-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        const idx = parseInt(this.dataset.index);
        const supportId = supportIds[idx];
        const ability = supportId ? abilityMap[supportId] : null;
        const cardDiv = document.getElementById('supportAbilityCard');
        if (cardDiv) {
          cardDiv.innerHTML = ability ? renderAbilityCard(ability) : `<div class="no-data">${t('none')}</div>`;
        }
      });
    });
  }
}

// ========== 技能卡片渲染 ==========
function renderSkillCard(skill) {
  const target = skill.target_name || skill.skill_target_type || '?';
  const attr = (skill.attack_attributes || []).map(a => {
    const map = {1:'斬',2:'打',3:'突',5:'火',6:'氷',7:'雷',8:'風'};
    return map[a] || a;
  }).join('/');

  let description = skill.description || '';
  if (skill.effects && skill.effects.length > 0) {
    skill.effects.forEach((eff, idx) => {
      const rawVal = eff.value ?? 0;
      const num = rawVal / 100;
      const displayVal = Number.isInteger(num) ? num : num.toFixed(1);
      description = description.replace(new RegExp(`\\{${idx}\\}`, 'g'), displayVal);
    });
  }

  const wt = 200 + (skill.wait ?? 0);

  return `<div class="skill-detail-card">
    <div class="skill-name">${skill.name || '??'} <small>(ID:${skill.id})</small></div>
    <div class="skill-desc">${description}</div>
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

// ========== 能力卡片渲染 ==========
function renderAbilityCard(ability) {
  let description = ability.description || '';
  if (ability.effects && ability.effects.length > 0) {
    ability.effects.forEach((eff, idx) => {
      const rawVal = eff.value ?? 0;
      const num = rawVal / 100;
      const displayVal = Number.isInteger(num) ? num : num.toFixed(1);
      description = description.replace(new RegExp(`\\{${idx}\\}`, 'g'), displayVal);
    });
  }
  return `<div class="ability-card">
    <div class="ability-name">${ability.name || `ID:${ability.id}`}</div>
    <div>${description}</div>
  </div>`;
}

// ========== 交互 ==========
async function selectCharacter(id) {
  currentCharId = id;
  document.querySelectorAll('.char-item').forEach(el => el.classList.remove('active'));
  const item = document.querySelector(`.char-item[data-id="${id}"]`);
  if (item) item.classList.add('active');
  const panel = document.getElementById('detailPanel');
  panel.innerHTML = `<div class="loading">${t('loading')}</div>`;
  try {
    const char = await loadCharacter(id);
    renderDetail(char);
  } catch(e) {
    panel.innerHTML = `<div class="no-data">${t('loadFailed')}</div>`;
  }
}

async function switchLanguage(lang) {
  if (currentLang === lang) return;
  currentLang = lang;
  document.getElementById('btn-ja').classList.toggle('active', lang === 'ja');
  document.getElementById('btn-cn').classList.toggle('active', lang === 'cn');
  updateUILanguage();
  await loadIndex();
  renderList();
  if (currentCharId) selectCharacter(currentCharId);
}

document.getElementById('btn-ja').addEventListener('click', () => switchLanguage('ja'));
document.getElementById('btn-cn').addEventListener('click', () => switchLanguage('cn'));

// 初始化
(async () => {
  updateUILanguage();
  await loadIndex();
  renderList();
})();