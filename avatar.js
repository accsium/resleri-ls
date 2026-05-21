// 生成头像组件 SVG（纯矢量，可任意缩放）
function renderAvatar(id, traitColor, supportColor, size = 300) {
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;
  const clipId = `clip-${id}`;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景菱形 -->
      <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
      <polygon points="150,0 300,150 150,300" fill="${supportHex}" />
      
      <defs>
        <!-- 蒙版形状：矩形 + 倒三角形（三个直角） -->
        <clipPath id="${clipId}">
          <polygon points="0,0 256,0 256,128 128,256 0,128" />
        </clipPath>
      </defs>
      
      <!-- 头像图片（256x256，居中，底部对齐，y=44） -->
      <image href="${imgPath}" x="22" y="44" width="256" height="256"
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