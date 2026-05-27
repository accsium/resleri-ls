import { ref, computed } from 'vue'
import { useI18n } from './useI18n'
import { useCharacterData } from './useCharacterData'
import { useCardState } from './useCardState'

const sortCategory = ref('character')
const sortField = ref('start_at')
const sortSkillType = ref('normal1')
const sortSkillStat = ref('power')
const currentSortOrder = ref('desc')
const searchText = ref('')

const activeFilters = ref({
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
})

export function useFilters() {
  const { currentLang } = useI18n()
  const { characterIndex } = useCharacterData()
  const { getCardState } = useCardState()

  function toggleFilter(key, value) {
    activeFilters.value = { ...activeFilters.value, [key]: value }
  }

  function getSortValue(c) {
    const cat = sortCategory.value
    const field = sortField.value

    if (cat === 'character') {
      if (field === 'base_character_name') {
        const v = currentLang.value === 'cn' ? c.base_character_name_cn : c.base_character_name_ja
        return v || ''
      }
      return c[field]
    }

    if (cat === 'stats') {
      if (field === 'initial_wt') {
        const cardState = getCardState(c.id)
        return cardState.toggleActive ? c.alt_initial_wt : c.base_initial_wt
      }
      return c.initial_status?.[field]
    }

    if (cat === 'skill') {
      const cardState = getCardState(c.id)
      const prefix = cardState.toggleActive ? 'alt' : 'base'
      return c[`${prefix}_${sortSkillType.value}_${sortSkillStat.value}`]
    }

    return null
  }

  function compareCharacters(a, b) {
    const order = currentSortOrder.value === 'desc' ? -1 : 1
    let va = getSortValue(a)
    let vb = getSortValue(b)

    if (Array.isArray(va)) va = va[0]
    if (Array.isArray(vb)) vb = vb[0]
    if (va == null && vb == null) return 0
    if (va == null) return 1 * order
    if (vb == null) return -1 * order
    if (typeof va === 'string') {
      const c = va.localeCompare(vb)
      return c ? c * order : 0
    }
    if (va < vb) return -1 * order
    if (va > vb) return 1 * order
    return 0
  }

  function applyFilter(char) {
    const f = activeFilters.value

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
      const charTags = char.tag_names_ja || []
      if (!f.tags.filter(t => t).every(t => charTags.includes(t)))
        return false
    }
    if (f.battle_tool_traits.length) {
      const charTraits = char.battle_tool_trait_ids || []
      if (!f.battle_tool_traits.filter(t => t).every(t => charTraits.includes(t)))
        return false
    }
    if (f.equipment_tool_traits.length) {
      const charTraits = char.equipment_tool_trait_ids || []
      if (!f.equipment_tool_traits.filter(t => t).every(t => charTraits.includes(t)))
        return false
    }
    if (f.has_evo === 1 && !char.has_evo) return false
    if (f.has_evo === 2 && char.has_evo) return false
    if (f.has_range === 1 && !char.has_range) return false
    if (f.has_range === 2 && char.has_range) return false
    if (f.has_transform === 1 && !char.has_transform) return false
    if (f.has_transform === 2 && char.has_transform) return false
    if (f.has_active === 1 && !char.has_active) return false
    if (f.has_active === 2 && char.has_active) return false
    if (f.has_ex === 1 && !char.has_ex) return false
    if (f.has_ex === 2 && char.has_ex) return false

    return true
  }

  const filteredCharacters = computed(() => {
    let list = characterIndex.value.filter(applyFilter)
    list.sort(compareCharacters)
    if (searchText.value) {
      const q = searchText.value.toLowerCase()
      list = list.filter(c =>
        (c.base_character_name_ja || '').toLowerCase().includes(q) ||
        (c.base_character_name_cn || '').toLowerCase().includes(q) ||
        String(c.id).toLowerCase().includes(q) ||
        (c.another_name || '').toLowerCase().includes(q) ||
        (c.fullname || '').toLowerCase().includes(q) ||
        (c.overlay_name || '').toLowerCase().includes(q) ||
        (c._search_text || '').toLowerCase().includes(q)
      )
    }
    return list
  })

  function setSortCategory(key) {
    sortCategory.value = key
  }

  function setSortField(field) {
    sortField.value = field
  }

  function setSortSkillType(type) {
    sortSkillType.value = type
  }

  function setSortSkillStat(stat) {
    sortSkillStat.value = stat
  }

  function toggleOrder() {
    currentSortOrder.value = currentSortOrder.value === 'desc' ? 'asc' : 'desc'
  }

  return {
    sortCategory, sortField, sortSkillType, sortSkillStat, currentSortOrder,
    activeFilters, searchText,
    filteredCharacters,
    setSortCategory, setSortField, setSortSkillType, setSortSkillStat,
    toggleOrder, toggleFilter,
  }
}
