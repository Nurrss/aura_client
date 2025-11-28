import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import Dashboard from '../views/Dashboard.vue'
import Tasks from '../views/Tasks.vue'
import Habits from '../views/Habits.vue'
import Calendar from '../views/Calendar.vue'
import Pomodoro from '../views/Pomodoro.vue'
import Reports from '../views/Reports.vue'
import Finance from '../views/Finance.vue'
import Settings from '../views/Settings.vue'
import Profile from '../views/Profile.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import VerifyEmail from '../views/VerifyEmail.vue'
import RoadmapDashboard from '../views/RoadmapDashboard.vue'
import RoadmapCreate from '../views/RoadmapCreate.vue'
import RoadmapDetail from '../views/RoadmapDetail.vue'
import AnalyticsDashboard from '../views/AnalyticsDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
    },
    { path: '/dashboard', redirect: { name: 'dashboard' } },
    {
      path: '/tasks',
      name: 'tasks',
      component: Tasks,
      meta: { requiresAuth: true },
    },
    {
      path: '/habits',
      name: 'habits',
      component: Habits,
      meta: { requiresAuth: true },
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: Calendar,
      meta: { requiresAuth: true },
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: Pomodoro,
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: Reports,
      meta: { requiresAuth: true },
    },
    {
      path: '/finance',
      name: 'finance',
      component: Finance,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: true },
    },
    {
      path: '/roadmap',
      name: 'roadmap',
      component: RoadmapDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/roadmap/create',
      name: 'roadmap-create',
      component: RoadmapCreate,
      meta: { requiresAuth: true },
    },
    {
      path: '/roadmap/:id',
      name: 'roadmap-detail',
      component: RoadmapDetail,
      meta: { requiresAuth: true },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { requiresGuest: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmail,
      meta: { requiresGuest: true },
    },
  ],
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const isAuthenticated = auth.isAuthenticated

  // If route requires authentication and user is not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  }
  // If route requires guest (login/register) and user is authenticated
  else if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'dashboard' })
  }
  // Otherwise, allow navigation
  else {
    next()
  }
})

export default router
