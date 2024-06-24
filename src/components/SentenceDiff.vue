<template>
  <span
    v-for="(change, j) in changes"
    :key="j"
    :class="
      change.added ? 'text-positive' : change.removed ? 'text-negative' : ''
    "
    >{{ change.value }}</span
  >
</template>

<script setup lang="ts">
interface Props {
  changes: Diff.Change[]
}

withDefaults(defineProps<Props>(), {
  changes: () => [],
})
</script>
