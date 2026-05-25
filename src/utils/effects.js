export function replaceEffects(description, effects) {
  if (!effects) return description || ''
  let desc = description || ''
  effects.forEach((eff, i) => {
    desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100)
  })
  return desc
}
