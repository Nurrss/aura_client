import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

export async function getHabits() {
  try {
    const res = await api.get('/api/habits')
    // Response structure: { success, data: { data: [...], pagination: {...} } }
    return res.data?.data?.data || []
  } catch (e) {
    throw formatError(e, 'Failed to load habits')
  }
}

export async function createHabit(data) {
  try {
    const res = await api.post('/api/habits', data)
    // Response structure: { success, data: {...habit} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to create habit')
  }
}

export async function updateHabit(id, data) {
  try {
    const res = await api.patch(`/api/habits/${id}`, data)
    // Response structure: { success, data: {...habit} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to update habit')
  }
}

export async function toggleHabit(id) {
  try {
    const res = await api.post(`/api/habits/${id}/toggle`)
    // Response structure: { success, data: {...habit} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to toggle habit')
  }
}

export async function deleteHabit(id) {
  try {
    const res = await api.delete(`/api/habits/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete habit')
  }
}
