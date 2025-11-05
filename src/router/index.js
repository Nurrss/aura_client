import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Tasks from '../views/Tasks.vue'
import Habits from '../views/Habits.vue'
import Calendar from '../views/Calendar.vue'
import Pomodoro from '../views/Pomodoro.vue'
import Reports from '../views/Reports.vue'
import Settings from '../views/Settings.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/dashboard', redirect: { name: 'dashboard' } },
    { path: '/tasks', name: 'tasks', component: Tasks },
    { path: '/habits', name: 'habits', component: Habits },
    { path: '/calendar', name: 'calendar', component: Calendar },
    { path: '/pomodoro', name: 'pomodoro', component: Pomodoro },
    { path: '/reports', name: 'reports', component: Reports },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/login', name: 'login', component: Login },
    { path: '/register', name: 'register', component: Register },
  ],
})

export default router
