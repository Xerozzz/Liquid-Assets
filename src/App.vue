<script>
import { useNotificationStore } from './stores/notification.store'
import { useToast } from 'primevue'
import ChatWidget from './components/ChatWidget.vue'
import { setAuthToken } from './auth'

export default {
  components: { ChatWidget },
  setup() {
    const toast = useToast()
    return { toast }
  },
  data() {
    return {
      notificationStore: null,
      unwatch: null,
      // Auth gate. We verify on load via /api/auth-check:
      //  - Vercel: no credentials -> 401 -> show the login screen.
      //  - Docker/GCP: nginx already authed the browser, so the check passes and this
      //    stays hidden (the backend middleware is a no-op there anyway).
      checkingAuth: true,
      needsAuth: false,
      loginUser: '',
      loginPass: '',
      loginError: '',
      loginLoading: false,
    }
  },
  methods: {
    onAuthRequired() {
      this.needsAuth = true
      this.checkingAuth = false
    },
    async verifyAuth() {
      try {
        const res = await fetch('/api/auth-check')
        this.needsAuth = !res.ok
      } catch {
        // Network error — don't hard-block; let the app try and surface errors normally.
        this.needsAuth = false
      } finally {
        this.checkingAuth = false
      }
    },
    async submitLogin() {
      this.loginError = ''
      this.loginLoading = true
      setAuthToken(this.loginUser.trim(), this.loginPass)
      try {
        const res = await fetch('/api/auth-check')
        if (res.ok) {
          this.loginPass = ''
          // Reload so every view re-fetches its data with the credentials attached.
          window.location.reload()
        } else {
          this.loginError = 'Incorrect username or password.'
        }
      } catch {
        this.loginError = 'Could not reach the server — try again.'
      } finally {
        this.loginLoading = false
      }
    },
  },
  mounted() {
    window.addEventListener('auth-required', this.onAuthRequired)
    this.verifyAuth()

    // Initialize the store
    this.notificationStore = useNotificationStore()

    // Set up the watcher
    this.unwatch = this.$watch(
      () => [
        this.notificationStore.message,
        this.notificationStore.summary,
        this.notificationStore.severity,
      ],
      ([message, summary, severity]) => {
        if (message) {
          this.toast.add({
            summary: summary,
            detail: message,
            severity,
            life: 3000,
          })
          this.notificationStore.clear()
        }
      },
    )
  },
  beforeUnmount() {
    window.removeEventListener('auth-required', this.onAuthRequired)
    if (this.unwatch) {
      this.unwatch()
    }
  },
}
</script>

<template>
  <Toast />

  <!-- While verifying credentials on load -->
  <div v-if="checkingAuth" class="fixed inset-0 flex items-center justify-center bg-primary-50">
    <ProgressSpinner />
  </div>

  <!-- Login gate (shown when the API returns 401, e.g. on Vercel without credentials) -->
  <div
    v-else-if="needsAuth"
    class="fixed inset-0 z-50 flex items-center justify-center bg-primary-50 p-4"
  >
    <form class="sectionbox w-full max-w-sm flex flex-col gap-4 p-6" @submit.prevent="submitLogin">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-primary-900 tracking-tight">Liquid Assets</h1>
        <p class="text-sm text-primary-700 mt-1">Please sign in to continue</p>
      </div>
      <input
        v-model="loginUser"
        type="text"
        autocomplete="username"
        placeholder="Username"
        class="border border-primary-200 rounded-lg px-3 py-2 outline-none focus:border-primary-500"
      />
      <input
        v-model="loginPass"
        type="password"
        autocomplete="current-password"
        placeholder="Password"
        class="border border-primary-200 rounded-lg px-3 py-2 outline-none focus:border-primary-500"
      />
      <p v-if="loginError" class="text-sm text-red-600">{{ loginError }}</p>
      <button
        type="submit"
        class="nav_button mr-0 text-center disabled:opacity-60"
        :disabled="loginLoading || !loginUser || !loginPass"
      >
        {{ loginLoading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </div>

  <template v-else>
    <RouterView />
    <ChatWidget />
  </template>
</template>
