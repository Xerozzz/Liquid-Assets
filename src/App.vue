<script>
import { useNotificationStore } from './stores/notification.store'
import { useToast } from 'primevue'

export default {
  setup() {
    const toast = useToast()
    return { toast }
  },
  data() {
    return {
      notificationStore: null,
      unwatch: null,
    }
  },
  mounted() {
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
    // Clean up the watcher if needed
    if (this.unwatch) {
      this.unwatch()
    }
  },
}
</script>

<template>
  <Toast />
  <RouterView />
</template>
