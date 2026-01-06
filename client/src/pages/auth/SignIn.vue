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
    router.replace({ name: 'books' })
  } catch (err: any) {
    errorMessage.value = err?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light">
    <div class="card shadow" style="max-width: 440px; width: 100%">
      <div class="card-body p-5">
        <!-- Header -->
        <div class="text-center mb-4">
          <h2 class="h5 fw-medium">Welcome back</h2>
          <p class="text-muted mt-1">Sign in to continue</p>
        </div>

        <!-- Error -->
        <div
          v-if="errorMessage"
          class="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {{ errorMessage }}
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>

        <!-- Form -->
        <form @submit.prevent="signIn">
          <!-- Email -->
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-envelope"></i></span>
              <input
                v-model="loginData.email"
                type="email"
                class="form-control"
                id="email"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-lock"></i></span>
              <input
                v-model="loginData.password"
                :type="visible ? 'text' : 'password'"
                class="form-control"
                id="password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="visible = !visible"
                aria-label="Toggle password visibility"
              >
                <i :class="visible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Persistent login info -->
          <p class="text-muted small mt-2">
            You’ll stay signed in on this device for up to 30 days.
          </p>

          <!-- Submit -->
          <button type="submit" class="btn btn-primary w-100 mt-4" :disabled="submitDisabled">
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Sign in
          </button>
        </form>

        <!-- Footer -->
        <div class="text-center mt-4 small">
          Don’t have an account?
          <router-link to="/signup" class="text-primary text-decoration-none">Sign up</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: add subtle rounded corners */
.card {
  border-radius: 1rem;
}
</style>
