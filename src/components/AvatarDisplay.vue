<script setup>
import { computed, ref, onMounted, onUnmounted, onDeactivated, onActivated } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

let uid = 0
const { getTraitColorHex } = useI18n()
const { trackImage, imageDone, untrackImage } = useCharacterData()

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 100 },
  kid: { type: String, default: '' },
})

const canvasSize = 320
const kid = props.kid || (++uid + '-' + props.indexEntry.id)

const traitHex = computed(() => getTraitColorHex(props.indexEntry.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.indexEntry.support_color_id))
const attributeId = computed(() => (props.indexEntry.attack_attributes || [])[0])
const roleId = computed(() => props.indexEntry.role)

const starLevel = { 1:1, 2:2, 3:3, 4:3.5, 5:4, 6:4.5, 7:5, 8:6 }
const starDisplayCount = computed(() => {
  const level = starLevel[props.indexEntry.initial_rarity] || 0
  const hasHalf = level !== Math.floor(level)
  return Math.floor(level) + (hasHalf ? 1 : 0)
})

const charImage = computed(() => `image/character/${props.indexEntry.id}.png`)
const showImage = ref(false)
const wasLoaded = ref(false)
const imageSize = props.indexEntry.image_size ?? 60000
const containerRef = ref(null)
let cancelled = false
let tracked = false
let observer = null
let activeImg = null

function setupObserver() {
  cancelled = false
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      observer.disconnect()
      // 已加载过的图片不再重复下载
      if (showImage.value) return
      tracked = true
      trackImage(imageSize)
      activeImg = new Image()
      activeImg.onload = () => {
        if (cancelled) return
        showImage.value = true; wasLoaded.value = true; imageDone(imageSize)
        activeImg = null
      }
      activeImg.onerror = () => {
        if (cancelled) return
        imageDone(imageSize)
        activeImg = null
      }
      activeImg.src = charImage.value
    }
  }, { rootMargin: '200px' })
  if (containerRef.value) observer.observe(containerRef.value)
}

onMounted(setupObserver)
onActivated(setupObserver)

function cleanup() {
  cancelled = true
  observer?.disconnect()
  // 中止正在进行的图片下载，释放带宽
  if (activeImg) {
    activeImg.src = ''
    activeImg = null
  }
  if (tracked) untrackImage(imageSize, wasLoaded.value)
}

onUnmounted(cleanup)
onDeactivated(cleanup)
</script>

<template>
  <div ref="containerRef" class="avatar-component" :style="{ width: size + 'px', height: size + 'px' }">
    <div :style="{ position: 'absolute', top: 0, left: 0, width: canvasSize + 'px', height: canvasSize + 'px', transform: 'scale(' + (size / canvasSize) + ')', transformOrigin: '0 0' }">
      <svg
        :width="canvasSize" :height="canvasSize"
        viewBox="0 0 320 320"
        xmlns="http://www.w3.org/2000/svg"
        style="overflow: visible;"
      >
        <polygon points="160,10 10,160 160,310" :fill="traitHex" opacity="0.7" filter="url(#glow-g)" style="overflow:visible;"/>
        <polygon points="160,10 310,160 160,310" :fill="supportHex" opacity="0.7" filter="url(#glow-g)" style="overflow:visible;"/>
        <polygon points="160,25 25,160 160,295" :fill="traitHex"/>
        <polygon points="160,25 295,160 160,295" :fill="supportHex"/>
        <image
          :href="showImage ? charImage : 'image/misc/00000.png'"
          x="32" y="39" width="256" height="256"
          mask="url(#mask-g)"
          preserveAspectRatio="xMidYMax meet"
        />
      </svg>
      <div v-if="roleId" class="overlay-icon overlay-icon-left">
        <IconDisplay type="role" :id="roleId" :size="100" />
      </div>
      <div v-if="attributeId" class="overlay-icon overlay-icon-right">
        <IconDisplay type="attribute" :id="attributeId" :size="100" />
      </div>
      <div v-if="starDisplayCount > 0"
        :style="{
          position: 'absolute',
          left: ((canvasSize - starDisplayCount * 45 * 1.25) / 2) + 'px',
          top: (canvasSize - 45 * 1.25 - 10) + 'px',
        }"
      >
        <StarsDisplay :mode="1" :rarity="indexEntry.initial_rarity" :max-rarity="indexEntry.max_rarity" :scale="1.25" />
      </div>
    </div>
  </div>
</template>
