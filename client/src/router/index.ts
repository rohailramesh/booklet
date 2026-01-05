import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('@/pages/auth/SignIn.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/pages/auth/SignUp.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/books',
    name: 'books',
    component: () => import('@/pages/BooksPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

let authChecked = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 🔑 Ensure auth is checked once (refresh token)
  if (!authChecked) {
    authChecked = true
    await authStore.attempt()
  }

  // 🔒 Protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'signin',
      query: { redirect: to.fullPath }
    }
  }

  // 🚫 Guest-only routes
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
