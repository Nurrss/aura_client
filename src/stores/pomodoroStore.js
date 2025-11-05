import { defineStore } from 'pinia'

export const usePomodoroStore = defineStore('pomodoro', {
  state: () => ({
    sessions: [], // { id, taskId, startAt, endAt, duration, completed, synced }
    queue: [], // pending API syncs
  }),
  actions: {
    recordSession(session) {
      this.sessions.push(session)
    },
    enqueueSync(item) {
      this.queue.push(item)
    },
    markSynced(sessionId) {
      const s = this.sessions.find((s) => s.id === sessionId)
      if (s) s.synced = true
      this.queue = this.queue.filter((q) => q.sessionId !== sessionId)
    },
  },
})
