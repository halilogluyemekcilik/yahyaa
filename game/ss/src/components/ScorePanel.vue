<template>
  <div class="score_container">
      <div class="score_panel">
          <div>
            <span style="font-weight: 700;">Skor: {{ score }}</span>
          </div>
          <div>
            <span style="font-weight: 700;">Altın: {{ coin }}</span>
          </div>
          <div>
            <span style="font-weight: 700;">Hata: {{ mistake }}</span>
          </div>
          <!-- Fullscreen Toggle Icon -->
          <div class="fs_icon" @click="togglePopup" title="Tam ekran">
            ⛶
          </div>
          <!-- Small Popup -->
          <div v-if="showPopup" class="fs_popup">
            <button class="fs_btn" @click="toggleFullscreen">{{ isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekrana Geç' }}</button>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import {defineProps, ref, onMounted, onBeforeUnmount} from 'vue';
// Skor paneli: skor, coin ve hata sayısını gösterir
const props = defineProps({
  score: {type: Number, default: 0},
  coin: {type: Number, default: 0},
  mistake: {type: Number, default: 0},
});

const showPopup = ref(false);
const isFullscreen = ref(false);

function togglePopup() {
  showPopup.value = !showPopup.value;
}

function onFullscreenChange() {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    // @ts-ignore
    document.webkitFullscreenElement ||
    // @ts-ignore
    document.mozFullScreenElement ||
    // @ts-ignore
    document.msFullscreenElement
  );
}

function enterFullscreen(el: Element) {
  const anyEl: any = el as any;
  if (anyEl.requestFullscreen) return anyEl.requestFullscreen();
  if (anyEl.webkitRequestFullscreen) return anyEl.webkitRequestFullscreen();
  if (anyEl.mozRequestFullScreen) return anyEl.mozRequestFullScreen();
  if (anyEl.msRequestFullscreen) return anyEl.msRequestFullscreen();
}

function exitFullscreen() {
  const anyDoc: any = document as any;
  if (document.exitFullscreen) return document.exitFullscreen();
  if (anyDoc.webkitExitFullscreen) return anyDoc.webkitExitFullscreen();
  if (anyDoc.mozCancelFullScreen) return anyDoc.mozCancelFullScreen();
  if (anyDoc.msExitFullscreen) return anyDoc.msExitFullscreen();
}

function toggleFullscreen() {
  if (isFullscreen.value) {
    exitFullscreen();
  } else {
    enterFullscreen(document.documentElement);
  }
  showPopup.value = false;
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  // @ts-ignore
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  // @ts-ignore
  document.addEventListener('mozfullscreenchange', onFullscreenChange);
  // @ts-ignore
  document.addEventListener('MSFullscreenChange', onFullscreenChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  // @ts-ignore
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
  // @ts-ignore
  document.removeEventListener('mozfullscreenchange', onFullscreenChange);
  // @ts-ignore
  document.removeEventListener('MSFullscreenChange', onFullscreenChange);
});
</script>

<style scoped>
.score_container {
  width: 100vw;
  height: 100vh;
  position: relative;
  z-index: 999;
}

.score_panel {
  height: 100px;
  width: 360px;
  position: absolute;
  right: 0;
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  background-color: #333;
  color: #fff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, .3);
}

.fs_icon {
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
}
.fs_icon:hover {
  background: rgba(255,255,255,0.2);
}

.fs_popup {
  position: absolute;
  top: 110px;
  right: 8px;
  background: #222;
  padding: 8px 10px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.fs_btn {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
}
.fs_btn:hover { background: #258cd1; }
</style>
