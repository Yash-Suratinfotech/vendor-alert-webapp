// src/stores/chat.js
import { defineStore } from "pinia";
import {
  getConversations,
  getMessages,
  sendMessage,
  readMessage,
  markMessagesAsRead,
} from "@/api/chat";

const conversation = localStorage.getItem("conversation")
  ? JSON.parse(localStorage.getItem("conversation"))
  : null;

export const useChatStore = defineStore("chat", {
  state: () => ({
    conversations: [],
    conversation: conversation,
    messages: [],
    isLoading: false,
    loading: {
      list: false,
      modal: false,
      delete: false,
    },
    messageLoading: {
      list: false,
      modal: false,
      delete: false,
    },
    unreadCounts: {}, // Track unread counts per conversation
  }),
  getters: {
    conversationData: (state) => state.conversation,
    messagesList: (state) => state.messages,
    getTotalUnreadCount: (state) => {
      return Object.values(state.unreadCounts).reduce(
        (total, count) => total + count,
        0
      );
    },
    getUnreadCountForContact: (state) => (contactId) => {
      return state.unreadCounts[contactId] || 0;
    },
  },
  actions: {
    async getConversations(filter) {
      this.loading.list = true;
      try {
        const res = await getConversations(filter);
        if (res.status == 200) {
          this.conversations = res.conversations;

          // Initialize unread counts
          this.conversations.forEach((conv) => {
            this.unreadCounts[conv.contactId] = conv.unreadCount || 0;
          });
        }
        return res;
      } finally {
        this.loading.list = false;
      }
    },

    async setConversations(payload) {
      this.loading.modal = true;
      this.conversation = payload;
      localStorage.setItem("conversation", JSON.stringify(payload));

      // Reset unread count for this conversation
      if (payload && payload.contactId) {
        this.unreadCounts[payload.contactId] = 0;

        // Update conversation in list
        const convIndex = this.conversations.findIndex(
          (c) => c.contactId === payload.contactId
        );
        if (convIndex !== -1) {
          this.conversations[convIndex].unreadCount = 0;
        }
      }

      this.loading.modal = false;
    },

    async getMessages(payload) {
      this.messageLoading.list = true;
      try {
        const res = await getMessages(payload);
        if (res.status == 200) {
          this.messages = res.messages;
        }
        return res;
      } finally {
        this.messageLoading.list = false;
      }
    },

    async sendMessage(payload) {
      this.messageLoading.list = true;
      try {
        const res = await sendMessage(payload);
        if (res.status == 200) {
          this.messages.push(res.message);

          // Update conversation in list
          this.updateConversationFromMessage(res.message);
        }
        return res;
      } finally {
        this.messageLoading.list = false;
      }
    },

    // Mark single message as read
    async markMessageAsRead(messageId) {
      try {
        const res = await readMessage(messageId);
        if (res.status === 200) {
          // Update message in current messages list
          const messageIndex = this.messages.findIndex(
            (m) => m.id === messageId
          );
          if (messageIndex !== -1) {
            this.messages[messageIndex].isRead = true;
            this.messages[messageIndex].deliveryStatus = "read";
            this.messages[messageIndex].readAt = new Date().toISOString();
          }
        }
        return res;
      } catch (error) {
        console.error("❌ Error marking message as read:", error);
        throw error;
      }
    },

    // Mark multiple messages as read
    async markMultipleMessagesAsRead(messageIds, contactId) {
      try {
        const res = await markMessagesAsRead({ messageIds, contactId });
        if (res.status === 200) {
          // Update messages in current list
          messageIds.forEach((messageId) => {
            const messageIndex = this.messages.findIndex(
              (m) => m.id === messageId
            );
            if (messageIndex !== -1) {
              this.messages[messageIndex].isRead = true;
              this.messages[messageIndex].deliveryStatus = "read";
              this.messages[messageIndex].readAt = new Date().toISOString();
            }
          });

          // Reset unread count for this contact
          this.unreadCounts[contactId] = 0;

          // Update conversation in list
          const convIndex = this.conversations.findIndex(
            (c) => c.contactId === contactId
          );
          if (convIndex !== -1) {
            this.conversations[convIndex].unreadCount = 0;
          }
        }
        return res;
      } catch (error) {
        console.error("❌ Error marking messages as read:", error);
        throw error;
      }
    },

    // Update conversation from new message
    updateConversationFromMessage(message) {
      const isFromCurrentUser = message.sender.id === this.getCurrentUserId();
      const contactId = isFromCurrentUser
        ? message.receiver.id
        : message.sender.id;

      const convIndex = this.conversations.findIndex(
        (c) => c.contactId === contactId
      );
      if (convIndex !== -1) {
        // Update conversation details
        this.conversations[convIndex].lastMessage = message.content;
        this.conversations[convIndex].lastMessageTime = message.createdAt;

        // Increment unread count only if message is not from current user
        // and not in current active conversation
        if (
          !isFromCurrentUser &&
          (!this.conversation || this.conversation.contactId !== contactId)
        ) {
          const currentUnread = this.conversations[convIndex].unreadCount || 0;
          this.conversations[convIndex].unreadCount = currentUnread + 1;
          this.unreadCounts[contactId] =
            this.conversations[convIndex].unreadCount;
        }

        // Move conversation to top
        const conversation = this.conversations.splice(convIndex, 1)[0];
        this.conversations.unshift(conversation);
      }
    },

    // Add new message to current conversation
    addMessageToCurrentConversation(message) {
      if (this.conversation) {
        const isInCurrentConversation =
          (message.sender.id === this.conversation.contactId &&
            message.receiver.id === this.getCurrentUserId()) ||
          (message.sender.id === this.getCurrentUserId() &&
            message.receiver.id === this.conversation.contactId);

        if (isInCurrentConversation) {
          this.messages.push(message);

          // If message is not from current user, mark as read automatically
          if (message.sender.id !== this.getCurrentUserId()) {
            this.markMessageAsRead(message.id);
          }
        }
      }

      // Always update conversation list
      this.updateConversationFromMessage(message);
    },

    // Update message status (for socket events)
    updateMessageStatus(messageId, status) {
      const messageIndex = this.messages.findIndex((m) => m.id === messageId);
      if (messageIndex !== -1) {
        this.messages[messageIndex].deliveryStatus = status;
        if (status === "read") {
          this.messages[messageIndex].isRead = true;
          this.messages[messageIndex].readAt = new Date().toISOString();
        }
      }
    },

    // Increment unread count for contact
    incrementUnreadCount(contactId) {
      this.unreadCounts[contactId] = (this.unreadCounts[contactId] || 0) + 1;

      const convIndex = this.conversations.findIndex(
        (c) => c.contactId === contactId
      );
      if (convIndex !== -1) {
        this.conversations[convIndex].unreadCount =
          this.unreadCounts[contactId];
      }
    },

    // Reset unread count for contact
    resetUnreadCount(contactId) {
      this.unreadCounts[contactId] = 0;

      const convIndex = this.conversations.findIndex(
        (c) => c.contactId === contactId
      );
      if (convIndex !== -1) {
        this.conversations[convIndex].unreadCount = 0;
      }
    },

    // Helper method to get current user ID
    getCurrentUserId() {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.id;
    },

    // Clear conversation data
    clearConversation() {
      this.conversation = null;
      this.messages = [];
      localStorage.removeItem("conversation");
    },
  },
});
