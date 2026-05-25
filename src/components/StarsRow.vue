<script setup>
import { computed } from 'vue'

const props = defineProps({
  scale: { type: Number, default: 1 },
})

const containerStyle = computed(() => ({
  display: 'inline-flex',
  gap: '0',
  transform: `scale(${props.scale})`,
  transformOrigin: 'top left',
  overflow: 'visible',
}))
</script>

<template>
  <div :style="containerStyle">
    <slot />
  </div>
</template>
