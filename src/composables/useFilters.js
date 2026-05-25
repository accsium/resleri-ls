import { ref, computed } from 'vue'
import { useI18n } from './useI18n'
import { useCharacterData } from './useCharacterData'

const activeSortFields = ref([])
const currentSortOrder = ref('desc')
const activeFilters = ref({ attack_attributes: [], role: [] })
const searchText = ref('')

export function useFilters() {
  const { SORT_FIELDS } = useI18n()
  const { characterIndex } = useCharacterData()

  if (activeSortFields.value.length === 0) {
    activeSortFields.value = [...SORT_FIELDS].sort((a, b) => a.priority - b.priority)
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
    if (activeFilters.value.attack_attributes.length &&
        !activeFilters.value.attack_attributes.some(a => (char.attack_attributes || []).includes(a)))
      return false
    if (activeFilters.value.role.length &&
        !activeFilters.value.role.includes(char.role))
      return false
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
        (c.another_name || '').toLowerCase().includes(q)
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

  function setFilters(filters) {
    activeFilters.value = filters
  }

  function clearFilters() {
    activeFilters.value = { attack_attributes: [], role: [] }
  }

  return {
    activeSortFields, currentSortOrder, activeFilters, searchText,
    filteredCharacters,
    setSortField, toggleOrder, setFilters, clearFilters
  }
}
