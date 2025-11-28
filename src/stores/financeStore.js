import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import {
  getTransactions,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  getCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  getBudgets,
  upsertBudget as apiUpsertBudget,
  deleteBudget as apiDeleteBudget,
  getSummary as apiGetSummary,
} from '../api/finance.js'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [],
    categories: [],
    budgets: [],
    summary: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    },
  }),
  getters: {
    incomeCategories: (state) => state.categories.filter((c) => c.type === 'income'),
    expenseCategories: (state) => state.categories.filter((c) => c.type === 'expense'),
    totalIncome: (state) => {
      return state.transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    },
    totalExpense: (state) => {
      return state.transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    },
    balance: (state) => {
      const income = state.transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      const expense = state.transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      return income - expense
    },
    getCategoryById: (state) => (id) => {
      return state.categories.find((c) => c.id === id)
    },
    getBudgetByCategory: (state) => (categoryId) => {
      return state.budgets.find((b) => b.categoryId === categoryId)
    },
  },
  actions: {
    // ============ TRANSACTIONS ============
    async loadTransactions({ from, to, type, categoryId, page = 1, limit = 20 } = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await getTransactions({ from, to, type, categoryId, page, limit })
        this.transactions = response?.data || []
        this.pagination = response?.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        }
      } catch (e) {
        this.error = e.message || 'Failed to load transactions'
      } finally {
        this.loading = false
      }
    },

    async createTransaction(transaction) {
      this.error = null
      try {
        const created = await apiCreateTransaction(transaction)
        this.transactions.unshift(created)
        return created
      } catch (e) {
        this.error = e.message || 'Failed to create transaction'
        throw e
      }
    },

    async updateTransaction(id, updates) {
      this.error = null
      try {
        const updated = await apiUpdateTransaction(id, updates)
        this.transactions = this.transactions.map((t) => (t.id === id ? updated : t))
        return updated
      } catch (e) {
        this.error = e.message || 'Failed to update transaction'
        throw e
      }
    },

    async deleteTransaction(id) {
      this.error = null
      try {
        await apiDeleteTransaction(id)
        this.transactions = this.transactions.filter((t) => t.id !== id)
      } catch (e) {
        this.error = e.message || 'Failed to delete transaction'
        throw e
      }
    },

    // ============ CATEGORIES ============
    async loadCategories(type = null) {
      this.loading = true
      this.error = null
      try {
        this.categories = await getCategories(type)
      } catch (e) {
        this.error = e.message || 'Failed to load categories'
      } finally {
        this.loading = false
      }
    },

    async createCategory(category) {
      this.error = null
      try {
        const created = await apiCreateCategory(category)
        this.categories.push(created)
        return created
      } catch (e) {
        this.error = e.message || 'Failed to create category'
        throw e
      }
    },

    async updateCategory(id, updates) {
      this.error = null
      try {
        const updated = await apiUpdateCategory(id, updates)
        this.categories = this.categories.map((c) => (c.id === id ? updated : c))
        return updated
      } catch (e) {
        this.error = e.message || 'Failed to update category'
        throw e
      }
    },

    async deleteCategory(id) {
      this.error = null
      try {
        await apiDeleteCategory(id)
        this.categories = this.categories.filter((c) => c.id !== id)
      } catch (e) {
        this.error = e.message || 'Failed to delete category'
        throw e
      }
    },

    // ============ BUDGETS ============
    async loadBudgets() {
      this.loading = true
      this.error = null
      try {
        this.budgets = await getBudgets()
      } catch (e) {
        this.error = e.message || 'Failed to load budgets'
      } finally {
        this.loading = false
      }
    },

    async saveBudget(budget) {
      this.error = null
      try {
        const saved = await apiUpsertBudget(budget)
        const existingIndex = this.budgets.findIndex((b) => b.categoryId === saved.categoryId)
        if (existingIndex >= 0) {
          this.budgets[existingIndex] = saved
        } else {
          this.budgets.push(saved)
        }
        return saved
      } catch (e) {
        this.error = e.message || 'Failed to save budget'
        throw e
      }
    },

    async deleteBudget(id) {
      this.error = null
      try {
        await apiDeleteBudget(id)
        this.budgets = this.budgets.filter((b) => b.id !== id)
      } catch (e) {
        this.error = e.message || 'Failed to delete budget'
        throw e
      }
    },

    // ============ SUMMARY ============
    async loadSummary() {
      this.loading = true
      this.error = null
      try {
        this.summary = await apiGetSummary()
      } catch (e) {
        this.error = e.message || 'Failed to load summary'
      } finally {
        this.loading = false
      }
    },

    // ============ UTILITY ============
    clearError() {
      this.error = null
    },
  },
})
