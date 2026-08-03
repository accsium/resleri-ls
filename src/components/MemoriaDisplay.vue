<script setup>
import { computed } from 'vue'
import { getSizePx } from '../composables/useI18n'
import { useImagePlaceholder } from '../composables/useImagePlaceholder'

const props = defineProps({
  entry: Object,
  scale: { type: Number, required: true },
  size: { type: Number, default: 0 },
})

const canvasSize = 320

const href = computed(() =>
  `image/memoria/${props.entry.image_square}.webp`
)
const { imageLoaded, PLACEHOLDER } = useImagePlaceholder(href)

const BASE_FONT = 32

function _weightedLen(str) {
  let w = 0
  for (const ch of str) {
    w += /[一-鿿　-〿＀-￯]/.test(ch) ? 1 : 0.55
  }
  return Math.max(w, 1)
}

const textScale = computed(() => {
  const name = props.entry.name || ''
  const nw = _weightedLen(name)
  if (nw === 0) return 1
  return Math.min(1, 320 / (BASE_FONT * nw))
})

const sizePx = computed(() => getSizePx(props.scale, props.size))

</script>

<template>
  <div class="memoria-component" :style="{ width: sizePx + 'px', height: sizePx + 'px', position: 'relative' }">
    <div :style="{ position: 'absolute', top: 0, left: 0, width: canvasSize + 'px', height: canvasSize + 'px', transform: 'scale(' + (sizePx / canvasSize) + ')', transformOrigin: '0 0' }">
      <div class="memoria-canvas">
        <div class="memoria-bg" />
        <img
          v-if="!imageLoaded"
          :src="PLACEHOLDER"
          class="memoria-img"
        />
        <img
          :src="href"
          class="memoria-img"
          :class="{ 'img-hidden': !imageLoaded }"
        />
        <span
          v-if="!imageLoaded"
          class="fallback-text"
          :style="{ transform: 'translate(-50%, -50%) scale(' + textScale + ')' }"
        >{{ entry.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memoria-canvas {
  position: relative;
  width: 320px;
  height: 320px;
}

.memoria-bg {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: var(--bg-banner);
  opacity: 0.5;
}

.memoria-img {
  position: absolute;
  top: 32px;
  left: 32px;
  width: 256px;
  height: 256px;
  border-radius: 50%;
  object-fit: cover;
}

.img-hidden {
  visibility: hidden;
}

.fallback-text {
  position: absolute;
  top: 50%;
  left: 50%;
  color: var(--text-light);
  font-weight: 600;
  font-size: 32px;
  text-shadow: var(--shadow-text);
  white-space: nowrap;
  pointer-events: none;
}
</style>
