// 头像组件
function renderAvatarComponent(indexEntry, size = 100) {
  const id = indexEntry.id;
  const traitColor = getField(indexEntry, 'trait_color_name');
  const supportColor = getField(indexEntry, 'support_color_name');
  const attrId = (indexEntry.attack_attributes || [])[0];
  const roleId = indexEntry.role;
  const canvasW = 360, canvasH = 360;
  const svg = renderAvatarSVG(id, traitColor, supportColor, canvasW);

  const avatarStarScale = 1.5;
  const starCountMap = {1:1,2:2,3:3,5:4,7:5,8:6};
  const starCount = starCountMap[indexEntry.initial_rarity] || 0;
  const starFullW = Math.round(67 * avatarStarScale), starFullH = Math.round(64 * avatarStarScale);
  const starVisibleW = Math.round((67 - 20) * avatarStarScale);
  const starTotalW = starCount * starVisibleW;
  const starStartX = (canvasW - starTotalW) / 2, starStartY = canvasH - starFullH;

  const starsHTML = starCount > 0 ? `<div style="position:absolute; left:${starStartX}px; top:${starStartY}px; width:${starTotalW}px; height:${starFullH}px; overflow:visible;">${renderStarGroup(indexEntry.initial_rarity, avatarStarScale)}</div>` : '';

  const roleModule = renderIconModule('role', roleId, 128);
  const attrModule = renderIconModule('attack_attribute', attrId, 128);
  const scale = size / canvasW;

  return `<div class="avatar-component" style="width:${size}px;height:${size}px;position:relative;overflow:visible;">
    <div style="position:absolute;top:0;left:0;width:${canvasW}px;height:${canvasH}px;transform:scale(${scale});transform-origin:0 0;">
      ${svg}
      <div style="position:absolute;left:0;top:0;">${roleModule}</div>
      <div style="position:absolute;left:${canvasW - 128}px;top:0;">${attrModule}</div>
      ${starsHTML}
    </div>
  </div>`;
}

function initAvatar(card, id) {
  const img = card.querySelector(`#avatar-img-${id}`);
  if (!img) return;
  const test = new Image();
  test.onload = () => img.setAttribute('href', `image/character/${id}.png`);
  test.src = `image/character/${id}.png`;
}