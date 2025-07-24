<template>
  <div class="sidebar" :class="{ hidden: isMobile && chatSelected }">
    <div class="sidebar-header">
      <div class="profile-pic">ME</div>
      <div class="header-icons"><fa icon="fa-ellipsis-v" class="text-light" /></div>
    </div>
    <div class="search-bar">
      <input type="text" class="search-input" placeholder="Search or start new chat" />
    </div>
    <div class="chat-list">
      <div
        class="chat-item"
        v-for="chat in chats"
        :key="chat.name"
        :data-name="chat.name"
        :class="{ active: chat.name === activeChat?.name }"
        @click="$emit('selectChat', chat)"
      >
        <div class="chat-avatar" :style="{ background: chat.color }">{{ chat.avatar }}</div>
        <div class="chat-info">
          <div class="chat-name">{{ chat.name }}</div>
          <div class="chat-last-message">{{ chat.lastMessage }}</div>
        </div>
        <div class="chat-meta">
          <div class="chat-time">{{ chat.time }}</div>
          <div class="unread-count" v-if="chat.unread">{{ chat.unread }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
defineProps(['activeChat'])
const emits = defineEmits(['selectChat'])

const chats = [
  {
    name: 'John Smith',
    avatar: 'JS',
    color: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    lastMessage: 'Hey! How are you doing today?',
    time: '2:30 PM',
    unread: 3
  },
  {
    name: 'Emma Johnson',
    avatar: 'EJ',
    color: 'linear-gradient(135deg, #74b9ff, #0984e3)',
    lastMessage: 'Perfect! See you tomorrow at 9 AM',
    time: '1:45 PM'
  },
  {
    name: 'Sarah Wilson',
    avatar: 'SW',
    color: 'linear-gradient(135deg, #fd79a8, #e84393)',
    lastMessage: 'Thanks for sharing those photos!',
    time: '12:20 PM'
  }
]

const isMobile = computed(() => window.innerWidth < 768)
const chatSelected = computed(() => !!useAttrs().activeChat)
</script>
