// 生成头像组件 HTML，支持按高度自适应和回退图片
function renderAvatar(id, traitColor, supportColor) {
  const clipId = `clip-${id}`;
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;

  return `
    <div class="avatar-wrapper" id="avatar-${id}">
      <svg class="avatar-diamond" viewBox="0 0 256 300">
        <polygon points="128,0 0,150 128,300" fill="${traitHex}" />
        <polygon points="128,0 256,150 128,300" fill="${supportHex}" />
      </svg>
      <img class="avatar-image" src="${imgPath}" alt="" 
           onerror="
             if (!this.dataset.fallback) {
               this.dataset.fallback = '1';
               this.src = '${fallbackPath}';
             } else {
               document.getElementById('avatar-${id}').style.display = 'none';
             }
           "
      />
    </div>
  `;
}