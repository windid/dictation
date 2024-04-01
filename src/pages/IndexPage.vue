<template>
  <q-page padding class="flex">
    <router-link
      v-for="d in dataList"
      :key="d"
      :to="`/test/${d}`"
      custom
      v-slot="{ navigate }"
    >
      <q-card
        @click="navigate"
        class="cursor-pointer flex flex-center q-ma-md text-h4 bg-grey-1"
        style="max-height: 150px; width: 150px"
      >
        {{ d }}
      </q-card>
    </router-link>
  </q-page>
</template>

<script setup lang="ts">
import data from 'src/data'
defineOptions({
  name: 'IndexPage',
})
const dataList = Object.keys(data)
</script>
