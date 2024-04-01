<template>
  <q-page padding>
    <div class="flex flex-center">
      <span class="text-h4" style="margin-right: 200px">{{ id }}</span>
      <q-btn
        v-for="(part, i) in parts"
        :key="i"
        class="q-ma-sm"
        :color="i === currentPartId ? 'primary' : 'grey'"
        @click="currentPartId = i"
      >
        {{ i + 1 }}
      </q-btn>
      <q-checkbox v-model="loopSentence" label="Loop" class="on-right" />
    </div>

    <div id="waveform" class="q-ma-md" style="height: 176px"></div>

    <div class="flex flex-center bg-grey-2 q-pa-sm">
      <q-btn
        :icon="playing ? 'pause' : 'play_arrow'"
        round
        color="primary"
        size="lg"
        @click="playOrPause"
      />
    </div>

    <div class="flex flex-center q-my-md">
      <q-input
        v-model="text"
        filled
        type="textarea"
        rows="6"
        style="width: 720px"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import data from 'src/data'
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js'
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js'
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom.esm.js'

defineOptions({
  name: 'TestPage',
})

const route = useRoute()
const id = route.params.id as keyof typeof data

const parts = data[id].content

const currentPartId = useLocalStorage(`currentPart-${id}`, 0)

const sentences = computed(() => {
  return parts[currentPartId.value].subjectData.listenDetailList
})

const currentSentenceId = useLocalStorage(
  `currentSentence-${currentPartId.value}-${id}`,
  0,
)

const currentSentence = computed(() => {
  return sentences.value[currentSentenceId.value]
})

const part = computed(() => parts[currentPartId.value])

const audioUrl = computed(() => part.value.audioUrl.split('/').pop())

const playing = ref(false)
const regionPlaying = ref(false)
const loopSentence = ref(false)

// Create an instance of WaveSurfer
let ws: WaveSurfer
let wsRegions: Regions
let activeRegion: ReturnType<typeof wsRegions.addRegion>

const playOrPause = () => {
  playing.value ? pause() : play()
}

const play = () => {
  playing.value = true
  regionPlaying.value ? ws.play() : activeRegion.play()
  regionPlaying.value = true
}

const pause = () => {
  playing.value = false
  ws.pause()
}

const addRegion = () => {
  wsRegions.clearRegions()
  activeRegion = wsRegions.addRegion({
    start: currentSentence.value.startTime / 1000,
    end: currentSentence.value.endTime / 1000,
    color: 'rgba(255, 255, 0, 0.15)',
  })
}

const createWaveSurfer = () => {
  ws && ws.destroy()
  ws = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'rgb(200, 0, 50)',
    progressColor: 'rgb(100, 0, 0)',
    url: `/audio/${audioUrl.value}`,
    minPxPerSec: 36,
    hideScrollbar: true,
    autoCenter: false,
    plugins: [
      // Register the plugin
      Minimap.create({
        height: 48,
        waveColor: '#ccc',
        progressColor: '#999',
      }),
    ],
  })

  ws.registerPlugin(
    ZoomPlugin.create({
      // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
      scale: 0.5,
      // Optionally, specify the maximum pixels-per-second factor while zooming
      maxZoom: 100,
    }),
  )

  ws.on('interaction', () => {
    ws.pause()
  })

  wsRegions = ws.registerPlugin(Regions.create())

  wsRegions.on('region-out', () => {
    regionPlaying.value = false
    loopSentence.value ? play() : pause()
  })

  ws.on('decode', () => {
    addRegion()
  })
}

watch(audioUrl, () => {
  createWaveSurfer()
})

onMounted(() => {
  createWaveSurfer()
})

onUnmounted(() => {
  ws.destroy()
})

const text = ref('')
</script>

<style lang="sass" scoped>
.active
  background: $primary !important
  color: white
</style>
