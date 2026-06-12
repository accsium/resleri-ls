// replaceEffects 输出已通过 escapeHtml 做 HTML 实体转义，v-html 渲染安全
// 数据来源均为本地构建 JSON（非用户输入），无 XSS 风险
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function replaceEffects(description, effects) {
  if (!effects) return escapeHtml(description || '')
  let desc = escapeHtml(description || '')
  effects.forEach((eff, i) => {
    desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100)
  })
  return desc
}
