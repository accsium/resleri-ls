import { ref, shallowRef, triggerRef, computed } from 'vue'
import { getNavigationSignal } from '../router'

const characterIndex = ref([])
const indexLoaded = ref(false)

// 实体 Map — 按需加载，初始为空
const skillsMap = shallowRef({})
const abilitiesMap = shallowRef({})
const traitColorMap = shallowRef({})
const baseCharacterMap = shallowRef({})
const originalTitleMap = shallowRef({})
const characterTagMap = shallowRef({})
const buildTime = ref('')

const dataBytesLoaded = ref(0)
const dataBytesTotal = ref(1)
const imgBytesLoaded = ref(0)
const imgBytesTotal = ref(0)

const loadProgress = computed(() => {
  const total = dataBytesTotal.value + imgBytesTotal.value
  if (total === 0) return 0
  return Math.min(100, Math.round(((dataBytesLoaded.value + imgBytesLoaded.value) / total) * 100))
})

async function _readAllChunks(reader, onChunk) {
  const chunks = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    if (onChunk) onChunk(value.length)
  }
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0)
  const merged = new Uint8Array(totalLen)
  let offset = 0
  for (const c of chunks) { merged.set(c, offset); offset += c.length }
  return merged
}

async function _fetchJSON(url) {
  const resp = await fetch(url, { signal: getNavigationSignal(), cache: 'no-cache' })
  const total = parseInt(resp.headers.get('Content-Length') || '0')
  if (total) dataBytesTotal.value += total
  if (!resp.body) return resp.json()
  const reader = resp.body.getReader()
  let loaded = 0
  const merged = await _readAllChunks(reader, (chunkLen) => { loaded += chunkLen; dataBytesLoaded.value += chunkLen })
  if (total === 0 || total < loaded) { dataBytesTotal.value += loaded; dataBytesLoaded.value += loaded }
  const text = new TextDecoder().decode(merged)
  return JSON.parse(text)
}

// ── 按需加载实体 ──
const _entityCache = {}

async function _loadEntity(file) {
  if (_entityCache[file]) return _entityCache[file]
  try {
    const data = await _fetchJSON(`data/${file}`)
    _entityCache[file] = data
    return data
  } catch (e) {
    delete _entityCache[file]
    throw e
  }
}

// 模块级：加载 character_index + 小实体文件
async function _doLoadIndex() {
  try {
    const [idx, baseChar, traitColor, originalTitle, tagData] = await Promise.all([
      _fetchJSON('data/character_index.json'),
      _fetchJSON('data/base_character.json'),
      _fetchJSON('data/trait_color.json'),
      _fetchJSON('data/original_title.json'),
      _fetchJSON('data/character_tag.json'),
    ])
    characterIndex.value = idx
    baseCharacterMap.value = baseChar
    traitColorMap.value = traitColor
    originalTitleMap.value = originalTitle
    const tagMap = {}
    for (const t of tagData) tagMap[t.id] = t
    characterTagMap.value = tagMap
    indexLoaded.value = true
  } catch (e) {
    _loadPromise = null
    if (e.name === 'AbortError') return
  }
}

let _loadPromise = null

export function useCharacterData() {
  async function loadIndex() {
    if (!_loadPromise) _loadPromise = _doLoadIndex()
    await _loadPromise
  }

  function getCharacterById(id) {
    return characterIndex.value.find(c => c.id === id) || null
  }

  // 按需加载技能表
  async function loadSkills() {
    if (Object.keys(skillsMap.value).length === 0) {
      const data = await _loadEntity('skills.json')
      skillsMap.value = data
    }
    return skillsMap.value
  }

  async function loadAbilities() {
    if (Object.keys(abilitiesMap.value).length === 0) {
      const data = await _loadEntity('abilities.json')
      abilitiesMap.value = data
    }
    return abilitiesMap.value
  }

  async function loadEntityMap(file, ref) {
    if (Object.keys(ref.value).length === 0) {
      const data = await _loadEntity(file)
      ref.value = data
    }
    return ref.value
  }

  function trackImage(size) { imgBytesTotal.value += size }
  function imageDone(size) { imgBytesLoaded.value += size }
  function untrackImage(size, loaded) {
    imgBytesTotal.value = Math.max(0, imgBytesTotal.value - size)
    if (loaded) imgBytesLoaded.value = Math.max(0, imgBytesLoaded.value - size)
  }

  // 同步访问器（调用前需确保已加载）
  function getSkillById(id) { return skillsMap.value[id] || null }
  function getAbilityById(id) { return abilitiesMap.value[id] || null }

  return {
    characterIndex, indexLoaded, loadIndex,
    skillsMap, abilitiesMap, traitColorMap, baseCharacterMap, originalTitleMap, characterTagMap, buildTime,
    getCharacterById, getSkillById, getAbilityById,
    loadSkills, loadAbilities, loadEntityMap,
    loadProgress, trackImage, imageDone, untrackImage,
  }
}
