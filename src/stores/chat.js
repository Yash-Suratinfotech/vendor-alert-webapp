// src/stores/chat.js
import { defineStore } from "pinia";
import { getConversations, getMessages } from "@/api/chat";

export const useChatStore = defineStore("chat", {
  state: () => ({
    conversations: [],
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
  }),
  actions: {
    async getConversations() {
      this.loading.list = true;
      try {
        const res = await getConversations();
        if (res.status == 200) {
          this.conversations = res.conversations;
        }
        return res;
      } finally {
        this.loading.list = false;
      }
    },
    async getConversations() {
      this.messageLoading.list = true;
      try {
        const res = await getMessages();
        if (res.status == 200) {
          this.messages = res.messages;
        }
        return res;
      } finally {
        this.messageLoading.list = false;
      }
    },
  },
});
