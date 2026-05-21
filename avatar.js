// 生成头像 HTML 结构
function renderAvatar(id, traitColor, supportColor, displaySize = 300) {
  const scale = displaySize / 300;
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgId = `avatar-img-${id}`;
  const fallbackPath = `images/characters/00000.png`;

  return `
    <div style="width:${displaySize}px; height:${displaySize}px; overflow:hidden; position:relative;">
      <div style="width:300px; height:300px; position:absolute; top:0; left:0;
                  transform:scale(${scale}); transform-origin:0 0;">
        <!-- 背景菱形 SVG -->
        <svg style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0;" viewBox="0 0 300 300">
          <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
          <polygon points="150,0 300,150 150,300" fill="${supportHex}" />
        </svg>

        <!-- 蒙版容器（固定 256x256，位于 22,44） -->
        <div style="position:absolute; left:22px; top:44px; width:256px; height:256px; z-index:1;
                    clip-path: polygon(0px 0px, 256px 0px, 256px 128px, 128px 256px, 0px 128px);">
          <img id="${imgId}" src="${fallbackPath}" alt=""
               style="position:absolute; bottom:0; left:50%; transform:translateX(-50%);
                      height:256px; width:auto; display:block;" />
        </div>
      </div>
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