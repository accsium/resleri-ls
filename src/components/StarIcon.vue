<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: String,
  alt: { type: String, default: '' },
})

const STYLE_MAP = {
  '999_icon_star_chara_2_1':    { left: 0,  top: -2 },
  '999_icon_star_chara_2_harf': { left: -4, top: 0 },
}

const offset = computed(() => {
  for (const [key, val] of Object.entries(STYLE_MAP)) {
    if (props.src.includes(key)) return val
  }
  return { left: 0, top: 0 }
})
</script>

<template>
  <div class="star-icon">
    <img :src="src" :alt="alt" :style="{ position: 'relative', left: offset.left + 'px', top: offset.top + 'px' }">
  </div>
</template>
