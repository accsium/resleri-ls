// 生成头像组件 HTML（默认尺寸 300x300，背景为正方形对角线分割）
function renderAvatar(id, traitColor, supportColor) {
  const traitHex = getColorHex(traitColor);
  const supportHex = getColorHex(supportColor);
  const imgPath = `images/characters/${id}.png`;
  const fallbackPath = `images/characters/00000.png`;

  return `
    <div class="avatar-wrapper" id="avatar-${id}">
      <!-- 背景正方形 (300x300) 对角线分割 -->
      <svg class="avatar-diamond" viewBox="0 0 300 300">
        <polygon points="0,0 300,0 0,300" fill="${traitHex}" />
        <polygon points="300,0 300,300 0,300" fill="${supportHex}" />
      </svg>
      <!-- 角色头像（按高度自适应，蒙版裁剪） -->
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