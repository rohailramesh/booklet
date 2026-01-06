<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const appTitle = ref('MEVN')
const sidebar = ref(false)

const menuItems = ref([
  { title: 'Home', path: '/', icon: 'home' },
  { title: 'Sign Up', path: '/signup', icon: 'face' },
  { title: 'Sign In', path: '/signin', icon: 'lock_open' },
  { title: 'Profile', path: '/profile', icon: 'account' },
  { title: 'Books', path: '/books', icon: 'book' }
])

const isAuthenticated = computed(() => authStore.isAuthenticated)

const menuItemsFiltered = computed(() => {
  return menuItems.value.filter((item) => {
    if (isAuthenticated.value) {
      return !['/signin', '/signup'].includes(item.path)
    }
    return !['/profile', '/books'].includes(item.path)
  })
})

const logout = async () => {
  await authStore.logout()
  router.replace({ name: 'signin' })
}
</script>

<template>
  <header>
    <!-- Drawer (mobile) -->
    <v-navigation-drawer v-model="sidebar" app>
      <v-list>
        <v-list-item v-for="{ icon, title, path } in menuItemsFiltered" :key="title" :to="path">
          <v-icon>{{ icon }}</v-icon>
          <div>{{ title }}</div>
        </v-list-item>

        <!-- Logout (mobile) -->
        <v-divider v-if="isAuthenticated" />
        <v-list-item v-if="isAuthenticated" @click="logout">
          <v-icon>logout</v-icon>
          <div>Logout</div>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Top bar -->
    <v-toolbar app>
      <span class="d-flex d-sm-none">
        <v-app-bar-nav-icon @click="sidebar = !sidebar" />
      </span>

      <v-toolbar-title class="d-none d-sm-flex">
        <router-link to="/" style="cursor: pointer">
          {{ appTitle }}
        </router-link>
      </v-toolbar-title>

      <v-spacer />

      <!-- Desktop menu -->
      <v-toolbar-items class="d-none d-sm-flex">
        <v-btn flat v-for="item in menuItemsFiltered" :key="item.title" :to="item.path">
          <v-icon left>{{ item.icon }}</v-icon>
          {{ item.title }}
        </v-btn>

        <!-- Logout (desktop) -->
        <v-btn v-if="isAuthenticated" flat color="error" @click="logout">
          <v-icon left>logout</v-icon>
          Logout
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
  </header>
</template>

<style scoped>
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2em 0;
  list-style: none;
  gap: 2em;
  font-size: 2em;
}
</style>
