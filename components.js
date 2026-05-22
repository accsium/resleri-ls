// ========== 可复用组件 ==========

// 星星组件（绝对定位，可缩放）
function renderStarGroup(rarity, scale = 1) {
  const starCountMap = {1:1, 2:2, 3:3, 5:4, 7:5, 8:6};
  const count = starCountMap[rarity] || 0;
  if (count === 0) return '';
  const starFile = rarity === 8 ? 'star_2.png' : 'star_1.png';
  const w = Math.round(67 * scale);
  const h = Math.round(64 * scale);
  const visibleW = Math.round((67 - 20) * scale);
  const offset = Math.round(10 * scale);
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = visibleW * i - offset;
    html += `<img src="image/misc/${starFile}" alt="" style="position:absolute; left:${left}px; top:0; width:${w}px; height:${h}px;">`;
  }
  return html;
}

// 头像背景 SVG（带外发光）
function renderAvatarSVG(id, traitColor, supportColor, size = 360) {
  const traitHex = getColorHex(traitColor), supportHex = getColorHex(supportColor);
  const imgId = `avatar-img-${id}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
    <defs>
      <filter id="glow-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="25" result="blur"/>
        <feComposite in="blur" in2="SourceGraphic" operator="over"/>
      </filter>
      <linearGradient id="gt-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/></linearGradient>
      <linearGradient id="gl-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/></linearGradient>
      <linearGradient id="gr-${id}" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/></linearGradient>
      <mask id="mask-${id}">
        <polygon points="52,74 308,74 308,202 180,330 52,202" fill="white"/>
        <rect x="52" y="74" width="256" height="15" fill="url(#gt-${id})"/>
        <rect x="52" y="74" width="15" height="128" fill="url(#gl-${id})"/>
        <rect x="293" y="74" width="15" height="128" fill="url(#gr-${id})"/>
      </mask>
    </defs>
    <polygon points="180,10 10,180 180,350" fill="${traitHex}" opacity="0.7" filter="url(#glow-${id})" style="overflow:visible;"/>
    <polygon points="180,10 350,180 180,350" fill="${supportHex}" opacity="0.7" filter="url(#glow-${id})" style="overflow:visible;"/>
    <polygon points="180,30 30,180 180,330" fill="${traitHex}"/>
    <polygon points="180,30 330,180 180,330" fill="${supportHex}"/>
    <image id="${imgId}" href="image/misc/00000.png" x="52" y="74" width="256" height="256" mask="url(#mask-${id})" preserveAspectRatio="xMidYMax meet"/>
  </svg>`;
}

// 图标模块
function renderIconModule(type, iconId, containerSize = 128) {
  if (!iconId) return '';
  let w, h;
  if (type === 'role') {
    const roleSizes = {1:{w:96,h:96},2:{w:121,h:115},3:{w:120,h:105},4:{w:119,h:99}};
    const r = roleSizes[iconId] || roleSizes[1];
    w = r.w; h = r.h;
  } else if (type === 'attack_attribute') {
    w = 118; h = 112;
  } else return '';
  const left = (containerSize - w) / 2, top = (containerSize - h) / 2;
  return `<div style="width:${containerSize}px;height:${containerSize}px;position:relative;overflow:visible;">
    <img src="image/misc/${type}_${iconId}.png" alt="" style="position:absolute; left:${left}px; top:${top}px; width:${w}px; height:${h}px;">
  </div>`;
}

// 调和模块
function renderSynthesisModule(char) {
  const traitName = getField(char, 'trait_color_name') || '?';
  const supportName = getField(char, 'support_color_name') || '?';
  const traits = [...(getField(char, 'battle_tool_trait_names')||[]), ...(getField(char, 'equipment_tool_trait_names')||[])];
  return `<div class="synthesis-module">
    <div class="synthesis-color-row">
      <span style="color:${getColorHex(traitName)}">${traitName}</span>
      <svg width="20" height="20" viewBox="0 0 30 30"><polygon points="15,0 0,15 15,30" fill="${getColorHex(traitName)}"/><polygon points="15,0 30,15 15,30" fill="${getColorHex(supportName)}"/></svg>
      <span style="color:${getColorHex(supportName)}">${supportName}</span>
    </div>
    <div class="synthesis-traits">${traits.map(t => `<div class="trait-tag">${t}</div>`).join('')}</div>
  </div>`;
}

// 胶囊开关
function createToggleSwitch(type, checked, label) {
  return `<label class="toggle-switch" data-type="${type}" title="${label}"><input type="checkbox" ${checked?'checked':''}><span class="slider"></span></label>`;
}