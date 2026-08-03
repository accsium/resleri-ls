// 技能形态切换取 ID + 初始 WT 计算（从 useFilters/CharacterCard/CardDetail 提取的共享函数）
export function pickSkillIds(char, type, useAlt) {
  if (useAlt && char.switch_stat?.skills?.hasOwnProperty(type)) {
    return char.switch_stat.skills[type]
  }
  return char.skills?.[type] || []
}

export function calcInitialWT(char, useAlt, skillsMap) {
  const speed = char.initial_status?.speed
  if (!speed || speed <= 0) return null
  const ids = pickSkillIds(char, 'normal2', useAlt)
  const wt = ids.length > 0 ? skillsMap.value[ids[ids.length - 1]]?.wt : null
  if (wt == null) return null
  return Math.floor(57600 / speed) + (wt - 200)
}
