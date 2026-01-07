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
    component: () => import('@/pages/book/BooksListPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/books/add',
    name: 'books-add',
    component: () => import('@/pages/book/AddBookPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // If we don't have a valid session, try to restore it via refresh token
  if (!authStore.isAuthenticated) {
    try {
      await authStore.attempt() // Calls refresh() → sets accessToken → getUser()
    } catch (error) {
      // Refresh failed → stay logged out
      authStore.reset()
    }
  }

  // Protected route
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({
      name: 'signin',
      query: { redirect: to.fullPath }
    })
  }

  // Guest-only route (e.g. login/signup)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  // All good → proceed
  return next()
})

export default router
