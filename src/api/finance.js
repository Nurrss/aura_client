import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

// ============ TRANSACTIONS ============

export async function getTransactions({ from, to, type, categoryId, page, limit } = {}) {
  try {
    const res = await api.get('/api/finance/transactions', {
      params: { from, to, type, categoryId, page, limit }
    })
    // Response structure: { success, data: { data: [...], pagination: {...} } }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to load transactions')
  }
}

export async function createTransaction(data) {
  try {
    const res = await api.post('/api/finance/transactions', data)
    // Response structure: { success, data: {...transaction} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to create transaction')
  }
}

export async function updateTransaction(id, data) {
  try {
    const res = await api.patch(`/api/finance/transactions/${id}`, data)
    // Response structure: { success, data: {...transaction} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to update transaction')
  }
}

export async function deleteTransaction(id) {
  try {
    const res = await api.delete(`/api/finance/transactions/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete transaction')
  }
}

// ============ CATEGORIES ============

export async function getCategories(type = null) {
  try {
    const res = await api.get('/api/finance/categories', {
      params: type ? { type } : {}
    })
    // Response structure: { success, data: [...] }
    return res.data?.data || []
  } catch (e) {
    throw formatError(e, 'Failed to load categories')
  }
}

export async function createCategory(data) {
  try {
    const res = await api.post('/api/finance/categories', data)
    // Response structure: { success, data: {...category} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to create category')
  }
}

export async function updateCategory(id, data) {
  try {
    const res = await api.patch(`/api/finance/categories/${id}`, data)
    // Response structure: { success, data: {...category} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to update category')
  }
}

export async function deleteCategory(id) {
  try {
    const res = await api.delete(`/api/finance/categories/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete category')
  }
}

// ============ BUDGETS ============

export async function getBudgets() {
  try {
    const res = await api.get('/api/finance/budgets')
    // Response structure: { success, data: [...] }
    return res.data?.data || []
  } catch (e) {
    throw formatError(e, 'Failed to load budgets')
  }
}

export async function upsertBudget(data) {
  try {
    const res = await api.post('/api/finance/budgets', data)
    // Response structure: { success, data: {...budget} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to save budget')
  }
}

export async function deleteBudget(id) {
  try {
    const res = await api.delete(`/api/finance/budgets/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete budget')
  }
}

// ============ SUMMARY ============

export async function getSummary() {
  try {
    const res = await api.get('/api/finance/summary')
    // Response structure: { success, data: {...summary} }
    return res.data?.data
  } catch (e) {
    throw formatError(e, 'Failed to load financial summary')
  }
}
