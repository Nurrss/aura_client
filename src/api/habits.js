import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

export async function getHabits() {
  try {
    const res = await api.get('/api/habits')
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to load habits')
  }
}

export async function createHabit(data) {
  try {
    const res = await api.post('/api/habits', data)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to create habit')
  }
}

export async function toggleHabit(id) {
  try {
    const res = await api.post(`/api/habits/${id}/toggle`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to toggle habit')
  }
}
