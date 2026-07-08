import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from './useI18n'
import { useCharacterData } from './useCharacterData'
import { useCardState } from './useCardState'
import { useLocalStorage } from './useLocalStorage'
import { cmpVal } from '../utils/sort'

const sortField = ref('start_at')
const sortPriority = ref([])
const currentSortOrder = ref('desc')
const searchText = ref('')
const currentPage = ref(1)

const pageSize = useLocalStorage('resleri-pageSize', 50)

const activeFilters = reactive({
  attack_attributes: [],
  role: [],
  initial_rarity: [],
  trait_color: [],
  support_color: [],
  tags: [],
  battle_tool_traits: [],
  equipment_tool_traits: [],
  has_evo: 0,
  has_range: 0,
  has_transform: 0,
  has_active: 0,
  has_ex: 0,
  original_title: '',
  permanent_status: [],
  atelier_fes: [],
  series: '',
  voice_actor: '',
  base_character: '',
})

export function filterCharacter(char, f) {
  if (f.attack_attributes.length && !f.attack_attributes.some(a => (char.attack_attributes || []).includes(a)))
    return false
  if (f.role.length && !f.role.includes(char.role))
    return false
  if (f.initial_rarity.length && !f.initial_rarity.includes(char.initial_rarity))
    return false
  if (f.trait_color.length && !f.trait_color.includes(char.trait_color_id))
    return false
  if (f.support_color.length && !f.support_color.includes(char.support_color_id))
    return false
  if (f.tags.length) {
    const charTagIds = char.tag_ids || []
    if (!f.tags.filter(t => t != null && t !== '').every(t => charTagIds.includes(t)))
      return false
  }
  if (f.battle_tool_traits.length) {
    const charTraits = char.battle_tool_trait_ids || []
    if (!f.battle_tool_traits.filter(t => t != null && t !== '').every(t => charTraits.includes(t)))
      return false
  }
  if (f.equipment_tool_traits.length) {
    const charTraits = char.equipment_tool_trait_ids || []
    if (!f.equipment_tool_traits.filter(t => t != null && t !== '').every(t => charTraits.includes(t)))
      return false
  }
  const posKeys = ['has_evo','has_range','has_transform','has_active','has_ex'].filter(k => f[k] === 1)
  if (posKeys.length && !posKeys.some(k => char[k])) return false
  const negKeys = ['has_evo','has_range','has_transform','has_active','has_ex'].filter(k => f[k] === 2)
  if (negKeys.length && negKeys.some(k => char[k])) return false
  if (f.original_title) {
    if (char.original_title_id !== f.original_title) return false
  }
  if (f.series) {
    if (char.series_id !== f.series) return false
  }
  if (f.voice_actor) {
    if (char.voice_actor_id !== f.voice_actor) return false
  }
  if (f.base_character) {
    if (char.base_character_id !== f.base_character) return false
  }
  if (f.permanent_status.length || f.atelier_fes.length) {
    let matched = false
    if (f.permanent_status.length && f.permanent_status.includes(char.permanent_status || '')) {
      matched = true
    }
    if (f.atelier_fes.length) {
      const ps = char.permanent_status || ''
      if (ps.startsWith('fes_') && f.atelier_fes.includes(ps)) matched = true
    }
    if (!matched) return false
  }
  return true
}

function getCharWT(char, useAlt, skillsMap) {
  const speed = char.initial_status?.speed
  if (!speed || speed <= 0) return null
  const ids = pickSkillIds(char, 'normal2', useAlt)
  const wt = ids.length > 0 ? skillsMap.value[ids[ids.length - 1]]?.wt : null
  if (wt == null) return null
  return Math.floor(57600 / speed) + (wt - 200)
}

function pickSkillIds(char, type, useAlt) {
  if (useAlt && char.switch_stat?.skills?.hasOwnProperty(type)) {
    return char.switch_stat.skills[type]
  }
  return char.skills?.[type] || []
}

export function useFilters() {
  const { currentLang, SORT_FIELDS } = useI18n()
  const { characterIndex, baseCharacterMap, skillsMap } = useCharacterData()
  const { getCardState } = useCardState()

  if (sortPriority.value.length === 0) {
    sortPriority.value = SORT_FIELDS.map(f => ({ field: f.field }))
  }

  function toggleFilter(key, value) { activeFilters[key] = value }

  function getSortValue(c, field) {
    if (field === 'initial_wt') {
      const cardState = getCardState(c.id)
      return getCharWT(c, cardState.toggleActive, skillsMap)
    }
    if (field === 'tag_count') {
      return (c.tag_ids || []).length
    }
    return c.initial_status?.[field] ?? c[field]
  }

  function compareCharacters(a, b) {
    const order = currentSortOrder.value === 'desc' ? -1 : 1
    for (const item of sortPriority.value) {
      const va = getSortValue(a, item.field)
      const vb = getSortValue(b, item.field)
      const r = cmpVal(va, vb, order)
      if (r !== 0) return r
    }
    return 0
  }

  function applyFilter(char) { return filterCharacter(char, activeFilters) }

  const filteredCharacters = computed(() => {
    let list = characterIndex.value.filter(applyFilter)
    list.sort(compareCharacters)
    if (searchText.value) {
      const q = searchText.value.toLowerCase()
      list = list.filter(c => {
        const bc = baseCharacterMap.value[c.base_character_id]
        const nameJa = bc?.name_ja || ''
        const nameCn = bc?.name_cn || bc?.name_ja || ''
        return nameJa.toLowerCase().includes(q) ||
          nameCn.toLowerCase().includes(q) ||
          String(c.id).toLowerCase().includes(q) ||
          (c.another_name || '').toLowerCase().includes(q) ||
          (c.fullname || '').toLowerCase().includes(q) ||
          (c.overlay_name || '').toLowerCase().includes(q)
      })
    }
    return list
  })

  const totalPages = computed(() => Math.ceil(filteredCharacters.value.length / pageSize.value) || 1)

  const pagedCharacters = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredCharacters.value.slice(start, start + pageSize.value)
  })

  watch([activeFilters, searchText, pageSize], () => { currentPage.value = 1 })

  function setSortField(field) {
    sortField.value = field
    const all = SORT_FIELDS.map(f => ({ field: f.field }))
    const idx = all.findIndex(f => f.field === field)
    if (idx > 0) {
      const [item] = all.splice(idx, 1)
      all.unshift(item)
    }
    sortPriority.value = all
  }

  function toggleOrder() { currentSortOrder.value = currentSortOrder.value === 'desc' ? 'asc' : 'desc' }

  function resetFilters() {
    Object.assign(activeFilters, {
      attack_attributes: [], role: [], initial_rarity: [],
      trait_color: [], support_color: [], tags: [],
      battle_tool_traits: [], equipment_tool_traits: [],
      has_evo: 0, has_range: 0, has_transform: 0, has_active: 0, has_ex: 0,
      original_title: '', permanent_status: [], atelier_fes: [],
      series: '', voice_actor: '', base_character: '',
    })
    searchText.value = ''
    setSortField('start_at')
    currentSortOrder.value = 'desc'
  }

  return { sortField, currentSortOrder, activeFilters, searchText, filteredCharacters, pagedCharacters, currentPage, pageSize, totalPages, setSortField, toggleOrder, toggleFilter, resetFilters }
}
