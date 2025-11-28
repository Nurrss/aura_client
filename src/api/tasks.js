import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

export async function getTasks({ from, to } = {}) {
  try {
    const res = await api.get('/api/tasks', { params: { from, to } })
    // Response structure: { success, data: { data: [...], pagination: {...} } }
    return res.data?.data?.data || []
  } catch (e) {
    throw formatError(e, 'Failed to load tasks')
  }
}

export async function createTask(data) {
  try {
    const res = await api.post('/api/tasks', data)
    // Response structure: { success, data: {...task} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to create task')
  }
}

export async function updateTask(id, data) {
  try {
    const res = await api.patch(`/api/tasks/${id}`, data)
    // Response structure: { success, data: {...task} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to update task')
  }
}

export async function moveTask(id, startTime, endTime) {
  try {
    const res = await api.patch(`/api/tasks/${id}/move`, { startTime, endTime })
    // Response structure: { success, data: {...task} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to move task')
  }
}

export async function completeTask(id) {
  try {
    const res = await api.post(`/api/tasks/${id}/complete`)
    // Response structure: { success, data: {...} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to complete task')
  }
}

export async function deleteTask(id) {
  try {
    const res = await api.delete(`/api/tasks/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete task')
  }
}
