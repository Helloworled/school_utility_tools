import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy load components
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const ResetPassword = () => import('@/views/auth/ResetPassword.vue')
const EmailLogin = () => import('@/views/auth/EmailLogin.vue')
const Profile = () => import('@/views/auth/Profile.vue')
const CalendarView = () => import('@/views/calendar/CalendarView.vue')
const TodoList = () => import('@/views/todos/TodoList.vue')
const TodoCreate = () => import('@/views/todos/TodoCreate.vue')
const TodoEdit = () => import('@/views/todos/TodoEdit.vue')
const TodoDetail = () => import('@/views/todos/TodoDetail.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const home = () => import('@/views/HomeView.vue')
const NotificationList = () => import('@/views/notifications/NotificationList.vue')
const NotificationDetail = () => import('@/views/notifications/NotificationDetail.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: home,
    //redirect: '/login',
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPassword,
    meta: { guest: true }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPassword,
    meta: { guest: true }
  },
  {
    path: '/email-login',
    name: 'email-login',
    component: EmailLogin,
    meta: { guest: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarView,
    meta: { requiresAuth: true }
  },
  {
    path: '/todos',
    name: 'todos',
    component: TodoList,
    meta: { requiresAuth: true }
  },
  {
    path: '/todos/create',
    name: 'todo-create',
    component: TodoCreate,
    meta: { requiresAuth: true }
  },
  {
    path: '/todos/:id',
    name: 'todo-detail',
    component: TodoDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/todos/:id/edit',
    name: 'todo-edit',
    component: TodoEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: NotificationList,
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications/:id',
    name: 'notification-detail',
    component: NotificationDetail,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // Check if route is for guests only (not authenticated users)
  const isGuestRoute = to.matched.some(record => record.meta.guest)
  
  // Initialize auth state from localStorage
  if (!authStore.user && authStore.accessToken) {
    try {
      await authStore.getCurrentUser()
    } catch (error) {
      console.error('Failed to initialize auth state:', error)
      // Clear invalid tokens
      authStore.user = null
      authStore.accessToken = null
      authStore.refreshToken = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  } else if (isGuestRoute && authStore.isAuthenticated) {
    // Redirect to dashboard if already authenticated
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
