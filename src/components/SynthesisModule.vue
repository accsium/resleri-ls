<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useTraitData } from '../composables/useTraitData'

const props = defineProps({
  characterData: Object,
})

const { getField, getTraitColorHex, currentLang } = useI18n()

const collapsed = ref(false)

const traitHex = computed(() => getTraitColorHex(props.characterData.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.characterData.support_color_id))

const btIds = computed(() => props.characterData.battle_tool_trait_ids || [])
const etIds = computed(() => props.characterData.equipment_tool_trait_ids || [])
const btNames = computed(() => getField(props.characterData, 'battle_tool_trait_names') || [])
const etNames = computed(() => getField(props.characterData, 'equipment_tool_trait_names') || [])

const { battleTraits, equipTraits, error: traitError, load: loadTraits } = useTraitData()

const traitEffects = computed(() => {
  const map = {}
  for (const t of battleTraits.value) map['bt_' + t.id] = t
  for (const t of equipTraits.value) map['et_' + t.id] = t
  return map
})

let traitAbort = null

onMounted(() => {
  traitAbort = new AbortController()
  loadTraits(traitAbort.signal)
})

onUnmounted(() => {
  traitAbort?.abort()
})

const allTraits = computed(() => {
  const list = []
  btIds.value.forEach((id, i) => {
    const eff = traitEffects.value['bt_' + id] || {}
    list.push({
      ...eff,
      name: btNames.value[i] || eff.name || `ID:${id}`,
    })
  })
  etIds.value.forEach((id, i) => {
    const eff = traitEffects.value['et_' + id] || {}
    list.push({
      ...eff,
      name: etNames.value[i] || eff.name || `ID:${id}`,
    })
  })
  return list
})

function splitEffect(effect) {
  const desc = currentLang.value === 'cn' ? (effect.effect_description_cn || effect.effect_description) : effect.effect_description
  if (!desc) return []
  const parts = []
  let rest = desc
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
  <div v-if="traitError" class="syn-error">
    调和数据加载失败
    <button class="syn-retry-btn" @click="traitAbort = new AbortController(); loadTraits(traitAbort.signal).catch(() => {})">重试</button>
  </div>
  <template v-else-if="allTraits.length > 0">
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

<style scoped>
.syn-error {
  padding: 12px 16px;
  margin: 8px 0;
  background: var(--bg-stat);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}
.syn-retry-btn {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}
.syn-retry-btn:hover {
  border-color: var(--accent);
}
</style>
