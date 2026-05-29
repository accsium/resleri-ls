<script setup>
import SortFilterBar from '../components/SortFilterBar.vue'
import PaginationBar from '../components/PaginationBar.vue'
import CharacterGrid from '../components/CharacterGrid.vue'
</script>

<template>
  <div class="guide-layout">
    <SortFilterBar />
    <PaginationBar />
    <div class="card-panel">
      <CharacterGrid />
    </div>
  </div>
</template>
