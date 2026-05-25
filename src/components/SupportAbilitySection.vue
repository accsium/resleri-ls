<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import AbilityCard from './AbilityCard.vue'

const props = defineProps({
  supportIds: Array,
  abilityMap: Object,
  maxRarity: Number,
  initialRarity: Number,
})

const { t } = useI18n()

const activeIndex = ref(Math.min(props.maxRarity - 1, props.supportIds.length - 1))

const rarityMap = [1, 2, 3, 4, 5, 6, 7, 8]

const currentSupport = computed(() => {
  const id = props.supportIds[activeIndex.value]
  return id != null ? props.abilityMap[id] : null
})

const currentRarity = computed(() => rarityMap[activeIndex.value])

const currentUnreachable = computed(() =>
  currentRarity.value < props.initialRarity || currentRarity.value > props.maxRarity
)
</script>

<template>
  <div>
    <div class="banner-title">
      <span>{{ t('supportAbilityTitle') }}</span>
      <div class="support-rarity-tabs">
        <button
          v-for="(sid, idx) in supportIds"
          v-show="sid != null"
          :key="idx"
          class="level-tab support-rarity-btn"
          :class="{
            active: idx === activeIndex,
            'support-unreachable': rarityMap[idx] < initialRarity || rarityMap[idx] > maxRarity
          }"
          @click="activeIndex = idx"
        >{{ t('rarityLabel')[idx] }}</button>
      </div>
    </div>
    <div class="content-block" :class="{ 'support-unreachable': currentUnreachable }">
      <AbilityCard v-if="currentSupport" :ability="currentSupport" />
      <div v-else class="no-data">{{ t('none') }}</div>
      <div v-if="currentUnreachable" class="support-note">该角色目前无法到达此星级。</div>
    </div>
  </div>
</template>
