// src/services/socketService.js
import { io } from "socket.io-client";
import emitter from "@/helpers/eventBus";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentConversationRoom = null;
    this.typingTimeout = null;
    this.currentUserId = null;
  }

  connect(token, userDetails) {
    if (this.socket && this.isConnected) {
      console.log("⚠️ Socket already connected");
      return;
    }

    this.currentUserId = userDetails.id;
    const socketUrl = import.meta.env.VITE_APP_ROOT_API.replace("/chat", "");

    this.socket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.setupEventListeners();
    this.authenticate(token, userDetails);
  }

  setupEventListeners() {
    // Connection events
    this.socket.on("connect", () => {
      console.log("🔌 Socket connected:", this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      emitter.emit("socket_connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      this.isConnected = false;
      emitter.emit("socket_disconnected", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        emitter.emit("socket_connection_failed");
      }
    });

    // Authentication events
    this.socket.on("authenticated", (data) => {
      console.log("✅ Socket authenticated:", data.user.username);
      emitter.emit("socket_authenticated", data);
    });

    this.socket.on("auth_error", (error) => {
      console.error("❌ Socket auth error:", error);
      emitter.emit("socket_auth_error", error);
    });

    // Message events
    this.socket.on("new_message", (message) => {
      console.log("💬 New message received:", message);
      emitter.emit("new_message", message);
    });

    this.socket.on("message_delivered", (data) => {
      console.log("📨 Message delivered:", data);
      emitter.emit("message_delivered", data);
    });

    this.socket.on("message_read", (data) => {
      console.log("👁️ Message read:", data);
      emitter.emit("message_read", data);
    });

    this.socket.on("messages_read", (data) => {
      console.log("👁️ Multiple messages read:", data);
      emitter.emit("messages_read", data);
    });

    this.socket.on("message_notification", (data) => {
      console.log("🔔 Message notification:", data);
      emitter.emit("message_notification", data);
    });

    // Order notification events
    this.socket.on("order_notification", (data) => {
      console.log("📋 Order notification received:", data);
      emitter.emit("order_notification", data);
    });

    this.socket.on("order_response", (data) => {
      console.log("📋 Order response received:", data);
      emitter.emit("order_response", data);
    });

    this.socket.on("vendor_response_notification", (data) => {
      console.log("🏪 Vendor response notification:", data);
      emitter.emit("vendor_response_notification", data);
    });

    // Typing events
    this.socket.on("user_typing", (data) => {
      emitter.emit("user_typing", data);
    });

    // Contact status events
    this.socket.on("contact_status_changed", (data) => {
      console.log("👤 Contact status changed:", data);
      emitter.emit("contact_status_changed", data);
    });

    // Conversation events
    this.socket.on("conversation_joined", (data) => {
      console.log("👥 Conversation joined:", data);
      this.currentConversationRoom = data.conversationRoom;
      emitter.emit("conversation_joined", data);
    });

    // Unread count events
    this.socket.on("unread_count_updated", (data) => {
      console.log("📊 Unread count updated:", data);
      emitter.emit("unread_count_updated", data);
    });

    // Error events
    this.socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      emitter.emit("socket_error", error);
    });
  }

  authenticate(token, userDetails) {
    if (!this.socket) {
      console.error("❌ Socket not initialized");
      return;
    }

    this.socket.emit("authenticate", {
      token,
      userDetails,
    });
  }

  joinConversation(contactId) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket not connected, cannot join conversation");
      return;
    }

    this.socket.emit("join_conversation", { contactId });
  }

  leaveConversation(contactId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit("leave_conversation", { contactId });
    this.currentConversationRoom = null;
  }

  sendMessage(
    receiverId,
    content,
    messageType = "text",
    fileUrl = null,
    fileName = null,
    orderData = null
  ) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket not connected, cannot send message");
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      const messageData = {
        receiverId,
        content,
        messageType,
        fileUrl,
        fileName,
        orderData,
      };

      const timeout = setTimeout(() => {
        reject(new Error("Message send timeout"));
      }, 10000);

      this.socket.emit("send_message", messageData);

      // For now, resolve immediately. In production, you might want to wait for server confirmation
      clearTimeout(timeout);
      resolve();
    });
  }

  // Fixed: Mark single message as read
  markMessageAsRead(messageId, senderId) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket not connected, cannot mark message as read");
      return;
    }

    console.log("📖 Marking message as read:", { messageId, senderId });
    this.socket.emit("mark_message_read", { messageId, senderId });
  }

  // New: Mark multiple messages as read
  markMessagesAsRead(messageIds, contactId) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket not connected, cannot mark messages as read");
      return;
    }

    console.log("📖 Marking multiple messages as read:", { messageIds, contactId });
    this.socket.emit("mark_messages_read", { messageIds, contactId });
  }

  // Auto-mark unread messages as read when joining conversation
  markConversationAsRead(contactId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    console.log("📖 Marking conversation as read for contact:", contactId);
    this.socket.emit("mark_conversation_read", { contactId });
  }

  sendOrderResponse(messageId, response, storeOwnerId) {
    if (!this.socket || !this.isConnected) {
      console.warn("⚠️ Socket not connected, cannot send order response");
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Order response timeout"));
      }, 10000);

      this.socket.emit("order_response", {
        messageId,
        response, // 'accept' or 'decline'
        storeOwnerId,
      });

      // For now, resolve immediately
      clearTimeout(timeout);
      resolve();
    });
  }

  startTyping(contactId) {
    if (!this.socket || !this.isConnected || !contactId) {
      return;
    }

    this.socket.emit("typing_start", { contactId });
  }

  stopTyping(contactId) {
    if (!this.socket || !this.isConnected || !contactId) {
      return;
    }

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.socket.emit("typing_stop", { contactId });
  }

  // Debounced typing indicator
  handleTyping(contactId) {
    if (!contactId) return;

    // Start typing if not already started
    this.startTyping(contactId);

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Stop typing after 3 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(contactId);
    }, 3000);
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentConversationRoom = null;
      this.currentUserId = null;

      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  getCurrentRoom() {
    return this.currentConversationRoom;
  }

  getCurrentUserId() {
    return this.currentUserId;
  }

  // Get socket ID for debugging
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;