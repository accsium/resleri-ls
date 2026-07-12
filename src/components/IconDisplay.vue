<script setup>
import { computed } from 'vue'
import { SIZE_SCALE } from '../composables/useI18n'

const ATTR_MAP = { 5:'999_icon_attribute_0_00', 6:'999_icon_attribute_0_01', 8:'999_icon_attribute_0_03', 7:'999_icon_attribute_0_04', 1:'999_icon_attribute_0_05', 2:'999_icon_attribute_0_06', 3:'999_icon_attribute_0_07' }
const ROLE_MAP = { 2:'999_icon_role_01', 3:'999_icon_role_02', 1:'999_icon_role_03', 4:'999_icon_role_04' }

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
      :src="'image/misc/' + (type === 'role' ? ROLE_MAP : ATTR_MAP)[id] + '.webp'"
      :alt="alt"
    >
  </div>
</template>
