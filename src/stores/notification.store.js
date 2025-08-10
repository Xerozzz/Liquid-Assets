import { defineStore } from 'pinia'
export const useNotificationStore = defineStore('notification', {
    state: () => ({
        message: null,
        severity: null,
        summary: null,
    }),
    actions: {
        notify({ message, summary, severity = 'info' }) {
            this.message = message;
            this.severity = severity;
            this.summary = summary;
        },
        clear() {
            this.message = null;
            this.severity = null;
            this.summary = null;
        }
    }
})