<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useFinanceStore } from '../stores/financeStore.js'
import { useUiStore } from '../stores/uiStore.js'
import dayjs from 'dayjs'

const financeStore = useFinanceStore()
const uiStore = useUiStore()

const activeTab = ref('transactions')
const showTransactionModal = ref(false)
const showCategoryModal = ref(false)
const showBudgetModal = ref(false)
const showDeleteConfirm = ref(false)
const itemToDelete = ref(null)
const deleteType = ref('')
const editingTransaction = ref(null)
const editingCategory = ref(null)
const editingBudget = ref(null)

const transactionFilter = ref({
  type: '',
  categoryId: '',
  from: dayjs().startOf('month').format('YYYY-MM-DD'),
  to: dayjs().endOf('month').format('YYYY-MM-DD'),
})

const transactionForm = ref({
  type: 'expense',
  amount: '',
  date: dayjs().format('YYYY-MM-DD'),
  categoryId: '',
  note: '',
})

const categoryForm = ref({
  name: '',
  type: 'expense',
})

const budgetForm = ref({
  categoryId: '',
  monthlyLimit: '',
  alertThreshold: 80,
})

const formErrors = ref({})

onMounted(async () => {
  await Promise.all([
    financeStore.loadCategories(),
    financeStore.loadTransactions(transactionFilter.value),
    financeStore.loadBudgets(),
    financeStore.loadSummary(),
  ])
})

// Computed
const filteredTransactions = computed(() => {
  let result = financeStore.transactions
  if (transactionFilter.value.type) {
    result = result.filter((t) => t.type === transactionFilter.value.type)
  }
  if (transactionFilter.value.categoryId) {
    result = result.filter((t) => t.categoryId === parseInt(transactionFilter.value.categoryId))
  }
  return result
})

const expensesByCategory = computed(() => {
  const expenses = financeStore.transactions.filter((t) => t.type === 'expense')
  const grouped = {}
  expenses.forEach((t) => {
    const categoryId = t.categoryId
    if (!grouped[categoryId]) {
      grouped[categoryId] = {
        category: financeStore.getCategoryById(categoryId),
        total: 0,
        count: 0,
      }
    }
    grouped[categoryId].total += parseFloat(t.amount)
    grouped[categoryId].count += 1
  })
  return Object.values(grouped)
})

const budgetsWithProgress = computed(() => {
  return financeStore.budgets.map((budget) => {
    const category = financeStore.getCategoryById(budget.categoryId)
    const spent = financeStore.transactions
      .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    const percentage = (spent / budget.monthlyLimit) * 100
    return {
      ...budget,
      category,
      spent,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > budget.monthlyLimit,
      isNearLimit: percentage >= budget.alertThreshold && spent <= budget.monthlyLimit,
    }
  })
})

// Transaction methods
function openAddTransactionModal() {
  editingTransaction.value = null
  transactionForm.value = {
    type: 'expense',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    categoryId: '',
    note: '',
  }
  formErrors.value = {}
  showTransactionModal.value = true
}

function openEditTransactionModal(transaction) {
  editingTransaction.value = transaction
  transactionForm.value = {
    type: transaction.type,
    amount: transaction.amount.toString(),
    date: dayjs(transaction.date).format('YYYY-MM-DD'),
    categoryId: transaction.categoryId.toString(),
    note: transaction.note || '',
  }
  formErrors.value = {}
  showTransactionModal.value = true
}

async function saveTransaction() {
  formErrors.value = {}
  if (!transactionForm.value.amount || parseFloat(transactionForm.value.amount) <= 0) {
    formErrors.value.amount = 'Amount must be greater than 0'
    return
  }
  if (!transactionForm.value.categoryId) {
    formErrors.value.categoryId = 'Category is required'
    return
  }

  try {
    const data = {
      type: transactionForm.value.type,
      amount: parseFloat(transactionForm.value.amount),
      date: new Date(transactionForm.value.date).toISOString(),
      categoryId: parseInt(transactionForm.value.categoryId),
      note: transactionForm.value.note || null,
    }

    if (editingTransaction.value) {
      await financeStore.updateTransaction(editingTransaction.value.id, data)
      uiStore.showToast('Transaction updated successfully', 'success')
    } else {
      await financeStore.createTransaction(data)
      uiStore.showToast('Transaction created successfully', 'success')
    }
    showTransactionModal.value = false
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to save transaction', 'error')
  }
}

// Category methods
function openAddCategoryModal() {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    type: 'expense',
  }
  formErrors.value = {}
  showCategoryModal.value = true
}

function openEditCategoryModal(category) {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    type: category.type,
  }
  formErrors.value = {}
  showCategoryModal.value = true
}

async function saveCategory() {
  formErrors.value = {}
  if (!categoryForm.value.name || categoryForm.value.name.length < 2) {
    formErrors.value.name = 'Name must be at least 2 characters'
    return
  }

  try {
    if (editingCategory.value) {
      await financeStore.updateCategory(editingCategory.value.id, categoryForm.value)
      uiStore.showToast('Category updated successfully', 'success')
    } else {
      await financeStore.createCategory(categoryForm.value)
      uiStore.showToast('Category created successfully', 'success')
    }
    showCategoryModal.value = false
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to save category', 'error')
  }
}

// Budget methods
function openAddBudgetModal() {
  editingBudget.value = null
  budgetForm.value = {
    categoryId: '',
    monthlyLimit: '',
    alertThreshold: 80,
  }
  formErrors.value = {}
  showBudgetModal.value = true
}

function openEditBudgetModal(budget) {
  editingBudget.value = budget
  budgetForm.value = {
    categoryId: budget.categoryId.toString(),
    monthlyLimit: budget.monthlyLimit.toString(),
    alertThreshold: budget.alertThreshold,
  }
  formErrors.value = {}
  showBudgetModal.value = true
}

async function saveBudget() {
  formErrors.value = {}
  if (!budgetForm.value.categoryId) {
    formErrors.value.categoryId = 'Category is required'
    return
  }
  if (!budgetForm.value.monthlyLimit || parseFloat(budgetForm.value.monthlyLimit) <= 0) {
    formErrors.value.monthlyLimit = 'Monthly limit must be greater than 0'
    return
  }

  try {
    const data = {
      categoryId: parseInt(budgetForm.value.categoryId),
      monthlyLimit: parseFloat(budgetForm.value.monthlyLimit),
      alertThreshold: parseFloat(budgetForm.value.alertThreshold),
    }
    await financeStore.saveBudget(data)
    uiStore.showToast('Budget saved successfully', 'success')
    showBudgetModal.value = false
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to save budget', 'error')
  }
}

// Delete methods
function confirmDelete(item, type) {
  itemToDelete.value = item
  deleteType.value = type
  showDeleteConfirm.value = true
}

async function executeDelete() {
  try {
    if (deleteType.value === 'transaction') {
      await financeStore.deleteTransaction(itemToDelete.value.id)
      uiStore.showToast('Transaction deleted', 'success')
    } else if (deleteType.value === 'category') {
      await financeStore.deleteCategory(itemToDelete.value.id)
      uiStore.showToast('Category deleted', 'success')
    } else if (deleteType.value === 'budget') {
      await financeStore.deleteBudget(itemToDelete.value.id)
      uiStore.showToast('Budget deleted', 'success')
    }
    showDeleteConfirm.value = false
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to delete', 'error')
  }
}

// Filter methods
async function applyFilter() {
  await financeStore.loadTransactions(transactionFilter.value)
}

function getCategoryName(categoryId) {
  const category = financeStore.getCategoryById(categoryId)
  return category ? category.name : 'Unknown'
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const availableCategories = computed(() => {
  if (transactionForm.value.type === 'income') {
    return financeStore.incomeCategories
  }
  return financeStore.expenseCategories
})

const budgetCategories = computed(() => {
  return financeStore.expenseCategories
})
</script>

<template>
  <div class="finance-page">
    <div class="page-header">
      <h1>Finance Management</h1>
      <p class="text-muted">Track your income, expenses, and budgets</p>
    </div>

    <!-- Summary Cards -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card text-bg-success">
          <div class="card-body">
            <h6 class="card-title">Total Income</h6>
            <h3>{{ formatCurrency(financeStore.totalIncome) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-bg-danger">
          <div class="card-body">
            <h6 class="card-title">Total Expenses</h6>
            <h3>{{ formatCurrency(financeStore.totalExpense) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card" :class="financeStore.balance >= 0 ? 'text-bg-primary' : 'text-bg-warning'">
          <div class="card-body">
            <h6 class="card-title">Balance</h6>
            <h3>{{ formatCurrency(financeStore.balance) }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'transactions' }" @click="activeTab = 'transactions'" href="#">
          Transactions
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'" href="#">
          Categories
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'budgets' }" @click="activeTab = 'budgets'" href="#">
          Budgets
        </a>
      </li>
    </ul>

    <!-- Transactions Tab -->
    <div v-if="activeTab === 'transactions'" class="tab-content">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button class="btn btn-primary" @click="openAddTransactionModal">
          <i class="bi bi-plus-circle"></i> Add Transaction
        </button>
        <div class="d-flex gap-2">
          <select v-model="transactionFilter.type" class="form-select form-select-sm" @change="applyFilter">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select v-model="transactionFilter.categoryId" class="form-select form-select-sm" @change="applyFilter">
            <option value="">All Categories</option>
            <option v-for="cat in financeStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="6" class="text-center text-muted">No transactions found</td>
            </tr>
            <tr v-for="transaction in filteredTransactions" :key="transaction.id">
              <td>{{ dayjs(transaction.date).format('MMM DD, YYYY') }}</td>
              <td>
                <span class="badge" :class="transaction.type === 'income' ? 'bg-success' : 'bg-danger'">
                  {{ transaction.type }}
                </span>
              </td>
              <td>{{ getCategoryName(transaction.categoryId) }}</td>
              <td :class="transaction.type === 'income' ? 'text-success' : 'text-danger'">
                {{ formatCurrency(transaction.amount) }}
              </td>
              <td>{{ transaction.note || '-' }}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" @click="openEditTransactionModal(transaction)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(transaction, 'transaction')">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Categories Tab -->
    <div v-if="activeTab === 'categories'" class="tab-content">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button class="btn btn-primary" @click="openAddCategoryModal">
          <i class="bi bi-plus-circle"></i> Add Category
        </button>
      </div>

      <div class="row">
        <div class="col-md-6">
          <h5>Income Categories</h5>
          <ul class="list-group mb-4">
            <li v-if="financeStore.incomeCategories.length === 0" class="list-group-item text-muted">
              No income categories
            </li>
            <li v-for="cat in financeStore.incomeCategories" :key="cat.id" class="list-group-item d-flex justify-content-between align-items-center">
              {{ cat.name }}
              <div>
                <button class="btn btn-sm btn-outline-primary me-1" @click="openEditCategoryModal(cat)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(cat, 'category')">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </li>
          </ul>
        </div>
        <div class="col-md-6">
          <h5>Expense Categories</h5>
          <ul class="list-group">
            <li v-if="financeStore.expenseCategories.length === 0" class="list-group-item text-muted">
              No expense categories
            </li>
            <li v-for="cat in financeStore.expenseCategories" :key="cat.id" class="list-group-item d-flex justify-content-between align-items-center">
              {{ cat.name }}
              <div>
                <button class="btn btn-sm btn-outline-primary me-1" @click="openEditCategoryModal(cat)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(cat, 'category')">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Budgets Tab -->
    <div v-if="activeTab === 'budgets'" class="tab-content">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <button class="btn btn-primary" @click="openAddBudgetModal">
          <i class="bi bi-plus-circle"></i> Add Budget
        </button>
      </div>

      <div class="row">
        <div v-if="budgetsWithProgress.length === 0" class="col-12">
          <p class="text-muted">No budgets set</p>
        </div>
        <div v-for="budget in budgetsWithProgress" :key="budget.id" class="col-md-6 mb-3">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ budget.category?.name }}</h5>
              <p class="text-muted mb-2">
                {{ formatCurrency(budget.spent) }} / {{ formatCurrency(budget.monthlyLimit) }}
              </p>
              <div class="progress mb-2" style="height: 25px">
                <div
                  class="progress-bar"
                  :class="{
                    'bg-success': budget.percentage < budget.alertThreshold,
                    'bg-warning': budget.isNearLimit,
                    'bg-danger': budget.isOverBudget,
                  }"
                  :style="{ width: budget.percentage + '%' }"
                >
                  {{ Math.round(budget.percentage) }}%
                </div>
              </div>
              <div class="d-flex justify-content-between">
                <span v-if="budget.isOverBudget" class="badge bg-danger">Over Budget!</span>
                <span v-else-if="budget.isNearLimit" class="badge bg-warning">Near Limit</span>
                <span v-else class="badge bg-success">On Track</span>
                <div>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openEditBudgetModal(budget)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(budget, 'budget')">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Modal -->
    <div v-if="showTransactionModal" class="modal d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingTransaction ? 'Edit' : 'Add' }} Transaction</h5>
            <button type="button" class="btn-close" @click="showTransactionModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Type</label>
              <select v-model="transactionForm.type" class="form-select">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Amount</label>
              <input v-model="transactionForm.amount" type="number" step="0.01" class="form-control" :class="{ 'is-invalid': formErrors.amount }" />
              <div v-if="formErrors.amount" class="invalid-feedback">{{ formErrors.amount }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Date</label>
              <input v-model="transactionForm.date" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Category</label>
              <select v-model="transactionForm.categoryId" class="form-select" :class="{ 'is-invalid': formErrors.categoryId }">
                <option value="">Select category</option>
                <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
              <div v-if="formErrors.categoryId" class="invalid-feedback">{{ formErrors.categoryId }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Note (optional)</label>
              <textarea v-model="transactionForm.note" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showTransactionModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveTransaction">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showCategoryModal" class="modal d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingCategory ? 'Edit' : 'Add' }} Category</h5>
            <button type="button" class="btn-close" @click="showCategoryModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Name</label>
              <input v-model="categoryForm.name" type="text" class="form-control" :class="{ 'is-invalid': formErrors.name }" />
              <div v-if="formErrors.name" class="invalid-feedback">{{ formErrors.name }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Type</label>
              <select v-model="categoryForm.type" class="form-select">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCategoryModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveCategory">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget Modal -->
    <div v-if="showBudgetModal" class="modal d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingBudget ? 'Edit' : 'Add' }} Budget</h5>
            <button type="button" class="btn-close" @click="showBudgetModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Category</label>
              <select v-model="budgetForm.categoryId" class="form-select" :class="{ 'is-invalid': formErrors.categoryId }" :disabled="!!editingBudget">
                <option value="">Select category</option>
                <option v-for="cat in budgetCategories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
              <div v-if="formErrors.categoryId" class="invalid-feedback">{{ formErrors.categoryId }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Monthly Limit</label>
              <input v-model="budgetForm.monthlyLimit" type="number" step="0.01" class="form-control" :class="{ 'is-invalid': formErrors.monthlyLimit }" />
              <div v-if="formErrors.monthlyLimit" class="invalid-feedback">{{ formErrors.monthlyLimit }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Alert Threshold (%)</label>
              <input v-model="budgetForm.alertThreshold" type="number" min="0" max="100" class="form-control" />
              <small class="text-muted">Get alerted when spending reaches this percentage</small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showBudgetModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveBudget">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="showDeleteConfirm = false"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this {{ deleteType }}?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
            <button type="button" class="btn btn-danger" @click="executeDelete">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showTransactionModal || showCategoryModal || showBudgetModal || showDeleteConfirm" class="modal-backdrop show"></div>
  </div>
</template>

<style scoped>
.finance-page {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.tab-content {
  min-height: 400px;
}

.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-link {
  cursor: pointer;
}
</style>
