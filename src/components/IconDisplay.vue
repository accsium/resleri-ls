<script setup>
import { computed } from 'vue'
import { SIZE_SCALE } from '../composables/useI18n'

const PREFIX = { attribute: 'attack_attribute', role: 'role' }

const props = defineProps({
  type: { type: String, required: true },
  id: { type: Number, required: true },
  size: { type: Number, default: 0 },
  alt: { type: String, default: '' },
})

const sizePx = computed(() => SIZE_SCALE[props.size])
</script>

<template>
  <div
    class="icon-box"
    :style="{ width: sizePx + 'px', height: sizePx + 'px' }"
    :title="alt"
  >
    <img
      :src="'image/misc/' + PREFIX[type] + '_' + id + '.png'"
      :alt="alt"
    >
  </div>
</template>
