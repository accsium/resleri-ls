// 生成头像组件 HTML，可放大缩小，通过 scale 参数控制
function renderAvatar(id, traitColor, supportColor, scale = 1) {
  const sw = Math.round(256 * scale);
  const sh = Math.round(300 * scale);
  const clipId = `clip-${id}`;
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;

  return `
    <div class="avatar-wrapper" style="width:${sw}px; height:${sw}px; position:relative; overflow:visible; display:inline-block;">
      <svg width="${sw}" height="${sh}" viewBox="0 0 256 300" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -100%); z-index:0;">
        <polygon points="128,0 0,150 128,300" fill="${traitHex}" />
        <polygon points="128,0 256,150 128,300" fill="${supportHex}" />
      </svg>
      <svg width="${sw}" height="${sw}" viewBox="0 0 256 256" style="position:absolute; top:0; left:0; z-index:1;">
        <defs>
          <clipPath id="${clipId}">
            <rect x="0" y="0" width="256" height="128" />
            <polygon points="0,128 256,128 128,256" />
          </clipPath>
        </defs>
        <image href="${imgPath}" x="0" y="0" width="256" height="256" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice" />
      </svg>
    </div>
  `;
}