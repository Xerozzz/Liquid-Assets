<script>
import { sendChatMessage } from '@/api/chat'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'ChatWidget',
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      isOpen: false,
      input: '',
      loading: false,
      messages: [],
    }
  },
  methods: {
    toggleOpen() {
      this.isOpen = !this.isOpen
      if (this.isOpen) this.$nextTick(() => this.scrollToBottom())
    },
    async sendMessage() {
      const text = this.input.trim()
      if (!text || this.loading) return

      this.messages.push({ role: 'user', text })
      this.input = ''
      this.loading = true
      this.$nextTick(() => this.scrollToBottom())

      try {
        const { reply } = await sendChatMessage(this.messages)
        this.messages.push({ role: 'assistant', text: reply })
      } catch (error) {
        this.messages.push({ role: 'assistant', text: `${error}`, isError: true })
        this.notification.notify({
          message: `${error}`,
          summary: 'Chat error',
          severity: 'error',
        })
      } finally {
        this.loading = false
        this.$nextTick(() => this.scrollToBottom())
      }
    },
    onEnterKey(event) {
      // Shift+Enter (or other modifiers) -> let the textarea insert a newline.
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
      // Plain Enter -> send, and stop the newline from being inserted.
      event.preventDefault()
      this.sendMessage()
    },
    scrollToBottom() {
      const el = this.$refs.messageList
      if (el) el.scrollTop = el.scrollHeight
    },
  },
}
</script>

<template>
  <div class="fixed bottom-5 right-5 z-50">
    <button
      v-if="!isOpen"
      class="rounded-full w-14 h-14 bg-blue-600 text-white shadow-lg flex items-center justify-center cursor-pointer"
      aria-label="Open chat"
      @click="toggleOpen"
    >
      <i class="pi pi-comments" style="font-size: 1.5rem"></i>
    </button>

    <div
      v-else
      class="w-[calc(100vw-2.5rem)] max-w-80 h-[28rem] max-h-[calc(100vh-6rem)] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden"
    >
      <div class="flex items-center justify-between px-3 py-2 bg-blue-600 text-white">
        <span class="font-semibold text-sm">Liquid Assets Assistant</span>
        <button class="cursor-pointer" aria-label="Close chat" @click="toggleOpen">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div ref="messageList" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        <p v-if="messages.length === 0" class="text-gray-400 text-center mt-4">
          Ask me about your cocktails, ingredients, or glassware.
        </p>
        <div
          v-for="(m, i) in messages"
          :key="i"
          :class="m.role === 'user' ? 'text-right' : 'text-left'"
        >
          <span
            class="inline-block rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap"
            :class="
              m.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
            "
          >
            {{ m.text }}
          </span>
        </div>
        <div v-if="loading" class="text-left">
          <span class="inline-block rounded-lg px-3 py-2 bg-gray-100 text-gray-400">...</span>
        </div>
      </div>

      <form class="flex border-t border-gray-200" @submit.prevent="sendMessage">
        <textarea
          v-model="input"
          rows="1"
          placeholder="Ask something..."
          class="flex-1 px-3 py-2 text-sm outline-none resize-none max-h-24"
          :disabled="loading"
          @keydown.enter="onEnterKey"
        ></textarea>
        <button
          type="submit"
          class="px-3 text-blue-600 cursor-pointer disabled:opacity-40"
          aria-label="Send"
          :disabled="loading || !input.trim()"
        >
          <i class="pi pi-send"></i>
        </button>
      </form>
    </div>
  </div>
</template>
