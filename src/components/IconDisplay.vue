<script setup>
defineProps({
  side: { type: String, required: true },
  iconSrc: { type: String, required: true },
})
</script>

<template>
  <div :class="['overlay-icon', 'overlay-icon-' + side]">
    <img :src="iconSrc" alt="">
  </div>
</template>
