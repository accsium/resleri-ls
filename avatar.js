// 生成头像组件 HTML（默认尺寸 300x300，可缩放）
function renderAvatar(id, traitColor, supportColor, scale = 1) {
  const size = Math.round(300 * scale);
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;

  return `
    <div style="width:${size}px; height:${size}px; overflow:hidden; position:relative;">
      <div style="width:300px; height:300px; position:absolute; top:0; left:0; transform:scale(${scale}); transform-origin:0 0;">
        <!-- 背景菱形：(150,0) (0,150) (150,300) (300,150) -->
        <svg style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0;" viewBox="0 0 300 300">
          <polygon points="150,0 0,150 150,300" fill="${traitHex}" />
          <polygon points="150,0 300,150 150,300" fill="${supportHex}" />
        </svg>
        <!-- 角色头像（高256，蒙版裁剪） -->
        <img src="${imgPath}" alt="" 
             style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); height:256px; width:auto; z-index:1;
                    clip-path: polygon(0px 0px, 256px 0px, 256px 128px, 128px 256px, 0px 128px);"
             onerror="
               if (!this.dataset.fallback) {
                 this.dataset.fallback = '1';
                 this.src = '${fallbackPath}';
               } else {
                 this.parentElement.parentElement.style.display = 'none';
               }
             "
        />
      </div>
    </div>
  `;
}