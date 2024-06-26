<template>
  <span
    v-for="(change, i) in changes"
    :key="i"
    :class="
      change.added ? 'text-positive' : change.removed ? 'text-negative' : ''
    "
  >
    {{ change.added && ' ' }}
    {{ change.value }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  changes: Diff.Change[]
}

withDefaults(defineProps<Props>(), {
  changes: () => [],
})
</script>

<style lang="sass" scoped>
.active
  background: $primary !important
  color: white

.text-positive
  color: $green

.text-negative
  color: $red
  text-decoration: line-through
</style>
