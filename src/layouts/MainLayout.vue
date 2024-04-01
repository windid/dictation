<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-grey-9">
      <q-toolbar>
        <!-- <q-btn flat dense round icon="menu" aria-label="Menu" /> -->

        <q-toolbar-title>
          <q-btn to="/" flat size="lg"> Dictation </q-btn>
        </q-toolbar-title>

        <q-btn flat icon="settings" aria-label="settings" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
defineOptions({
  name: 'MainLayout',
})
</script>
