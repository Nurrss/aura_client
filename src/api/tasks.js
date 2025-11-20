import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

export async function getTasks({ from, to } = {}) {
  try {
    const res = await api.get('/api/tasks', { params: { from, to } })
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to load tasks')
  }
}

export async function createTask(data) {
  try {
    const res = await api.post('/api/tasks', data)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to create task')
  }
}

export async function updateTask(id, data) {
  try {
    const res = await api.patch(`/api/tasks/${id}`, data)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to update task')
  }
}

export async function moveTask(id, startTime, endTime) {
  try {
    const res = await api.patch(`/api/tasks/${id}/move`, { startTime, endTime })
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to move task')
  }
}

export async function completeTask(id) {
  try {
    const res = await api.post(`/api/tasks/${id}/complete`)
    return res.data
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
