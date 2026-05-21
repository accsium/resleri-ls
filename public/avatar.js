// 生成头像组件 SVG（纯矢量，可任意缩放）
function renderAvatar(id, traitColor, supportColor, size = 300) {
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;
  const clipId = `clip-${id}`;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景菱形： (150,0) (0,150) (150,300) (300,150) -->
      <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
      <polygon points="150,0 300,150 150,300" fill="${supportHex}" />

      <defs>
        <!-- 蒙版形状：五边形 (22,256) (278,256) (278,128) (150,0) (22,128) -->
        <clipPath id="${clipId}">
          <polygon points="22,256 278,256 278,128 150,0 22,128" />
        </clipPath>
      </defs>

      <!-- 头像图片（256x256，底部对齐 y=0，左右居中 x=22） -->
      <image href="${imgPath}" x="22" y="0" width="256" height="256"
             clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"
             onerror="
               if (!this.dataset.fallback) {
                 this.dataset.fallback = '1';
                 this.setAttribute('href', '${fallbackPath}');
               } else {
                 this.parentElement.style.display = 'none';
               }
             " />
    </svg>
  `;
}