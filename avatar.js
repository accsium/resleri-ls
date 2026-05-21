// 生成头像组件 SVG（纯矢量，可任意缩放）
function renderAvatar(id, traitColor, supportColor, size = 300) {
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;
  const clipId = `clip-${id}`;

  // 坐标系转换：左下角原点 → SVG左上角原点 (y = 300 - y)
  // 菱形：(150,300)→(150,0), (300,150)→(300,150), (150,0)→(150,300), (0,150)→(0,150)
  // 蒙版：(22,256)→(22,44), (278,256)→(278,44), (278,128)→(278,172), (150,0)→(150,300), (22,128)→(22,172)

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景菱形 -->
      <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
      <polygon points="150,0 300,150 150,300" fill="${supportHex}" />

      <defs>
        <clipPath id="${clipId}">
          <polygon points="22,44 278,44 278,172 150,300 22,172" />
        </clipPath>
      </defs>

      <!-- 头像图片（256x256，左下角对齐，x=22, y=44，底部对齐于300） -->
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