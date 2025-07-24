<template>
  <div class="custom-container">
    <!-- Sidebar -->
    <div class="sidebar" :class="{ 'mobile-hidden': isMobileChatOpen }">
      <div class="sidebar-header">
        <div class="profile-pic">ME</div>
        <div class="header-icons">
          <fa icon="fa-ellipsis-v" />
        </div>
      </div>

      <div class="search-bar">
        <input
          type="text"
          class="search-input"
          placeholder="Search or start new chat"
          v-model="searchQuery"
          @input="handleSearch"
        />
        <fa icon="fa-magnifying-glass" />
      </div>

      <div class="chat-list">
        <div
          v-for="chat in filteredChats"
          :key="chat.id"
          class="chat-item"
          :class="{ active: activeChat?.id === chat.id }"
          @click="selectChat(chat)"
        >
          <div class="chat-avatar" :style="{ background: chat.color }">
            {{ chat.avatar }}
          </div>
          <div class="chat-info">
            <div class="chat-name">{{ chat.name }}</div>
            <div class="chat-last-message">{{ chat.lastMessage }}</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">{{ chat.time }}</div>
            <div v-if="chat.unreadCount" class="unread-count">
              {{ chat.unreadCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div
      class="chat-area"
      :class="{
        'mobile-active': isMobileChatOpen,
        'desktop-active': activeChat && !isMobile,
      }"
    >
      <div v-if="activeChat" class="chat-header">
        <fa
          icon="fa-arrow-left"
          @click="closeMobileChat"
          v-if="isMobile"
          class="back-button"
        ></fa>
        <div
          class="chat-avatar"
          :style="{ background: activeChat.color, position: 'relative' }"
        >
          {{ activeChat.avatar }}
          <div class="online-indicator"></div>
        </div>
        <div class="chat-header-info">
          <div class="chat-header-name">{{ activeChat.name }}</div>
          <div class="chat-header-status">
            {{ activeChat.status || "online" }}
          </div>
        </div>
        <div class="chat-header-actions">
          <fa icon="fas fa-ellipsis-v" @click="handleChatMenu" />
        </div>
      </div>

      <div class="messages-area" ref="messagesArea" v-if="activeChat">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="{ sent: message.sent, received: !message.sent }"
        >
          <div class="message-bubble">
            <div class="message-text">{{ message.text }}</div>
            <div class="message-time">
              {{ message.time }}
              <span v-if="message.sent" class="message-status">
                <fa
                  :icon="
                    message.status === 'read' ? 'fa-check-double' : 'fa-check'
                  "
                  :style="{
                    color: message.status === 'read' ? '#53bdeb' : '#8696a0',
                  }"
                />
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

      <div class="input-area" v-if="activeChat">
        <div class="input-actions">
          <fa icon="fa-plus" @click="handleAttachment" />
        </div>
        <textarea
          ref="messageInput"
          class="message-input"
          placeholder="Type a message"
          rows="1"
          v-model="currentMessage"
          @input="handleInputResize"
          @keypress="handleKeyPress"
        ></textarea>
        <button class="send-button" @click="sendMessage">
          <fa icon="fas fa-paper-plane" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";

// Reactive state
const searchQuery = ref("");
const currentMessage = ref("");
const messageInput = ref(null);
const messagesArea = ref(null);

// Responsive state
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

// Chat state
const activeChat = ref(null);
const isMobileChatOpen = ref(false);

// Typing state
const isTyping = ref(false);
const typingUser = ref("");

// Sample chats data
const chats = ref([
  {
    id: 1,
    name: "John Smith",
    avatar: "JS",
    color: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
    lastMessage: "Hey! How are you doing today?",
    time: "2:30 PM",
    unreadCount: 3,
    status: "online",
  },
  {
    id: 2,
    name: "Emma Johnson",
    avatar: "EJ",
    color: "linear-gradient(135deg, #74b9ff, #0984e3)",
    lastMessage: "Perfect! See you tomorrow at 9 AM",
    time: "1:45 PM",
    unreadCount: 0,
    status: "online",
  },
  {
    id: 3,
    name: "Sarah Wilson",
    avatar: "SW",
    color: "linear-gradient(135deg, #fd79a8, #e84393)",
    lastMessage: "Thanks for sharing those photos!",
    time: "12:20 PM",
    unreadCount: 0,
    status: "last seen recently",
  },
  {
    id: 4,
    name: "Mike Davis",
    avatar: "MD",
    color: "linear-gradient(135deg, #55a3ff, #3742fa)",
    lastMessage: "Can we reschedule our meeting?",
    time: "11:15 AM",
    unreadCount: 1,
    status: "online",
  },
  {
    id: 5,
    name: "Anna Brown",
    avatar: "AB",
    color: "linear-gradient(135deg, #fd7474, #ff3838)",
    lastMessage: "Great job on the presentation! 👏",
    time: "Yesterday",
    unreadCount: 0,
    status: "last seen yesterday",
  },
  {
    id: 6,
    name: "Team Group",
    avatar: "TG",
    color: "linear-gradient(135deg, #00b894, #00a085)",
    lastMessage: "Mike: Don't forget about the deadline",
    time: "Yesterday",
    unreadCount: 0,
    status: "group",
  },
]);

// Sample messages data
const messages = ref([
  {
    id: 1,
    text: "Hey! How are you doing today?",
    sent: false,
    time: "2:25 PM",
    status: "delivered",
  },
  {
    id: 2,
    text: "I was thinking we could grab coffee later if you're free",
    sent: false,
    time: "2:26 PM",
    status: "delivered",
  },
  {
    id: 3,
    text: "Hi John! I'm doing great, thanks for asking 😊",
    sent: true,
    time: "2:28 PM",
    status: "read",
  },
  {
    id: 4,
    text: "Coffee sounds perfect! What time works for you?",
    sent: true,
    time: "2:29 PM",
    status: "read",
  },
]);

// Computed properties
const filteredChats = computed(() => {
  if (!searchQuery.value) {
    return chats.value;
  }
  return chats.value.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Watch for mobile state changes
watch(isMobile, (newIsMobile) => {
  if (!newIsMobile) {
    // Switching to desktop - close mobile chat and select first chat if none selected
    isMobileChatOpen.value = false;
    if (!activeChat.value && chats.value.length > 0) {
      activeChat.value = chats.value[0];
    }
  } else {
    // Switching to mobile - close chat view
    isMobileChatOpen.value = false;
  }
});

// Methods
const selectChat = (chat) => {
  activeChat.value = chat;

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

  const newMessage = {
    id: messages.value.length + 1,
    text: currentMessage.value,
    sent: true,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "sent",
  };

  messages.value.push(newMessage);
  currentMessage.value = "";

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

// Lifecycle hooks
onMounted(() => {
  // Add resize event listener
  window.addEventListener("resize", handleResize);

  // Set initial active chat on desktop
  if (!isMobile.value && chats.value.length > 0) {
    activeChat.value = chats.value[0];
  }

  // Initial scroll to bottom
  scrollToBottom();
});

onUnmounted(() => {
  // Remove resize event listener
  window.removeEventListener("resize", handleResize);
});
</script>
