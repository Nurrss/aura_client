import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

export async function startSession(taskId) {
  try {
    const res = await api.post('/api/pomodoro/start', { taskId })
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to start session')
  }
}

export async function finishSession(sessionId, duration, completed) {
  try {
    const res = await api.post(`/api/pomodoro/${sessionId}/finish`, { duration, completed })
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to finish session')
  }
}

export async function getStats(from, to) {
  try {
    const res = await api.get('/api/pomodoro/stats', { params: { from, to } })
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to load pomodoro stats')
  }
}
