<script setup>
import { useFilters } from '../composables/useFilters'
import CharacterCard from './CharacterCard.vue'

const { filteredCharacters } = useFilters()
</script>

<template>
  <div class="card-container">
    <div class="card-mask"></div>
    <CharacterCard
      v-for="entry in filteredCharacters"
      :key="entry.id"
      :index-entry="entry"
    />
  </div>
</template>
