<script setup>
import { computed } from 'vue'
import { useImagePlaceholder } from '../composables/useImagePlaceholder'

const props = defineProps({
  gacha: Object,
})

const href = computed(() =>
  props.gacha.gacha_image
    ? `image/gacha/${props.gacha.gacha_image}.webp`
    : null
)

const { imageLoaded } = useImagePlaceholder(href)
</script>

<template>
  <template v-if="imageLoaded">
    <img :src="href" style="height: 80px;">
  </template>
  <span v-else>{{ gacha.name }}</span>
</template>
