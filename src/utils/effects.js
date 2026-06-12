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
