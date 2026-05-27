<script setup>
const PREFIX = { attribute: 'attack_attribute', role: 'role' }

defineProps({
  type: { type: String, required: true },
  id: { type: Number, required: true },
  size: { type: Number, required: true },
  alt: { type: String, default: '' },
})
</script>

<template>
  <div
    class="icon-box"
    :style="{ width: size + 'px', height: size + 'px' }"
    :title="alt"
  >
    <img
      :src="'image/misc/' + PREFIX[type] + '_' + id + '.png'"
      :alt="alt"
    >
  </div>
</template>
