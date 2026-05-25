<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import StarIcon from './StarIcon.vue'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

const props = defineProps({
  indexEntry: Object,
  size: { type: Number, default: 100 },
})

const { getTraitColorHex } = useI18n()

const traitHex = computed(() => getTraitColorHex(props.indexEntry.trait_color_id))
const supportHex = computed(() => getTraitColorHex(props.indexEntry.support_color_id))
const attributeId = computed(() => (props.indexEntry.attack_attributes || [])[0])
const roleId = computed(() => props.indexEntry.role)
const canvasSize = 360

const starCountMap = { 1: 1, 2: 2, 3: 3, 5: 4, 7: 5, 8: 6 }
const starCount = computed(() => starCountMap[props.indexEntry.initial_rarity] || 0)
const starType = computed(() => props.indexEntry.initial_rarity === 8 ? 'star_3' : 'star_1')

const charImage = computed(() => `image/character/${props.indexEntry.id}.png`)
const showImage = ref(false)

onMounted(() => {
  const img = new Image()
  img.onload = () => { showImage.value = true }
  img.onerror = () => {}
  img.src = charImage.value
})
</script>

<template>
  <div class="avatar-component" :style="{ width: size + 'px', height: size + 'px' }">
    <div :style="{ position: 'absolute', top: 0, left: 0, width: canvasSize + 'px', height: canvasSize + 'px', transform: 'scale(' + (size / canvasSize) + ')', transformOrigin: '0 0' }">
      <svg
        :width="canvasSize" :height="canvasSize"
        viewBox="0 0 360 360"
        xmlns="http://www.w3.org/2000/svg"
        style="overflow: visible;"
      >
        <defs>
          <filter :id="'glow-' + indexEntry.id" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" result="blur"/>
            <feComposite in="blur" in2="SourceGraphic" operator="over"/>
          </filter>
          <linearGradient :id="'gt-' + indexEntry.id" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <linearGradient :id="'gl-' + indexEntry.id" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <linearGradient :id="'gr-' + indexEntry.id" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/>
          </linearGradient>
          <mask :id="'mask-' + indexEntry.id">
            <polygon points="52,74 308,74 308,202 180,330 52,202" fill="white"/>
            <rect x="52" y="74" width="256" height="15" :fill="'url(#gt-' + indexEntry.id + ')'"/>
            <rect x="52" y="74" width="15" height="128" :fill="'url(#gl-' + indexEntry.id + ')'"/>
            <rect x="293" y="74" width="15" height="128" :fill="'url(#gr-' + indexEntry.id + ')'"/>
          </mask>
        </defs>
        <polygon points="180,10 10,180 180,350" :fill="traitHex" opacity="0.7" :filter="'url(#glow-' + indexEntry.id + ')'" style="overflow:visible;"/>
        <polygon points="180,10 350,180 180,350" :fill="supportHex" opacity="0.7" :filter="'url(#glow-' + indexEntry.id + ')'" style="overflow:visible;"/>
        <polygon points="180,30 30,180 180,330" :fill="traitHex"/>
        <polygon points="180,30 330,180 180,330" :fill="supportHex"/>
        <image
          :href="showImage ? charImage : 'image/misc/00000.png'"
          x="52" y="74" width="256" height="256"
          :mask="'url(#mask-' + indexEntry.id + ')'"
          preserveAspectRatio="xMidYMax meet"
        />
      </svg>
      <!-- 图标容器：无缩放居中 -->
      <IconDisplay v-if="roleId" side="left" :icon-src="'image/misc/role_' + roleId + '.png'" />
      <IconDisplay v-if="attributeId" side="right" :icon-src="'image/misc/attack_attribute_' + attributeId + '.png'" />
      <!-- 初始星星 -->
      <div v-if="starCount > 0"
        :style="{
          position: 'absolute',
          left: ((canvasSize - starCount * 45 * 1.5) / 2) + 'px',
          top: (canvasSize - 45 * 1.5 - 10) + 'px',
        }"
      >
        <StarsDisplay :scale="1.5">
          <StarIcon
            v-for="i in starCount" :key="i"
            :src="'image/misc/' + starType + '.png'"
          />
        </StarsDisplay>
      </div>
    </div>
  </div>
</template>
