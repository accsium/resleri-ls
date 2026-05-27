import { ref, computed } from 'vue'
import { useI18n } from './useI18n'
import { useCharacterData } from './useCharacterData'

const activeSortFields = ref([])
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
  const { SORT_FIELDS } = useI18n()
  const { characterIndex } = useCharacterData()

  if (activeSortFields.value.length === 0) {
    activeSortFields.value = [...SORT_FIELDS].sort((a, b) => a.priority - b.priority)
  }

  function toggleFilter(key, value) {
    activeFilters.value = { ...activeFilters.value, [key]: value }
  }

  function compareCharacters(a, b) {
    for (const sf of activeSortFields.value) {
      const order = currentSortOrder.value === 'desc' ? -1 : 1
      let va = a[sf.field], vb = b[sf.field]
      if (Array.isArray(va)) va = va[0]
      if (Array.isArray(vb)) vb = vb[0]
      if (va == null && vb == null) continue
      if (va == null) return 1 * order
      if (vb == null) return -1 * order
      if (typeof va === 'string') {
        const c = va.localeCompare(vb)
        if (c) return c * order
      } else if (va < vb) return -1 * order
      else if (va > vb) return 1 * order
    }
    return 0
  }

  function applyFilter(char) {
    const f = activeFilters.value

    // OR: 属性
    if (f.attack_attributes.length && !f.attack_attributes.some(a => (char.attack_attributes || []).includes(a)))
      return false
    // OR: 职业
    if (f.role.length && !f.role.includes(char.role))
      return false
    // OR: 初始星级
    if (f.initial_rarity.length && !f.initial_rarity.includes(char.initial_rarity))
      return false
    // OR: 调和色-左
    if (f.trait_color.length && !f.trait_color.includes(char.trait_color_id))
      return false
    // OR: 调和色-右
    if (f.support_color.length && !f.support_color.includes(char.support_color_id))
      return false
    // AND: 标签
    if (f.tags.length) {
      const charTags = char.tag_names_ja || []
      if (!f.tags.filter(t => t).every(t => charTags.includes(t)))
        return false
    }
    // AND: 道具词条 (by id)
    if (f.battle_tool_traits.length) {
      const charTraits = char.battle_tool_trait_ids || []
      if (!f.battle_tool_traits.filter(t => t).every(t => charTraits.includes(t)))
        return false
    }
    // AND: 装备词条 (by id)
    if (f.equipment_tool_traits.length) {
      const charTraits = char.equipment_tool_trait_ids || []
      if (!f.equipment_tool_traits.filter(t => t).every(t => charTraits.includes(t)))
        return false
    }
    // 三态: has_evo/has_range/has_transform
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
        (c.name_cn || '').toLowerCase().includes(q) ||
        (c.name_ja || '').toLowerCase().includes(q) ||
        (c.another_name || '').toLowerCase().includes(q) ||
        String(c.id).toLowerCase().includes(q) ||
        (c.fullname || '').toLowerCase().includes(q) ||
        (c.overlay_name || '').toLowerCase().includes(q) ||
        (c._search_text || '').toLowerCase().includes(q)
      )
    }
    return list
  })

  function setSortField(field) {
    const list = [...SORT_FIELDS]
    const idx = list.findIndex(sf => sf.field === field)
    if (idx !== -1) {
      const [chosen] = list.splice(idx, 1)
      list.unshift(chosen)
      activeSortFields.value = list.sort((a, b) =>
        (a.field === field ? -1 : b.field === field ? 1 : a.priority - b.priority)
      )
    }
  }

  function toggleOrder() {
    currentSortOrder.value = currentSortOrder.value === 'desc' ? 'asc' : 'desc'
  }

  return {
    activeSortFields, currentSortOrder, activeFilters, searchText,
    filteredCharacters,
    setSortField, toggleOrder, toggleFilter,
  }
}
