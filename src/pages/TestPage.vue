<template>
  <q-page>
    <div class="flex flex-center bg-grey-3 q-pa-sm">
      <q-btn flat round dense icon="home" to="/" class="on-left" />
      <span class="text-h4" style="margin-right: 240px">{{ id }}</span>
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
      <q-input
        type="number"
        v-model="delay"
        class="on-right"
        dense
        outlined
        label="Delay"
        style="width: 80px"
      />
    </div>

    <div
      id="waveform"
      class="q-mb-md shadow-3"
      style="height: 200px; padding: 16px"
    ></div>

    <div class="flex flex-center q-pa-md">
      <span class="text-h6 on-left"
        >{{ currentSentenceId + 1 }} / {{ sentences.length }}</span
      >
      <q-btn icon="refresh" round @click="reset" />

      <q-btn
        :icon="playing ? 'pause' : 'play_arrow'"
        round
        color="primary"
        size="lg"
        class="q-mx-lg"
        @click="playOrPause"
      />

      <q-btn
        icon="skip_next"
        round
        @click="nextSentence"
        :disable="!showResult"
      />
    </div>

    <div class="flex flex-center q-my-md">
      <q-input
        v-model="text"
        ref="inputRef"
        filled
        type="textarea"
        rows="5"
        spellcheck="false"
        style="width: 600px; font-size: 16px"
        @keypress.enter.prevent
      />
    </div>
    <div class="flex flex-center q-my-md">
      <q-btn
        color="primary"
        label="Compare (Shift + Enter)"
        @click="compare"
        style="margin-left: 16px"
      />
    </div>
    <div v-if="showResult" class="text-center">
      <p>
        <span
          v-for="(change, i) in diff"
          :key="i"
          :class="
            change.added
              ? 'text-positive'
              : change.removed
                ? 'text-negative'
                : ''
          "
          >{{ change.value }}</span
        >
      </p>
      <p>{{ currentSentence.englishDetail }}</p>
      <p>{{ currentSentence.translateDetail }}</p>
    </div>
    <div v-if="showResult && currentSentenceId === sentences.length - 1">
      <p v-for="(diff, i) in textResult.values()" :key="i">
        {{ i + 1 }}.
        <span
          v-for="(change, j) in diff"
          :key="j"
          :class="
            change.added
              ? 'text-positive'
              : change.removed
                ? 'text-negative'
                : ''
          "
          >{{ change.value }}</span
        >
      </p>
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
import * as Diff from 'diff'

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

const inputRef = ref<HTMLInputElement>()

// Create an instance of WaveSurfer
let ws: WaveSurfer
let wsRegions: Regions
let activeRegion: ReturnType<typeof wsRegions.addRegion>

const playOrPause = () => {
  playing.value ? pause() : play()
}

const play = () => {
  playing.value = true
  !regionPlaying.value && ws.seekTo(activeRegion.start / ws.getDuration())
  setTimeout(() => {
    ws.play()
    regionPlaying.value = true
  }, 10)
}

const pause = () => {
  playing.value = false
  ws.pause()
}

const nextSentence = () => {
  if (!showResult.value) {
    return
  }
  if (currentSentenceId.value < sentences.value.length) {
    showResult.value = false
    text.value = ''
    pause()
    currentSentenceId.value++
    addRegion()
    regionPlaying.value = false
    inputRef.value?.focus()
    play()
  } else {
    console.log('End of the part')
  }
}

const reset = () => {
  textResult.value = new Map()
  currentSentenceId.value = 0
  showResult.value = false
  text.value = ''
  addRegion()
  ws.seekTo(activeRegion.start / ws.getDuration())
  regionPlaying.value = false
}

const delay = useLocalStorage('delay', 0)

const addRegion = () => {
  wsRegions.clearRegions()
  activeRegion = wsRegions.addRegion({
    start: (currentSentence.value.startTime + delay.value - 100) / 1000,
    end: (currentSentence.value.endTime + delay.value) / 1000,
    color: 'rgba(255, 255, 0, 0.4)',
    drag: false,
    resize: false,
  })
  activeRegion.on('click', () => {
    play()
  })
}

const createWaveSurfer = () => {
  ws && ws.destroy()
  regionPlaying.value = false
  playing.value = false
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
        height: 40,
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

  wsRegions = ws.registerPlugin(Regions.create())

  wsRegions.on('region-out', () => {
    regionPlaying.value = false
    loopSentence.value ? play() : pause()
  })

  ws.on('decode', () => {
    addRegion()
  })
}

const showResult = ref(false)
const diff = ref<Diff.Change[]>([])

type TextResult = Map<number, Diff.Change[]>

const textResult = useLocalStorage<TextResult>(
  `textResult-${id}-${currentPartId}`,
  new Map(),
)

const compare = () => {
  diff.value = Diff.diffWords(text.value, currentSentence.value.englishDetail)
  // textResult.value.push(diff.value)
  textResult.value.set(currentSentenceId.value, diff.value)
  showResult.value = true
}

watch(audioUrl, () => {
  createWaveSurfer()
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) {
      compare()
    } else {
      playOrPause()
    }
  }
  if (e.key === 'Tab') {
    e.preventDefault()
    nextSentence()
  }
}

onMounted(() => {
  createWaveSurfer()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  ws.destroy()
  document.removeEventListener('keydown', onKeydown)
})

const text = ref('')
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
