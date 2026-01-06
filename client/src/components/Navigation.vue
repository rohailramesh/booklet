<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const appTitle = ref('BOOKLET')
const navbarCollapsed = ref(true)

// Menu items
const menuItems = ref([
  { title: 'Home', path: '/', icon: 'bi-house-door' },
  { title: 'Sign Up', path: '/signup', icon: 'bi-person-plus' },
  { title: 'Sign In', path: '/signin', icon: 'bi-box-arrow-in-right' },
  { title: 'My Books', path: '/books', icon: 'bi-book' },
  { title: 'Add Book', path: '/books/add', icon: 'bi-upc-scan' },
  { title: 'Profile', path: '/profile', icon: 'bi-person-circle' }
])

const isAuthenticated = computed(() => authStore.isAuthenticated)

const menuItemsFiltered = computed(() => {
  return menuItems.value.filter((item) => {
    if (isAuthenticated.value) {
      return !['/signin', '/signup'].includes(item.path)
    } else {
      return !['/books', '/books/add', '/profile'].includes(item.path)
    }
  })
})

const logout = async () => {
  await authStore.logout()
  router.replace({ name: 'signin' })
  navbarCollapsed.value = true
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark shadow-lg sticky-top elegant-navbar">
    <div class="container-fluid">
      <!-- Brand -->
      <router-link
        class="navbar-brand fw-bold fs-3 d-flex align-items-center"
        to="/"
        @click="navbarCollapsed = true"
      >
        <i class="bi bi-book me-2"></i>
        {{ appTitle }}
      </router-link>

      <!-- Mobile toggle -->
      <button
        class="navbar-toggler border-0"
        type="button"
        @click="navbarCollapsed = !navbarCollapsed"
        :aria-expanded="!navbarCollapsed"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Menu -->
      <div :class="['collapse', 'navbar-collapse', { show: !navbarCollapsed }]">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li v-for="item in menuItemsFiltered" :key="item.title" class="nav-item">
            <router-link
              :to="item.path"
              class="nav-link px-3 py-2 rounded-3 transition"
              active-class="active"
              @click="navbarCollapsed = true"
            >
              <i :class="['bi', item.icon, 'me-2']"></i>
              {{ item.title }}
            </router-link>
          </li>
        </ul>

        <!-- Logout (authenticated only) -->
        <ul v-if="isAuthenticated" class="navbar-nav ms-lg-auto">
          <li class="nav-item">
            <button
              class="nav-link btn btn-outline-light rounded-3 px-4 py-2 transition"
              @click="logout"
            >
              <i class="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.elegant-navbar {
  background: linear-gradient(135deg, #0d6efd 0%, #198754 100%) !important;
  backdrop-filter: blur(10px);
  padding: 0.8rem 0;
  transition: all 0.4s ease;
}

.elegant-navbar .navbar-brand {
  color: white !important;
  letter-spacing: 1px;
  transition: transform 0.3s ease;
}

.elegant-navbar .navbar-brand:hover {
  transform: scale(1.05);
}

/* Nav links */
.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
  position: relative;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.15);
}

.nav-link.active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.25);
  font-weight: 600;
}

/* Icons */
.nav-link i {
  font-size: 1.3em;
  transition: transform 0.3s ease;
}

.nav-link:hover i {
  transform: translateY(-2px);
}

/* Logout button */
.btn-outline-light {
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-outline-light:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
  transform: translateY(-2px);
}

/* Subtle glow on active/hover */
.transition {
  transition: all 0.3s ease;
}

/* Mobile improvements */
@media (max-width: 991px) {
  .navbar-collapse {
    background: rgba(13, 110, 253, 0.95);
    margin-top: 1rem;
    border-radius: 0.5rem;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  .nav-link {
    padding: 0.8rem 1rem !important;
  }
}
</style>
