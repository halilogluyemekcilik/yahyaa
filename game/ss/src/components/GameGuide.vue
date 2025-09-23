<template>
  <div v-if="showMask" class="game-mask">
      <div class="message">Lütfen <span class="key">{{ textCompute.key }}</span> tuşuna basın: {{ textCompute.text }}</div>
      <div class="actions">
        <button
          v-if="gameStatus === 'ready'"
          class="guide-btn start"
          @click="startGame"
        >Oyunu Başlat (P)</button>
        <button
          v-if="gameStatus === 'end'"
          class="guide-btn restart"
          @click="restartGame"
        >Yeniden Başlat (R)</button>
      </div>
  </div>
</template>

<script setup lang="ts">
import {defineProps, computed} from 'vue';
// Oyun başlangıç/bitiş ipucu maskesi ve tuş yönlendirmesi
const props = defineProps({
  showMask: {type: Boolean, default: false},
  gameStatus: {type: String, default: 'ready'},
});
const keyMap: Record<string, any> = {
  ready: {
      key: 'P',
      text: 'Oyunu başlat',
  },
  end: {
      key: 'R',
      text: 'Yeniden başlat',
  },
};
const textCompute = computed(() => {
  return keyMap[props.gameStatus];
});

function dispatchKey(key: string) {
  const evt = new KeyboardEvent('keydown', { key });
  window.dispatchEvent(evt);
}
function startGame() {
  // Özel olay ve klavye simülasyonu birlikte
  window.dispatchEvent(new CustomEvent('game:start'));
  dispatchKey('p');
}
function restartGame() {
  window.dispatchEvent(new CustomEvent('game:restart'));
  dispatchKey('r');
}
</script>

<style scoped>
.game-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.message {
  font-size: 24px;
  color: white;
  text-align: center;
}

.key {
  background-color: #3498db;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}
.guide-btn {
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
}
.guide-btn.restart { background: #e67e22; }
.guide-btn:hover { filter: brightness(0.95); }
</style>
