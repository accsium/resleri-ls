// 生成头像组件 HTML（默认尺寸 300x300，背景正方形对角线分割，蒙版矩形+直角三角形）
function renderAvatar(id, traitColor, supportColor, scale = 1) {
  const size = Math.round(300 * scale);
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;

  return `
    <div style="position:relative; width:${size}px; height:${size}px; overflow:hidden; display:inline-block;">
      <svg style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0;" viewBox="0 0 300 300">
        <polygon points="0,0 300,0 0,300" fill="${traitHex}" />
        <polygon points="300,0 300,300 0,300" fill="${supportHex}" />
      </svg>
      <img src="${imgPath}" alt="" 
           style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); height:100%; width:auto; z-index:1;
                  clip-path: polygon(0% 0%, 100% 0%, 100% 50%, 100% 100%, 0% 50%);"
           onerror="
             if (!this.dataset.fallback) {
               this.dataset.fallback = '1';
               this.src = '${fallbackPath}';
             } else {
               this.parentElement.style.display = 'none';
             }
           "
      />
    </div>
  `;
}