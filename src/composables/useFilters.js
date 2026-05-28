import { ref, computed } from 'vue'
import { useI18n } from './useI18n'
import { useCharacterData } from './useCharacterData'
import { useCardState } from './useCardState'

const sortCategory = ref('character')
const sortField = ref('start_at')
const sortSkillType = ref('normal1')
const sortSkillStat = ref('power')
const sortPriority = ref([]) // ordered list of { field, type } for multi-field sort
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
  permanent_status: '',
})

export function useFilters() {
  const { currentLang, SORT_CATEGORIES } = useI18n()
  const { characterIndex } = useCharacterData()
  const { getCardState } = useCardState()

  // 初始化优先级列表
  if (sortPriority.value.length === 0) {
    const cat = SORT_CATEGORIES.find(c => c.key === sortCategory.value)
    if (cat && cat.fields) {
      sortPriority.value = cat.fields.map(f => ({ cat: sortCategory.value, field: f.field }))
    }
  }

  function toggleFilter(key, value) {
    activeFilters.value = { ...activeFilters.value, [key]: value }
  }

  function getSortValue(c, cat, field) {
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

  function cmpVal(va, vb, order) {
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

  function compareCharacters(a, b) {
    const order = currentSortOrder.value === 'desc' ? -1 : 1
    for (const item of sortPriority.value) {
      const va = getSortValue(a, item.cat, item.field)
      const vb = getSortValue(b, item.cat, item.field)
      const r = cmpVal(va, vb, order)
      if (r !== 0) return r
    }
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
    if (f.permanent_status) {
      if (f.permanent_status === 'ATELIER FES I') {
        if (char.permanent_date !== 'ATELIER FES I') return false
      } else if (f.permanent_status === 'ATELIER FES II') {
        if (char.permanent_date !== 'ATELIER FES II') return false
      } else if (char.permanent_status !== f.permanent_status) return false
    }

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

  function buildPriority(cat, field) {
    const category = SORT_CATEGORIES.find(c => c.key === cat)
    if (!category || !category.fields) {
      sortPriority.value = [{ cat, field }]
      return
    }
    const list = category.fields.map(f => ({ cat, field: f.field }))
    // 将选中字段移到最前
    const idx = list.findIndex(f => f.field === field)
    if (idx > 0) {
      const [item] = list.splice(idx, 1)
      list.unshift(item)
    }
    sortPriority.value = list
  }

  function setSortCategory(key) {
    sortCategory.value = key
    if (key === 'skill') {
      sortPriority.value = [{ cat: 'skill', field: 'skill' }]
    } else {
      buildPriority(key, sortField.value)
    }
  }

  function setSortField(field) {
    sortField.value = field
    const cat = sortCategory.value
    if (cat !== 'skill') buildPriority(cat, field)
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
