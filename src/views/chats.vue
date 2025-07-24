<template>
  <div class="custom-container">
    <!-- Sidebar -->
    <div class="sidebar" :class="{ 'mobile-hidden': isMobileChatOpen }">
      <div class="sidebar-header">
        <div class="profile-pic text-capitalize">{{ authStore.user.username.charAt(0) }}</div>
        <div class="header-icons">
          <fa icon="fa-ellipsis-v" />
        </div>
      </div>

      <div class="search-bar">
        <input type="text" class="search-input" placeholder="Search or start new chat" v-model="searchQuery"
          @input="handleSearch" />
        <fa icon="fa-magnifying-glass" />
      </div>

      <div class="chat-list">
        <div v-for="chat in filteredChats" :key="chat.contactId" class="chat-item"
          :class="{ active: chatStore.conversation?.id === chat.contactId }" @click="selectChat(chat)">
          <div class="chat-avatar text-capitalize" :style="{ background: chat.color }">
            {{ chat.contactName?.charAt(0) }}
          </div>
          <div class="chat-info">
            <div class="chat-name">{{ chat.contactName }}</div>
            <div class="chat-last-message">{{ chat?.lastMessage }}</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">{{ chat?.lastMessageTime }}</div>
            <div v-if="chat?.unreadCount" class="unread-count">
              {{ chat?.unreadCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="chat-area" :class="{
      'mobile-active': isMobileChatOpen,
      'desktop-active': chatStore.conversation && !isMobile,
    }">
      <div v-if="chatStore.conversation" class="chat-header">
        <fa icon="fa-arrow-left" @click="closeMobileChat" v-if="isMobile" class="back-button"></fa>
        <div class="chat-avatar text-capitalize"
          :style="{ background: chatStore.conversation.color, position: 'relative' }">
          {{ chatStore.conversation.contactName?.charAt(0) }}
          <div class="online-indicator"></div>
        </div>
        <div class="chat-header-info">
          <div class="chat-header-name">{{ chatStore.conversation.contactName }}</div>
          <div class="chat-header-status">
            {{ chatStore.conversation.status || "online" }}
          </div>
        </div>
        <div class="chat-header-actions">
          <fa icon="fas fa-ellipsis-v" @click="handleChatMenu" />
        </div>
      </div>

      <div class="messages-area" ref="messagesArea" v-if="chatStore.conversation">
        <div v-for="m in chatStore.messagesList" :key="m.id" class="message text-white"
          :class="{ sent: m.sender?.id == authStore.user.id, received: m.sender?.id != authStore.user.id }">
          <div v-if="m.messageType == 'text'" class="message-bubble">
            <div class="message-text">{{ m.content }}</div>
            <div class="message-time">
              {{ defaultMessageTime(m.createdAt) }}
              <span v-if="m.sender?.id == authStore.user.id" class="message-status">
                <fa :icon="m.isRead ? 'fa-check-double' : 'fa-check'
                  " :style="{
                    color: m.isRead ? '#53bdeb' : '#8696a0',
                  }" />
              </span>
            </div>
          </div>
          <div v-else-if="m.messageType == 'file'" class="message-bubble">
            <img :src="m.fileUrl" :alt="m.fileName" class="img-fluid mb-2">
            <div class="message-text">{{ m.content || m.fileName }}</div>
            <div class="message-time">
              {{ defaultMessageTime(m.createdAt) }}
              <span v-if="m.sender?.id == authStore.user.id" class="message-status">
                <fa :icon="m.isRead ? 'fa-check-double' : 'fa-check'
                  " :style="{
                    color: m.isRead ? '#53bdeb' : '#8696a0',
                  }" />
              </span>
            </div>
          </div>
          <div v-else-if="m.messageType == 'order_notification'" class="message-bubble">
            <img :src="m.orderData.image" :alt="m.orderData.name" class="img-fluid mb-2">
            <div class="message-text">Name: {{ m.orderData.name }}</div>
            <div class="message-text">SKU: {{ m.orderData.sku }}</div>
            <div class="message-text">Qty: {{ m.orderData.qty }}</div>
            <div class="message-time">
              {{ defaultMessageTime(m.createdAt) }}
              <span v-if="m.sender?.id == authStore.user.id" class="message-status">
                <fa :icon="m.isRead ? 'fa-check-double' : 'fa-check'
                  " :style="{
                    color: m.isRead ? '#53bdeb' : '#8696a0',
                  }" />
              </span>
            </div>
          </div>
        </div>

        <div v-if="isTyping" class="typing-indicator">
          <span>{{ typingUser }} is typing</span>
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>

      <div class="no-chat" v-else-if="!isMobile">
        <div class="no-chat-content">
          <fa icon="fa-comments" />
          <h3>Select a chat to start messaging</h3>
          <p>Choose from your existing conversations or start a new one</p>
        </div>
      </div>

      <div class="input-area" v-if="chatStore.conversation">
        <div class="input-actions">
          <fa icon="fa-plus" @click="handleAttachment" />
        </div>
        <textarea ref="messageInput" class="message-input" placeholder="Type a message" rows="1"
          v-model="currentMessage" @input="handleInputResize" @keypress="handleKeyPress"></textarea>
        <button class="send-button" @click="sendMessage">
          <fa icon="fas fa-paper-plane" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { defaultMessageTime } from "@/helpers/generalVariable.js"

const authStore = useAuthStore();
const chatStore = useChatStore();

// Reactive state
const searchQuery = ref("");
const currentMessage = ref("");
const messageInput = ref(null);
const messagesArea = ref(null);

// Responsive state
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

// Chat state
const isMobileChatOpen = ref(false);

// Typing state
const isTyping = ref(false);
const typingUser = ref("");

// Computed properties
const filteredChats = computed(() => {
  if (!searchQuery.value) {
    return chatStore.conversations;
  }
  return chatStore.conversations.filter((chat) =>
    chat.contactName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Watch for mobile state changes
watch(isMobile, (newIsMobile) => {
  if (!newIsMobile) {
    // Switching to desktop - close mobile chat
    isMobileChatOpen.value = false;
    // Auto-select chat if conversation exists
    if (chatStore.conversation) {
      selectChat(chatStore.conversation);
    }
  } else {
    // Switching to mobile - close chat view
    isMobileChatOpen.value = false;
  }
});

// Methods
const selectChat = async (chat) => {
  await chatStore.setConversations(chat);
  const filter = `?userId=${authStore.user.id}&contactId=${chat.contactId}&page=1&limit=50`;
  await chatStore.getMessages(filter);
  // On mobile, open the chat area
  if (isMobile.value) {
    isMobileChatOpen.value = true;
  }

  // Clear unread count
  chat.unreadCount = 0;

  // Start typing simulation after a delay
  setTimeout(() => {
    startTyping(chat.name.split(" ")[0]);
  }, 2000);

  // Scroll to bottom
  nextTick(() => {
    scrollToBottom();
  });
};

const closeMobileChat = () => {
  if (isMobile.value) {
    isMobileChatOpen.value = false;
  }
  stopTyping();
};

const sendMessage = () => {
  if (!currentMessage.value.trim()) return;

  // Reset textarea height
  if (messageInput.value) {
    messageInput.value.style.height = "auto";
  }

  // Scroll to bottom
  scrollToBottom();

  // Simulate message status updates
  setTimeout(() => {
    newMessage.status = "delivered";
  }, 1000);

  setTimeout(() => {
    newMessage.status = "read";
  }, 3000);

  const payload = {
    senderId: authStore.user.id,
    receiverId: chatStore.conversation.contactId,
    content: currentMessage.value,
    messageType: "text",
  }

  chatStore.sendMessage(payload);
  currentMessage.value = "";

  // Stop typing indicator
  stopTyping();
};

const handleInputResize = () => {
  if (messageInput.value) {
    messageInput.value.style.height = "auto";
    const newHeight = Math.min(messageInput.value.scrollHeight, 120);
    messageInput.value.style.height = newHeight + "px";
  }
};

const handleKeyPress = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
    }
  });
};

const startTyping = (user) => {
  isTyping.value = true;
  typingUser.value = user;
  scrollToBottom();

  // Stop typing after 3 seconds
  setTimeout(() => {
    stopTyping();
  }, 3000);
};

const stopTyping = () => {
  isTyping.value = false;
  typingUser.value = "";
};

const handleSearch = () => {
  // Search functionality is handled by computed property
};

const handleChatMenu = () => {
  console.log("Chat menu opened");
};

const handleAttachment = () => {
  console.log("Attachment menu opened");
};

const getConversations = async () => {
  var filter = '';
  const u = authStore.user;
  if (u.user_type == 'store_owner') {
    filter = `?userId=${u.id}&userType=${u.user_type}&shopId=${u.shop_id}`;
  } else {
    filter = `?userId=${u.id}&userType=${u.user_type}`;
  }

  await chatStore.getConversations(filter);
}

// Lifecycle hooks
onMounted(async () => {
  await getConversations();

  // Add resize event listener
  window.addEventListener("resize", handleResize);

  // If a conversation exists in localStorage, auto-select it
  if (!isMobile.value && chatStore.conversation) {
    await selectChat(chatStore.conversation);
  }

  // Initial scroll to bottom
  scrollToBottom();
});

onUnmounted(() => {
  // Remove resize event listener
  window.removeEventListener("resize", handleResize);
});
</script>
