<script setup lang="ts">
import type { ILoginData } from '@/stores/types'
import { useAuthStore } from '@/stores/auth'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const visible = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const loginData = reactive<ILoginData>({
  email: '',
  password: ''
})

const submitDisabled = computed(() => {
  return !loginData.email || !loginData.password || loading.value
})

const signIn = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    await authStore.login(loginData)
    router.replace({ name: 'profile' })
  } catch (err: any) {
    errorMessage.value = err?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="d-flex align-center justify-center w-100 h-100">
    <v-card class="mx-auto pa-10" elevation="8" max-width="440" rounded="lg">
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-h5 font-weight-medium">Welcome back</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">Sign in to continue</p>
      </div>

      <!-- Error -->
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" density="compact">
        {{ errorMessage }}
      </v-alert>

      <!-- Email -->
      <v-text-field
        v-model="loginData.email"
        label="Email"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        variant="outlined"
        density="comfortable"
        class="mb-4"
      />

      <!-- Password -->
      <v-text-field
        v-model="loginData.password"
        label="Password"
        :type="visible ? 'text' : 'password'"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        variant="outlined"
        density="comfortable"
        @click:append-inner="visible = !visible"
      />

      <!-- Persistent login info -->
      <p class="text-caption text-medium-emphasis mt-2">
        You’ll stay signed in on this device for up to 30 days.
      </p>

      <!-- Submit -->
      <v-btn
        block
        size="large"
        color="primary"
        class="mt-6"
        :loading="loading"
        :disabled="submitDisabled"
        @click="signIn"
      >
        Sign in
      </v-btn>

      <!-- Footer -->
      <div class="text-center mt-6 text-body-2">
        Don’t have an account?
        <router-link to="/signup" class="text-primary text-decoration-none"> Sign up </router-link>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped></style>
