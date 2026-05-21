// 生成头像组件 SVG（纯矢量，尺寸由 size 参数直接控制，单位 px）
function renderAvatar(id, traitColor, supportColor, size = 300) {
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgId = `avatar-img-${id}`;
  const fallbackPath = `images/characters/00000.png`;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景菱形： (150,0) (0,150) (150,300) (300,150) -->
      <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
      <polygon points="150,0 300,150 150,300" fill="${supportHex}" />

      <defs>
        <clipPath id="clip-${id}">
          <!-- 蒙版：左下角原点转换后的 SVG 坐标 -->
          <polygon points="22,44 278,44 278,172 150,300 22,172" />
        </clipPath>
      </defs>

      <!-- 头像图片（高度256，底边对齐，水平居中） -->
      <image id="${imgId}" href="${fallbackPath}" x="22" y="44" height="256"
             clip-path="url(#clip-${id})" preserveAspectRatio="xMidYMax meet" />
    </svg>
  `;
}

// 异步加载真实头像（成功则替换占位图）
function initAvatar(id) {
  const img = document.getElementById(`avatar-img-${id}`);
  if (!img) return;
  const realSrc = `images/characters/${id}.png`;
  const testImg = new Image();
  testImg.onload = () => {
    img.setAttribute('href', realSrc);
  };
  testImg.src = realSrc;
}