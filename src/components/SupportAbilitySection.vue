<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  supportIds: Array,
  abilityMap: Object,
  maxRarity: Number,
  initialRarity: Number,
})

const { t } = useI18n()

const rarityMap = [1, 2, 3, 4, 5, 6, 7, 8]

function formatDescription(ability) {
  if (!ability) return ''
  let desc = ability.description || ''
  if (ability.effects) {
    ability.effects.forEach((eff, i) => {
      desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100)
    })
  }
  return desc
}

const entries = computed(() => {
  return props.supportIds.map((sid, idx) => {
    if (sid == null) return null
    const rarity = rarityMap[idx]
    const unreachable = rarity < props.initialRarity || rarity > props.maxRarity
    const ability = props.abilityMap[sid]
    return { rarity, unreachable, ability, idx }
  }).filter(Boolean)
})
</script>

<template>
  <div class="section-title">{{ t('supportAbilityTitle') }}</div>
  <div v-for="entry in entries" :key="entry.idx" class="support-row">
    <div class="support-rarity-col" :class="{ 'support-unreachable': entry.unreachable }">
      {{ t('rarityLabel')[entry.idx] }}
    </div>
    <div class="support-desc-col" :class="{ 'support-unreachable': entry.unreachable }">
      <span v-if="entry.ability" class="skill-desc" v-html="formatDescription(entry.ability)"></span>
      <span v-else class="no-data">{{ t('none') }}</span>
      <span v-if="entry.unreachable" class="support-note">（该角色目前无法到达此星级。）</span>
    </div>
  </div>
</template>
