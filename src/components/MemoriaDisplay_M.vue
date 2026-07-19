<script setup>
import { computed } from 'vue'
import { getSizePx } from '../composables/useI18n'
import { useImagePlaceholder } from '../composables/useImagePlaceholder'

const props = defineProps({
  entry: Object,
  scale: { type: Number, required: true },
  size: { type: Number, default: 0 },
})

const canvasW = 320
const canvasH = 512

const href = computed(() =>
  `image/memoria/${props.entry.image_M}.webp`
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
  <div
    class="memoria-m-component"
    :style="{
      width: sizePx + 'px',
      height: (sizePx * canvasH / canvasW) + 'px',
      position: 'relative',
    }"
  >
    <div
      :style="{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasW + 'px',
        height: canvasH + 'px',
        transform: 'scale(' + (sizePx / canvasW) + ')',
        transformOrigin: '0 0',
      }"
    >
      <div
        :style="{
          width: canvasW + 'px',
          height: canvasH + 'px',
          position: 'relative',
          overflow: 'hidden',
        }"
      >
        <div class="memoria-m-bg" />
        <img
          v-if="!imageLoaded"
          :src="PLACEHOLDER"
          class="memoria-m-img"
        />
        <img
          :src="href"
          class="memoria-m-img"
          :class="{ 'img-hidden': !imageLoaded }"
        />
        <span
          v-if="!imageLoaded"
          class="fallback-text"
          :style="{ transform: 'translate(-50%,-50%) scale(' + textScale + ')' }"
        >{{ entry.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memoria-m-bg {
  position: absolute;
  top: 0; left: 0;
  width: 320px; height: 512px;
  background: var(--bg-banner);
  opacity: 0.5;
}
.memoria-m-img {
  display: block;
  position: relative;
  z-index: 1;
  width: 320px;
  height: 512px;
  object-fit: contain;
}
.img-hidden { visibility: hidden; }
.fallback-text {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  color: var(--text-light);
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}
</style>
