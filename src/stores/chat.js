// src/stores/chat.js
import { defineStore } from "pinia";
import { getConversations, getMessages, sendMessage } from "@/api/chat";

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
  }),
  getters: {
    conversationData: (state) => state.conversation,
    messagesList: (state) => state.messages,
  },
  actions: {
    async getConversations(filter) {
      this.loading.list = true;
      try {
        const res = await getConversations(filter);
        if (res.status == 200) {
          this.conversations = res.conversations;
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
          this.messages.push(res.messages);
        }
        return res;
      } finally {
        this.messageLoading.list = false;
      }
    },
  },
});
