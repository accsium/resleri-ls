import { ref, shallowRef, triggerRef } from 'vue'
import { getNavigationSignal } from '../router'
import { trackData } from './useProgress'

const characterIndex = ref([])
const indexLoaded = ref(false)

// 实体 Map — 按需加载，初始为空
const skillsMap = shallowRef({})
const abilitiesMap = shallowRef({})
const battleTraits = ref([])
const equipTraits = ref([])
const traitColorMap = shallowRef({})
const baseCharacterMap = shallowRef({})
const originalTitleMap = shallowRef({})
const characterTagMap = shallowRef({})
const seriesMap = shallowRef({})
const voiceActorMap = shallowRef({})
const buildTime = ref('')

async function _fetchJSON(url) {
  const resp = await fetch(url, { signal: getNavigationSignal() })
  if (!resp.ok) throw new Error('HTTP ' + resp.status)
  return resp.json()
}

// ── 按需加载实体 ──
const _entityCache = {}

async function _loadEntity(file) {
  if (_entityCache[file]) return _entityCache[file]
  const data = await _fetchJSON(`data/${file}`)
  _entityCache[file] = data
  return data
}

// 模块级：加载 character_index + 小实体文件
async function _doLoadIndex() {
  try {
    const [idx, baseChar, traitColor, originalTitle, tagData, seriesData, voiceActorData, bt, et] = await Promise.all([
      _fetchJSON('data/character_index.json'),
      _fetchJSON('data/base_character.json'),
      _fetchJSON('data/trait_color.json'),
      _fetchJSON('data/original_title.json'),
      _fetchJSON('data/character_tag.json'),
      _fetchJSON('data/series.json'),
      _fetchJSON('data/voice_actor.json'),
      _fetchJSON('data/battle_tool_trait.json'),
      _fetchJSON('data/equipment_tool_trait.json'),
    ])
    characterIndex.value = idx
    baseCharacterMap.value = baseChar
    traitColorMap.value = traitColor
    originalTitleMap.value = originalTitle
    const tagMap = {}
    for (const t of tagData) tagMap[t.id] = t
    characterTagMap.value = tagMap
    seriesMap.value = seriesData
    voiceActorMap.value = voiceActorData
    battleTraits.value = bt
    equipTraits.value = et
    indexLoaded.value = true
  } catch (e) {
    _loadPromise = null
    if (e.name === 'AbortError') return
  }
}

let _loadPromise = null

export function useCharacterData() {
  async function loadIndex() {
    const done = trackData(indexLoaded.value)
    if (!_loadPromise) _loadPromise = _doLoadIndex()
    await _loadPromise
    done()
  }

  function getCharacterById(id) {
    return characterIndex.value.find(c => c.id === id) || null
  }

  // 按需加载技能表
  async function loadSkills() {
    const done = trackData(Object.keys(skillsMap.value).length > 0)
    if (Object.keys(skillsMap.value).length === 0) {
      skillsMap.value = await _loadEntity('skills.json')
    }
    done()
    return skillsMap.value
  }

  async function loadAbilities() {
    const done = trackData(Object.keys(abilitiesMap.value).length > 0)
    if (Object.keys(abilitiesMap.value).length === 0) {
      abilitiesMap.value = await _loadEntity('abilities.json')
    }
    done()
    return abilitiesMap.value
  }

  async function loadTraits() {
    const done = trackData(battleTraits.value.length > 0)
    if (battleTraits.value.length === 0) {
      const [bt, et] = await Promise.all([
        _loadEntity('battle_tool_trait.json'),
        _loadEntity('equipment_tool_trait.json'),
      ])
      battleTraits.value = bt
      equipTraits.value = et
    }
    done()
  }

  async function loadEntityMap(file, ref) {
    const done = trackData(Object.keys(ref.value).length > 0)
    if (Object.keys(ref.value).length === 0) {
      ref.value = await _loadEntity(file)
    }
    done()
    return ref.value
  }

  // 同步访问器（调用前需确保已加载）
  function getSkillById(id) { return skillsMap.value[id] || null }
  function getAbilityById(id) { return abilitiesMap.value[id] || null }

  return {
    characterIndex, indexLoaded, loadIndex,
    skillsMap, abilitiesMap, battleTraits, equipTraits, traitColorMap, baseCharacterMap, originalTitleMap, characterTagMap, buildTime,
    seriesMap, voiceActorMap,
    getCharacterById, getSkillById, getAbilityById,
    loadSkills, loadAbilities, loadTraits, loadEntityMap,
  }
}

