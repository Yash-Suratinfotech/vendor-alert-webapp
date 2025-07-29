<template>
  <div class="custom-container">
    <!-- Socket Connection Status -->
    <div v-if="!socketConnected" class="connection-status">
      <div class="alert alert-warning d-flex align-items-center">
        <fa icon="fa-wifi" class="me-2" />
        <span>Connecting to real-time chat...</span>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="sidebar" :class="{ 'mobile-hidden': isMobileChatOpen }">
      <div class="sidebar-header">
        <div data-bs-toggle="modal" data-bs-target="#profileModal">
          <div
            v-if="authStore.user.avatar_url"
            class="profile-pic text-capitalize"
          >
            <img
              :src="authStore.user.avatar_url"
              width="50"
              class="img-fluid rounded-circle"
            />
          </div>
          <div v-else class="profile-pic text-capitalize">
            {{ authStore.user.username.charAt(0) }}
          </div>
        </div>
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
          :key="chat.contactId"
          class="chat-item"
          :class="{ active: chatStore.conversation?.contactId === chat.contactId }"
          @click="selectChat(chat)"
        >
          <div
            class="chat-avatar text-capitalize"
            :style="{ background: chat.color }"
          >
            {{ chat.contactName?.charAt(0) }}
            <div v-if="chat.isOnline" class="online-indicator"></div>
          </div>
          <div class="chat-info">
            <div class="chat-name">{{ chat.contactName }}</div>
            <div class="chat-last-message">{{ chat?.lastMessage }}</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">
              {{ defaultMessageTime(chat?.lastMessageTime) }}
            </div>
            <div v-if="chat?.unreadCount" class="unread-count">
              {{ chat?.unreadCount }}
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
        'desktop-active': chatStore.conversation && !isMobile,
      }"
    >
      <div v-if="chatStore.conversation" class="chat-header">
        <fa
          icon="fa-arrow-left"
          @click="closeMobileChat"
          v-if="isMobile"
          class="back-button"
        ></fa>
        <div
          class="chat-avatar text-capitalize"
          :style="{
            background: chatStore.conversation.color,
            position: 'relative',
          }"
        >
          {{ chatStore.conversation.contactName?.charAt(0) }}
          <div v-if="isContactOnline" class="online-indicator"></div>
        </div>
        <div class="chat-header-info">
          <div class="chat-header-name">
            {{ chatStore.conversation.contactName }}
          </div>
          <div class="chat-header-status">
            {{ isContactOnline ? "online" : "offline" }}
          </div>
        </div>
        <div class="chat-header-actions">
          <fa icon="fas fa-ellipsis-v" @click="handleChatMenu" />
        </div>
      </div>

      <div
        class="messages-area"
        ref="messagesArea"
        v-if="chatStore.conversation"
      >
        <div
          v-for="m in chatStore.messagesList"
          :key="m.id"
          class="message text-white"
          :class="{
            sent: m.sender?.id == authStore.user.id,
            received: m.sender?.id != authStore.user.id,
          }"
        >
          <!-- Regular text message -->
          <div v-if="m.messageType == 'text'" class="message-bubble">
            <div class="message-text">{{ m.content }}</div>
            <div class="message-time">
              {{ defaultMessageTime(m.createdAt) }}
              <span
                v-if="m.sender?.id == authStore.user.id"
                class="message-status"
              >
                <fa
                  :icon="getMessageStatusIcon(m)"
                  :style="{ color: getMessageStatusColor(m) }"
                />
              </span>
            </div>
          </div>

          <!-- File message -->
          <div v-else-if="m.messageType == 'file'" class="message-bubble">
            <img :src="m.fileUrl" :alt="m.fileName" class="img-fluid mb-2" />
            <div class="message-text">{{ m.content || m.fileName }}</div>
            <div class="message-time">
              {{ defaultMessageTime(m.createdAt) }}
              <span
                v-if="m.sender?.id == authStore.user.id"
                class="message-status"
              >
                <fa
                  :icon="getMessageStatusIcon(m)"
                  :style="{ color: getMessageStatusColor(m) }"
                />
              </span>
            </div>
          </div>

          <!-- Order notification message with Accept/Decline buttons -->
          <div
            v-else-if="m.messageType == 'order_notification'"
            class="message-bubble order-notification"
          >
            <div v-if="m.orderData">
              <div v-if="m.orderData.name" class="my-2">
                <img
                  v-if="m.orderData.image"
                  :src="m.orderData.image"
                  :alt="m.orderData.name"
                  class="img-fluid mb-2"
                />
                <div class="message-text">
                  <span>Name</span> <span class="mx-2">:</span>
                  {{ m.orderData.name }}
                </div>
                <div class="message-text">
                  <span>SKU</span> <span class="mx-2">:</span>
                  {{ m.orderData.sku }}
                </div>
                <div class="message-text">
                  <span>Qty</span> <span class="mx-2">:</span>
                  {{ m.orderData.qty }}
                </div>
              </div>

              <!-- Accept/Decline buttons for vendors -->
              <template
                v-if="
                  authStore.user.user_type === 'vendor' &&
                  m.sender?.id !== authStore.user.id
                "
              >
                <div v-if="m.isAccept === null" class="action-buttons mb-2">
                  <button
                    @click="handleOrderResponse(m.id, 'accept', m.sender.id)"
                    class="btn btn-success btn-sm me-2"
                    :disabled="respondingToOrder === m.id"
                  >
                    <fa
                      v-if="
                        respondingToOrder === m.id &&
                        pendingResponse === 'accept'
                      "
                      icon="fa-spinner"
                      class="fa-spin me-1"
                    />
                    <fa v-else icon="fa-check" class="me-1" />
                    Accept
                  </button>
                  <button
                    @click="handleOrderResponse(m.id, 'decline', m.sender.id)"
                    class="btn btn-danger btn-sm"
                    :disabled="respondingToOrder === m.id"
                  >
                    <fa
                      v-if="
                        respondingToOrder === m.id &&
                        pendingResponse === 'decline'
                      "
                      icon="fa-spinner"
                      class="fa-spin me-1"
                    />
                    <fa v-else icon="fa-times" class="me-1" />
                    Decline
                  </button>
                </div>
                <div v-else class="icon-box">
                  <span v-if="m.isAccept" class="badge bg-success">
                    <fa icon="fa-check" />
                  </span>
                  <span v-else class="badge bg-danger">
                    <fa icon="fa-times" />
                  </span>
                </div>
              </template>

              <!-- Show response status for store owners -->
              <template
                v-else-if="
                  authStore.user.user_type === 'store_owner' &&
                  m.sender?.id === authStore.user.id
                "
              >
                <div class="icon-box">
                  <span v-if="m.isAccept === null" class="badge bg-warning">
                    <fa icon="fa-hashtag" />
                  </span>
                  <span v-else-if="m.isAccept" class="badge bg-success">
                    <fa icon="fa-check" />
                  </span>
                  <span v-else class="badge bg-danger">
                    <fa icon="fa-times" />
                  </span>
                </div>
              </template>
            </div>

            <div class="message-time">
              {{ defaultMessageTime(m.createdAt) }}
              <span
                v-if="m.sender?.id == authStore.user.id"
                class="message-status"
              >
                <fa
                  :icon="getMessageStatusIcon(m)"
                  :style="{ color: getMessageStatusColor(m) }"
                />
              </span>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
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
        <textarea
          ref="messageInput"
          class="message-input"
          placeholder="Type a message"
          rows="1"
          v-model="currentMessage"
          @input="handleInputResize"
          @keypress="handleKeyPress"
        ></textarea>
        <button
          class="send-button"
          @click="sendMessage"
          :disabled="!currentMessage.trim() || sendingMessage"
        >
          <fa v-if="sendingMessage" icon="fa-spinner" class="fa-spin" />
          <fa v-else icon="fas fa-paper-plane" />
        </button>
      </div>
    </div>
  </div>

  <!-- Chat Image Modal -->
  <div
    class="modal fade"
    id="imageModal"
    tabindex="-1"
    aria-labelledby="imageModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg image-modal">
      <div class="modal-content">
        <div class="modal-body p-0">
          <img
            src="https://cdn.shopify.com/s/files/1/0927/7544/8940/files/female-fashion-model-poses-in-city-street_f6e34363-c899-4311-997a-da99c6ffdd8f.jpg?v=1753164885"
            alt=""
            class="img-fluid"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- profile Modal -->
  <div
    class="modal fade"
    id="profileModal"
    tabindex="-1"
    aria-labelledby="profileModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered profile-modal">
      <div class="modal-content">
        <div class="modal-header border-bottom-0">
          <h6 class="modal-title">Modal title</h6>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="" class="form-label"> Email </label>
            <input
              type="email"
              class="form-control"
              placeholder="Enter your email name"
            />
          </div>
          <div class="mb-3">
            <label for="" class="form-label"> User Name </label>
            <input
              type="email"
              class="form-control"
              placeholder="Enter your user name"
            />
          </div>
          <div>
            <label for="" class="form-label"> Phone Number </label>
            <input
              type="email"
              class="form-control"
              placeholder="Enter mobile number"
            />
          </div>
        </div>
        <div class="modal-footer gap-2 border-top-0">
          <button
            type="button"
            class="btn m-0 btn-secondary"
            data-bs-dismiss="modal"
          >
            Close
          </button>
          <button type="button" class="btn m-0 btn-primary">Submit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";

import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";
import { useLayoutStore } from "@/stores/layout";
import {
  defaultMessageTime,
  defaultFormatDate,
} from "@/helpers/generalVariable.js";
import socketService from "@/services/socketService";
import emitter from "@/helpers/eventBus";

const authStore = useAuthStore();
const chatStore = useChatStore();
const layoutStore = useLayoutStore();

// Reactive state
const searchQuery = ref("");
const currentMessage = ref("");
const messageInput = ref(null);
const messagesArea = ref(null);

// Socket state
const socketConnected = ref(false);
const isContactOnline = ref(false);

// Responsive state
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

// Chat state
const isMobileChatOpen = ref(false);
const sendingMessage = ref(false);

// Typing state
const isTyping = ref(false);
const typingUser = ref("");

// Order response state
const respondingToOrder = ref(null);
const pendingResponse = ref(null);

// Computed properties
const filteredChats = computed(() => {
  if (!searchQuery.value) {
    return chatStore.conversations;
  }
  return chatStore.conversations.filter((chat) =>
    chat.contactName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Socket event handlers
const setupSocketListeners = () => {
  // Connection events
  emitter.on("socket_connected", () => {
    socketConnected.value = true;
    console.log("✅ Socket connected in Vue component");
  });

  emitter.on("socket_disconnected", () => {
    socketConnected.value = false;
    console.log("❌ Socket disconnected in Vue component");
  });

  emitter.on("socket_authenticated", (data) => {
    console.log(
      "✅ Socket authenticated in Vue component:",
      data.user.username
    );
  });

  // Message events
  emitter.on("new_message", (message) => {
    console.log("💬 New message received in Vue:", message);

    // Add to messages if it's for current conversation
    if (
      chatStore.conversation &&
      ((message.sender.id === chatStore.conversation.contactId &&
        message.receiver.id === authStore.user.id) ||
        (message.sender.id === authStore.user.id &&
          message.receiver.id === chatStore.conversation.contactId))
    ) {
      chatStore.messagesList.push(message);
      scrollToBottom();

      // Mark as read if it's not from current user
      if (message.sender.id !== authStore.user.id) {
        socketService.markMessageAsRead(message.id, message.sender.id);
      }
    }

    // Update conversation list
    updateConversationFromMessage(message);
  });

  emitter.on("message_delivered", (data) => {
    console.log("📨 Message delivered:", data);
    updateMessageStatus(data.messageId, "delivered");
  });

  emitter.on("message_read", (data) => {
    console.log("👁️ Message read:", data);
    updateMessageStatus(data.messageId, "read");
  });

  emitter.on("order_notification", (data) => {
    console.log("📋 Order notification received:", data);
    layoutStore.showAlert("New order notification received!", "alert-info");
  });

  emitter.on("order_response", (data) => {
    console.log("📋 Order response received:", data);

    // Update the original order message
    const messageIndex = chatStore.messagesList.findIndex(
      (m) => m.id === data.originalMessageId
    );
    if (messageIndex !== -1) {
      chatStore.messagesList[messageIndex].isAccept =
        data.response === "accept";
    }

    // Add the response message
    if (data.responseMessage) {
      chatStore.messagesList.push({
        id: data.responseMessage.id,
        content: data.responseMessage.content,
        messageType: "text",
        sender: { id: data.responseMessage.senderId },
        createdAt: data.responseMessage.createdAt,
        deliveryStatus: "sent",
      });
      scrollToBottom();
    }
  });

  emitter.on("vendor_response_notification", (data) => {
    console.log("🏪 Vendor response notification:", data);
    const responseText = data.response === "accept" ? "accepted" : "declined";
    layoutStore.showAlert(
      `Vendor ${responseText} the order!`,
      data.response === "accept" ? "alert-success" : "alert-warning"
    );
  });

  emitter.on("user_typing", (data) => {
    if (
      data.userId !== authStore.user.id &&
      chatStore.conversation?.contactId === data.userId
    ) {
      isTyping.value = data.isTyping;
      typingUser.value = data.username;

      if (data.isTyping) {
        scrollToBottom();
      }
    }
  });

  emitter.on("contact_status_changed", (data) => {
    if (chatStore.conversation?.contactId === data.userId) {
      isContactOnline.value = data.isOnline;
    }

    // Update conversation list
    const conversation = chatStore.conversations.find(
      (c) => c.contactId === data.userId
    );
    if (conversation) {
      conversation.isOnline = data.isOnline;
    }
  });
};

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Watch for mobile state changes
watch(isMobile, (newIsMobile) => {
  if (!newIsMobile) {
    isMobileChatOpen.value = false;
    if (chatStore.conversation) {
      selectChat(chatStore.conversation);
    }
  } else {
    isMobileChatOpen.value = false;
  }
});

// Methods
const selectChat = async (chat) => {
  await chatStore.setConversations(chat);
  const filter = `?userId=${authStore.user.id}&contactId=${chat.contactId}&page=1&limit=50`;
  await chatStore.getMessages(filter);

  // Update online status
  isContactOnline.value = chat.isOnline || false;

  // Join conversation via socket
  if (socketService.isSocketConnected()) {
    socketService.joinConversation(chat.contactId);
  }

  if (isMobile.value) {
    isMobileChatOpen.value = true;
  }

  chat.unreadCount = 0;

  nextTick(() => {
    scrollToBottom();
  });
};

const closeMobileChat = () => {
  if (isMobile.value) {
    isMobileChatOpen.value = false;
  }

  // Leave conversation via socket
  if (socketService.isSocketConnected() && chatStore.conversation) {
    socketService.leaveConversation(chatStore.conversation.contactId);
  }

  stopTyping();
};

const sendMessage = async () => {
  if (!currentMessage.value.trim() || sendingMessage.value) return;

  const messageContent = currentMessage.value.trim();
  currentMessage.value = "";
  sendingMessage.value = true;

  try {
    // Reset textarea height
    if (messageInput.value) {
      messageInput.value.style.height = "auto";
    }

    // Send via Socket.IO if connected, otherwise fallback to API
    if (socketService.isSocketConnected()) {
      await socketService.sendMessage(
        chatStore.conversation.contactId,
        messageContent,
        "text"
      );
    } else {
      // Fallback to API
      const payload = {
        senderId: authStore.user.id,
        receiverId: chatStore.conversation.contactId,
        content: messageContent,
        messageType: "text",
      };
      await chatStore.sendMessage(payload);
    }

    scrollToBottom();
    stopTyping();
  } catch (error) {
    console.error("❌ Error sending message:", error);
    layoutStore.showAlert("Failed to send message", "alert-danger");
    currentMessage.value = messageContent; // Restore message
  } finally {
    sendingMessage.value = false;
  }
};

const handleOrderResponse = async (messageId, response, storeOwnerId) => {
  try {
    respondingToOrder.value = messageId;
    pendingResponse.value = response;

    // Send response via Socket.IO if connected, otherwise fallback to API
    if (socketService.isSocketConnected()) {
      await socketService.sendOrderResponse(messageId, response, storeOwnerId);
    } else {
      // Fallback to API
      const payload = {
        messageId,
        vendorUserId: authStore.user.id,
        response,
        storeOwnerId,
      };

      const res = await fetch("/chat/vendor-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to send response");
      }
    }

    // Update message locally
    const messageIndex = chatStore.messagesList.findIndex(
      (m) => m.id === messageId
    );
    if (messageIndex !== -1) {
      chatStore.messagesList[messageIndex].isAccept = response === "accept";
    }

    const responseText = response === "accept" ? "accepted" : "declined";
    layoutStore.showAlert(
      `Order ${responseText} successfully!`,
      "alert-success"
    );
  } catch (error) {
    console.error("❌ Error responding to order:", error);
    layoutStore.showAlert("Failed to send response", "alert-danger");
  } finally {
    respondingToOrder.value = null;
    pendingResponse.value = null;
  }
};

const handleInputResize = () => {
  if (messageInput.value) {
    messageInput.value.style.height = "auto";
    const newHeight = Math.min(messageInput.value.scrollHeight, 120);
    messageInput.value.style.height = newHeight + "px";
  }

  // Handle typing indicator
  if (chatStore.conversation?.contactId && socketService.isSocketConnected()) {
    socketService.handleTyping(chatStore.conversation.contactId);
  }
};

const handleKeyPress = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const stopTyping = () => {
  if (chatStore.conversation?.contactId && socketService.isSocketConnected()) {
    socketService.stopTyping(chatStore.conversation.contactId);
  }
  isTyping.value = false;
  typingUser.value = "";
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
    }
  });
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

// Helper functions
const getMessageStatusIcon = (message) => {
  if (message.deliveryStatus === "read" || message.isRead) {
    return "fa-check-double";
  } else if (message.deliveryStatus === "delivered") {
    return "fa-check-double";
  } else {
    return "fa-check";
  }
};

const getMessageStatusColor = (message) => {
  if (message.deliveryStatus === "read" || message.isRead) {
    return "#53bdeb";
  } else if (message.deliveryStatus === "delivered") {
    return "#8696a0";
  } else {
    return "#8696a0";
  }
};

const updateMessageStatus = (messageId, status) => {
  const message = chatStore.messagesList.find((m) => m.id === messageId);
  if (message) {
    message.deliveryStatus = status;
    if (status === "read") {
      message.isRead = true;
    }
  }
};

const updateConversationFromMessage = (message) => {
  // Find and update the conversation in the list
  const conversation = chatStore.conversations.find(
    (c) =>
      c.contactId === message.sender.id || c.contactId === message.receiver.id
  );

  if (conversation) {
    conversation.lastMessage = message.content;
    conversation.lastMessageTime = message.createdAt;

    // Increment unread count if message is not from current user and not in current conversation
    if (
      message.sender.id !== authStore.user.id &&
      (!chatStore.conversation ||
        chatStore.conversation.contactId !== message.sender.id)
    ) {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }
  }
};

const getConversations = async () => {
  var filter = "";
  const u = authStore.user;
  filter = `?userId=${u.id}&userType=${u.user_type}`;
  await chatStore.getConversations(filter);
};

// Initialize socket connection
const initializeSocket = () => {
  if (authStore.token && authStore.user) {
    socketService.connect(authStore.token, authStore.user);
  }
};

// Lifecycle hooks
onMounted(async () => {
  await getConversations();

  // Setup socket listeners
  setupSocketListeners();

  // Initialize socket connection
  initializeSocket();

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

  // Disconnect socket
  socketService.disconnect();

  // Remove all event listeners
  emitter.off("socket_connected");
  emitter.off("socket_disconnected");
  emitter.off("socket_authenticated");
  emitter.off("new_message");
  emitter.off("message_delivered");
  emitter.off("message_read");
  emitter.off("order_notification");
  emitter.off("order_response");
  emitter.off("vendor_response_notification");
  emitter.off("user_typing");
  emitter.off("contact_status_changed");
});
</script>
