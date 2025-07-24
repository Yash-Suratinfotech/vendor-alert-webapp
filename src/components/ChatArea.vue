<template>
  <div class="chat-area active">
    <div class="chat-header">
      <fa
        icon="fa-arrow-left"
        @click="$emit('back')"
        class="text-light back-button"
      />
      <div
        class="chat-avatar"
        :style="{ background: chat.color, position: 'relative' }"
      >
        {{ chat.avatar }}
        <div class="online-indicator"></div>
      </div>
      <div class="chat-header-info">
        <div class="chat-header-name">{{ chat.name }}</div>
        <div class="chat-header-status">online</div>
      </div>
      <div class="chat-header-actions">
        <fa icon="fa-ellipsis-v" class="text-light" />
      </div>
    </div>

    <div class="messages-area" ref="messagesArea">
      <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.type]">
        <div class="message-bubble">
          <div class="message-text">{{ msg.text }}</div>
          <div class="message-time">
            {{ msg.time }}
            <span class="message-status" v-if="msg.type === 'sent'">
              <fa icon="fa-check-double" :style="{ color: '#53bdeb' }"></fa>
            </span>
          </div>
        </div>
      </div>

      <div class="typing-indicator" v-if="typing">
        <span>{{ chat.name }} is typing</span>
        <div class="typing-dots">
          <div class="typing-dot" v-for="n in 3" :key="n"></div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-actions"><fa icon="fa-plus" class="text-light" /></div>
      <textarea
        ref="messageInput"
        class="message-input"
        placeholder="Type a message"
        v-model="inputText"
        @input="autoResize"
        @keypress.enter.prevent="sendMessage"
        rows="1"
      />
      <button class="send-button" @click="sendMessage">
        <fa icon="fa-paper-plane" class="text-light" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";

const props = defineProps(["chat"]);
const emits = defineEmits(["back"]);

const messagesArea = ref(null);
const messageInput = ref(null);
const inputText = ref("");
const typing = ref(true);

const messages = ref([
  { text: "Hey! How are you doing today?", time: "2:25 PM", type: "received" },
  {
    text: "I was thinking we could grab coffee later if you're free",
    time: "2:26 PM",
    type: "received",
  },
  {
    text: "Hi John! I'm doing great, thanks for asking 😊",
    time: "2:28 PM",
    type: "sent",
  },
  {
    text: "Coffee sounds perfect! What time works for you?",
    time: "2:29 PM",
    type: "sent",
  },
]);

function autoResize() {
  const el = messageInput.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

watch(inputText, () => {
  nextTick(() => autoResize());
});

function sendMessage() {
  const text = inputText.value.trim();
  if (!text) return;

  messages.value.push({
    text,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type: "sent",
  });

  inputText.value = "";
  nextTick(() => {
    if (messagesArea.value)
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
  });

  // Simulate read receipt update
  setTimeout(() => {
    typing.value = false;
  }, 1000);
}
</script>
