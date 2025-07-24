<template>
  <div class="custom-container">
    <Sidebar :activeChat="activeChat" @selectChat="selectChat" />
    <ChatArea :chat="activeChat" v-if="activeChat" @back="clearChat" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ChatArea from '../components/ChatArea.vue'

const activeChat = ref(null)

function selectChat(chat) {
  activeChat.value = chat
}

function clearChat() {
  activeChat.value = null
}

function isMobile() {
  return window.innerWidth < 768
}

function handleResize() {
  if (!isMobile()) activeChat.value = null
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
