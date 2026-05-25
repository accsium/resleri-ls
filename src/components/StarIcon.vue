<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: String,
  alt: { type: String, default: '' },
})

const STYLE_MAP = {
  star_0: { left: 0,  top: -1 },
  star_1: { left: 0,  top: 0 },
  star_2: { left: -5, top: 1 },
  star_3: { left: 0,  top: 0 },
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
