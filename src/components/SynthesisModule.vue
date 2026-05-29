<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  characterData: Object,
})

const { getField, getTraitColorHex } = useI18n()

const collapsed = ref(false)

const traitHex = computed(() => getTraitColorHex(props.characterData.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.characterData.support_color_id))

const btIds = computed(() => props.characterData.battle_tool_trait_ids || [])
const etIds = computed(() => props.characterData.equipment_tool_trait_ids || [])
const btNames = computed(() => getField(props.characterData, 'battle_tool_trait_names') || [])
const etNames = computed(() => getField(props.characterData, 'equipment_tool_trait_names') || [])

const traitEffects = ref({})

onMounted(async () => {
  try {
    const [bt, et] = await Promise.all([
      fetch('data/battle_tool_trait.json').then(r => r.json()),
      fetch('data/equipment_tool_trait.json').then(r => r.json()),
    ])
    for (const t of bt) traitEffects.value['bt_' + t.id] = t
    for (const t of et) traitEffects.value['et_' + t.id] = t
  } catch {}
})

const allTraits = computed(() => {
  const list = []
  btIds.value.forEach((id, i) => {
    list.push({
      name: btNames.value[i] || `ID:${id}`,
      ...(traitEffects.value['bt_' + id] || {}),
    })
  })
  etIds.value.forEach((id, i) => {
    list.push({
      name: etNames.value[i] || `ID:${id}`,
      ...(traitEffects.value['et_' + id] || {}),
    })
  })
  return list
})

function splitEffect(effect) {
  if (!effect || !effect.effect_description) return []
  const parts = []
  let rest = effect.effect_description
  let i = 0
  while (rest.includes(`{${i}}`)) {
    const idx = rest.indexOf(`{${i}}`)
    if (idx > 0) parts.push({ text: rest.substring(0, idx) })
    parts.push({ slot: i })
    rest = rest.substring(idx + 3)
    i++
  }
  if (rest) parts.push({ text: rest })
  return parts
}
</script>

<template>
  <template v-if="allTraits.length > 0">
    <div class="section-title section-collapsible" @click="collapsed = !collapsed">
      调和
      <span class="synthesis-color-row">
        <span :style="{ color: traitHex }">{{ getField(characterData, 'trait_color_name') }}</span>
        <svg width="20" height="20" viewBox="0 0 30 30">
          <polygon points="15,0 0,15 15,30" :fill="traitHex"/>
          <polygon points="15,0 30,15 15,30" :fill="supportHex"/>
        </svg>
        <span :style="{ color: supportHex }">{{ getField(characterData, 'support_color_name') }}</span>
      </span>
      <span class="collapse-arrow">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div v-show="!collapsed" class="synthesis-body">
      <div v-for="(t, i) in allTraits" :key="i" class="syn-box">
        <div class="syn-box-name">{{ t.name }}</div>
        <div class="syn-box-desc">
          <template v-if="t.effect_description">
            <template v-for="(part, pi) in splitEffect(t)" :key="pi">
              <span v-if="part.text">{{ part.text }}</span>
              <span v-else class="syn-values">
                <span v-for="(lv, li) in (t.values[part.slot] || [])" :key="li" class="syn-value-box">{{ lv }}</span>
              </span>
            </template>
          </template>
        </div>
      </div>
    </div>
  </template>
</template>
