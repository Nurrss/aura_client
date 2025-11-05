import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [], // { id, type, message }
  }),
  actions: {
    showToast(toast) {
      const id = toast.id || Date.now()
      this.toasts.push({ id, type: toast.type || 'success', message: toast.message || '' })
      setTimeout(() => this.dismissToast(id), 4000)
    },
    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
