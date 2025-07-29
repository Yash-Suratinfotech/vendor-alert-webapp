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
        <div
          data-bs-toggle="modal"
          data-bs-target="#profileModal"
          style="cursor: pointer"
        >
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
            {{ authStore.userInitials }}
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
          :class="{
            active: chatStore.conversation?.contactId === chat.contactId,
          }"
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
            <div v-if="chat?.unreadCount > 0" class="unread-count">
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
                    <fa icon="fa-minus" />
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

  <!-- Profile Update Modal -->
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
          <h6 class="modal-title">Update Profile</h6>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <form @submit.prevent="handleProfileUpdate">
          <div class="modal-body">
            <div class="mb-3">
              <label for="profileEmail" class="form-label">Email</label>
              <input
                type="email"
                class="form-control"
                id="profileEmail"
                v-model="profileForm.email"
                readonly
                disabled
                style="background-color: #f8f9fa; cursor: not-allowed"
              />
              <small class="text-muted">Email cannot be changed</small>
            </div>
            <div class="mb-3">
              <label for="profileUsername" class="form-label">Username</label>
              <input
                type="text"
                class="form-control"
                id="profileUsername"
                v-model="profileForm.username"
                placeholder="Enter your username"
                required
              />
            </div>
            <div class="mb-3">
              <label for="profilePhone" class="form-label">Phone Number</label>
              <input
                type="tel"
                class="form-control"
                id="profilePhone"
                v-model="profileForm.phone"
                placeholder="Enter mobile number"
              />
            </div>
            <div class="mb-3">
              <label for="profileAvatar" class="form-label">Avatar URL</label>
              <input
                type="url"
                class="form-control"
                id="profileAvatar"
                v-model="profileForm.avatarUrl"
                placeholder="Enter avatar image URL"
              />
              <small class="text-muted"
                >Optional: Add a link to your profile picture</small
              >
            </div>
          </div>
          <div class="modal-footer gap-2 border-top-0">
            <button
              type="button"
              class="btn m-0 btn-secondary"
              data-bs-dismiss="modal"
              :disabled="authStore.profileUpdateLoading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn m-0 btn-primary"
              :disabled="authStore.profileUpdateLoading || !isProfileFormValid"
            >
              <span
                v-if="authStore.profileUpdateLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{
                authStore.profileUpdateLoading
                  ? "Updating..."
                  : "Update Profile"
              }}
            </button>
          </div>
        </form>
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

// Profile form state
const profileForm = ref({
  email: "",
  username: "",
  phone: "",
  avatarUrl: "",
});

// Computed properties
const filteredChats = computed(() => {
  if (!searchQuery.value) {
    return chatStore.conversations;
  }
  return chatStore.conversations.filter((chat) =>
    chat.contactName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const isProfileFormValid = computed(() => {
  return (
    profileForm.value.username && profileForm.value.username.trim().length > 0
  );
});

// Initialize profile form with user data
const initializeProfileForm = () => {
  if (authStore.user) {
    profileForm.value = {
      email: authStore.user.email || "",
      username: authStore.user.username || "",
      phone: authStore.user.phone || "",
      avatarUrl: authStore.user.avatar_url || "",
    };
  }
};

// Handle profile update
const handleProfileUpdate = async () => {
  try {
    const payload = {
      username: profileForm.value.username.trim(),
      phone: profileForm.value.phone?.trim() || null,
      avatarUrl: profileForm.value.avatarUrl?.trim() || null,
    };

    const response = await authStore.updateProfile(payload);

    if (response.status === 200) {
      layoutStore.showAlert("Profile updated successfully!", "alert-success");

      // Close modal
      const modal = document.getElementById("profileModal");
      const modalInstance = bootstrap.Modal.getInstance(modal);
      modalInstance?.hide();
    }
  } catch (error) {
    console.error("❌ Profile update error:", error);
    layoutStore.showAlert(
      "Failed to update profile. Please try again.",
      "alert-danger"
    );
  }
};

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

    // Add message to chat store
    chatStore.addMessageToCurrentConversation(message);

    // Auto-mark as read if it's in current conversation and not from current user
    if (
      chatStore.conversation &&
      message.sender.id !== authStore.user.id &&
      (message.sender.id === chatStore.conversation.contactId ||
        message.receiver.id === chatStore.conversation.contactId)
    ) {
      // Mark as read via socket
      if (socketService.isSocketConnected()) {
        socketService.markMessageAsRead(message.id, message.sender.id);
      } else {
        // Fallback to API
        chatStore.markMessageAsRead(message.id);
      }
    }

    scrollToBottom();
  });

  emitter.on("message_delivered", (data) => {
    console.log("📨 Message delivered:", data);
    chatStore.updateMessageStatus(data.messageId, "delivered");
  });

  emitter.on("message_read", (data) => {
    console.log("👁️ Message read:", data);
    chatStore.updateMessageStatus(data.messageId, "read");
  });

  emitter.on("messages_read", (data) => {
    console.log("👁️ Multiple messages read:", data);
    // Update multiple messages status
    if (data.messageIds && Array.isArray(data.messageIds)) {
      data.messageIds.forEach((messageId) => {
        chatStore.updateMessageStatus(messageId, "read");
      });
    }
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

    // Add the response message if provided
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

  emitter.on("unread_count_updated", (data) => {
    console.log("📊 Unread count updated:", data);
    if (data.contactId) {
      chatStore.unreadCounts[data.contactId] = data.count;

      // Update conversation in list
      const conversation = chatStore.conversations.find(
        (c) => c.contactId === data.contactId
      );
      if (conversation) {
        conversation.unreadCount = data.count;
      }
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

// Watch for user changes to update profile form
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      initializeProfileForm();
    }
  },
  { immediate: true, deep: true }
);

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

    // Mark conversation as read
    socketService.markConversationAsRead(chat.contactId);
  }

  if (isMobile.value) {
    isMobileChatOpen.value = true;
  }

  // Reset unread count
  chatStore.resetUnreadCount(chat.contactId);

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
      // Fallback to API - you might need to add this to your API
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

  // Initialize profile form
  initializeProfileForm();

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
  emitter.off("messages_read");
  emitter.off("order_notification");
  emitter.off("order_response");
  emitter.off("vendor_response_notification");
  emitter.off("user_typing");
  emitter.off("contact_status_changed");
  emitter.off("unread_count_updated");
});
</script>
