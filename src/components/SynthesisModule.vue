<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  characterData: Object,
})

const { getField, getColorHex } = useI18n()

const traitName = computed(() => getField(props.characterData, 'trait_color_name') || '?')
const supportName = computed(() => getField(props.characterData, 'support_color_name') || '?')
const traits = computed(() => [
  ...(getField(props.characterData, 'battle_tool_trait_names') || []),
  ...(getField(props.characterData, 'equipment_tool_trait_names') || [])
])
</script>

<template>
  <div class="synthesis-module" style="margin-top: 20px;">
    <div class="synthesis-color-row">
      <span :style="{ color: getColorHex(traitName) }">{{ traitName }}</span>
      <svg width="20" height="20" viewBox="0 0 30 30">
        <polygon points="15,0 0,15 15,30" :fill="getColorHex(traitName)"/>
        <polygon points="15,0 30,15 15,30" :fill="getColorHex(supportName)"/>
      </svg>
      <span :style="{ color: getColorHex(supportName) }">{{ supportName }}</span>
    </div>
    <div class="synthesis-traits">
      <div v-for="(t, i) in traits" :key="i" class="trait-tag">{{ t }}</div>
    </div>
  </div>
</template>
