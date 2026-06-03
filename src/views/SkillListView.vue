<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex } = useCharacterData()
const { currentLang, ATTR_MAP, ATTR_MAP_CN } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const charIndexMap = computed(() => {
  const m = {}; for (const c of characterIndex.value) m[c.id] = c; return m
})

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'avatar', label: '头像', width: 88 },
  { key: 'name', label: '角色名', minWidth: 240 },
  { key: 'type', label: '种类', minWidth: 84, align: 'center' },
  { key: 'state', label: '状态', minWidth: 72, align: 'center' },
  { key: 'target', label: '对象', minWidth: 84, align: 'center' },
  { key: 'attr', label: '属性', width: 56, align: 'center' },
  { key: 'dmg', label: '伤害', width: 64, align: 'center' },
  { key: 'brk', label: '破防', width: 64, align: 'center' },
  { key: 'heal', label: '治疗', width: 64, align: 'center' },
  { key: 'wait', label: 'WT', width: 56, align: 'center' },
  { key: 'limit', label: '限制', width: 56, align: 'center' },
  { key: 'skillName', label: '技能名', minWidth: 240 },
  { key: 'skillDesc', label: '描述', minWidth: 1200 },
]

const skills = ref([])
const sortCol = ref('id')
const sortDir = ref('asc')

const TYPE_LABEL = { normal1:'一技能', normal2:'二技能', burst:'爆发技能', active1:'发动技能', ex:'EX' }

function formatPower(v) {
  if (v == null || v === 0) return '—'
  return v + '%'
}

const sortedSkills = computed(() => {
  const list = [...skills.value]
  const dir = sortDir.value === 'desc' ? -1 : 1

  list.sort((a, b) => {
    let va, vb
    switch (sortCol.value) {
      case 'id':
        va = a.char_id; vb = b.char_id
        break
      case 'name':
        va = (currentLang.value === 'cn' ? a.base_name_cn : a.base_name_ja) || ''
        vb = (currentLang.value === 'cn' ? b.base_name_cn : b.base_name_ja) || ''
        break
      case 'type':
        va = a.type; vb = b.type
        break
      case 'state':
        va = a.state; vb = b.state
        break
      case 'target':
        va = (currentLang.value === 'cn' ? a.target_name_cn : a.target_name_ja) || ''
        vb = (currentLang.value === 'cn' ? b.target_name_cn : b.target_name_ja) || ''
        break
      case 'attr':
        va = a.attack_attributes?.[0] || 0
        vb = b.attack_attributes?.[0] || 0
        break
      case 'dmg':
        va = a.dmg_power ?? -1; vb = b.dmg_power ?? -1
        break
      case 'brk':
        va = a.break_power ?? -1; vb = b.break_power ?? -1
        break
      case 'heal':
        va = a.heal_power ?? -1; vb = b.heal_power ?? -1
        break
      case 'wait':
        va = a.wait != null ? (200 + a.wait) : 9999
        vb = b.wait != null ? (200 + b.wait) : 9999
        break
      case 'limit':
        va = a.limit_count ?? 0; vb = b.limit_count ?? 0
        break
      case 'skillName':
        va = a.name || ''; vb = b.name || ''
        break
      case 'skillDesc':
        va = a.description || ''; vb = b.description || ''
        break
      default:
        va = a.char_id; vb = b.char_id
    }
    if (typeof va === 'string' && typeof vb === 'string') {
      const c = va.localeCompare(vb)
      if (c !== 0) return c * dir
    } else {
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
    }
    return (a.char_id - b.char_id) * dir
  })
  return list
})

function onSort(col) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
}

onMounted(async () => {
  const resp = await fetch('data/skills.json')
  const data = await resp.json()
  data.forEach((r, i) => r._idx = i)
  skills.value = data
})
</script>

<template>
  <SortableTable
    :columns="columns"
    :rows="sortedSkills"
    rowKey="_idx"
    :frozen="2"
    :sortCol="sortCol"
    :sortDir="sortDir"
    @sort="onSort"
  >
    <template #cell-id="{ row }">{{ row.char_id }}</template>
    <template #cell-avatar="{ row }">
      <div style="text-align:center;line-height:0">
        <AvatarDisplay v-if="charIndexMap[row.char_id]" :indexEntry="charIndexMap[row.char_id]" :size="72" />
      </div>
    </template>
    <template #cell-name="{ row }">
      {{ currentLang === 'cn' ? row.base_name_cn : row.base_name_ja }}<template v-if="row.another_name"> <span style="font-size:11px;color:var(--text-muted)">{{ row.another_name }}</span></template>
    </template>
    <template #cell-type="{ row }">{{ TYPE_LABEL[row.type] || row.type }}</template>
    <template #cell-state="{ row }">{{ row.state }}</template>
    <template #cell-target="{ row }">
      {{ currentLang === 'cn' ? row.target_name_cn : row.target_name_ja }}
    </template>
    <template #cell-attr="{ row }">
      {{ (row.attack_attributes || []).map(a => attrMap[a] || a).join(' ') }}
    </template>
    <template #cell-dmg="{ row }">{{ formatPower(row.dmg_power) }}</template>
    <template #cell-brk="{ row }">{{ formatPower(row.break_power) }}</template>
    <template #cell-heal="{ row }">{{ formatPower(row.heal_power) }}</template>
    <template #cell-wait="{ row }">{{ row.wait != null ? (200 + row.wait) : '—' }}</template>
    <template #cell-limit="{ row }">{{ row.limit_count || '—' }}</template>
    <template #cell-skillName="{ row }">{{ row.name }}</template>
    <template #cell-skillDesc="{ row }"><span v-html="row.description"></span></template>
  </SortableTable>
</template>
