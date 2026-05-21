// 生成头像 HTML 结构（默认尺寸 300x300，可缩放）
function renderAvatar(id, traitColor, supportColor, scale = 1) {
  const size = Math.round(300 * scale);
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgId = `avatar-img-${id}`;
  const fallbackPath = `images/characters/00000.png`;

  return `
    <div style="width:${size}px; height:${size}px; overflow:hidden; position:relative;">
      <!-- 底层：菱形背景 SVG -->
      <svg style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0;" viewBox="0 0 300 300">
        <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
        <polygon points="150,0 300,150 150,300" fill="${supportHex}" />
      </svg>

      <!-- 上层：带蒙版的头像图片（底对齐居中，高256，宽自适应） -->
      <img id="${imgId}" src="${fallbackPath}" alt=""
           style="position:absolute; bottom:0; left:50%; transform:translateX(-50%);
                  height:256px; width:auto; z-index:1;
                  clip-path: polygon(22px 44px, 278px 44px, 278px 172px, 150px 300px, 22px 172px);" />
    </div>
  `;
}

// 异步加载真实头像（成功则替换占位图）
function initAvatar(id) {
  const img = document.getElementById(`avatar-img-${id}`);
  if (!img) return;
  const realSrc = `images/characters/${id}.png`;
  const testImg = new Image();
  testImg.onload = () => {
    img.src = realSrc;
  };
  testImg.src = realSrc;
}