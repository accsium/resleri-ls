<script setup>
import { computed } from 'vue'
import { getSizePx } from '../composables/useI18n'
import { useImagePlaceholder, PLACEHOLDER_ATTRS } from '../composables/useImagePlaceholder'

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
      <svg
        :width="canvasSize" :height="canvasSize"
        viewBox="0 0 320 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="memoria-mask">
            <circle cx="160" cy="160" r="128" fill="white" />
          </mask>
        </defs>
        <circle cx="160" cy="160" r="140" fill="var(--bg-banner)" opacity="0.5" />
        <image
          v-if="!imageLoaded"
          :href="PLACEHOLDER"
          v-bind="PLACEHOLDER_ATTRS"
        />
        <image
          :href="href"
          x="32" y="32" width="256" height="256"
          :style="{ visibility: imageLoaded ? 'visible' : 'hidden' }"
          mask="url(#memoria-mask)"
        />
        <text
          v-if="!imageLoaded"
          class="fallback-text"
          :transform="'translate(160,160) scale(' + textScale + ')'"
          x="0" y="0"
          text-anchor="middle"
          dominant-baseline="central"
          font-weight="600"
          :font-size="BASE_FONT"
        >{{ entry.name }}</text>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.fallback-text {
  fill: var(--text-light);
  text-shadow: 0 0 6px rgba(0,0,0,0.8);
  user-select: none;
  -webkit-user-select: none;
}
</style>
