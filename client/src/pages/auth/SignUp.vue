<script setup lang="ts">
import type { IRegisterData } from '@/stores/types'
import { useAuthStore } from '@/stores/auth'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const registerData = reactive<IRegisterData>({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: ''
})
const passwordVisible = ref(false)
const passwordConfirmVisible = ref(false)
const errorMessage = ref<string>('')
const successMessage = ref<string>('')
const isRegistering = ref(false)
const showSuccess = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const submitDisable = computed(() => {
  return (
    isRegistering.value ||
    !registerData.username ||
    !registerData.email ||
    !registerData.first_name ||
    !registerData.last_name ||
    !registerData.password ||
    !registerData.password_confirm ||
    registerData.password !== registerData.password_confirm
  )
})

async function signUp() {
  errorMessage.value = ''
  successMessage.value = ''
  isRegistering.value = true

  try {
    await authStore.register(registerData)

    // Show success state
    showSuccess.value = true
    successMessage.value = `Welcome, ${registerData.first_name || registerData.username}!`

    // Auto-redirect after 4 seconds
    setTimeout(() => {
      router.replace({ name: 'signin' })
    }, 4000)
  } catch (err: any) {
    errorMessage.value = err?.message || 'Registration failed. Please try again.'
  } finally {
    isRegistering.value = false
  }
}

// Optional: Clear success if user navigates away early
watch(showSuccess, (newVal) => {
  if (!newVal) {
    successMessage.value = ''
  }
})
</script>

<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
    <div class="card shadow" style="max-width: 680px; width: 100%">
      <div class="card-body p-4 p-md-5">
        <!-- Success State -->
        <div v-if="showSuccess" class="text-center py-5">
          <div class="mb-4">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 5rem"></i>
          </div>
          <h2 class="h4 fw-semibold text-success mb-3">Account Created Successfully!</h2>
          <p class="lead text-muted mb-4">
            {{ successMessage }}
          </p>
          <p class="text-muted">You can now sign in with your credentials.</p>
          <div class="mt-4">
            <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <span class="text-muted">Redirecting to sign in page in 4 seconds...</span>
          </div>
          <div class="mt-4">
            <router-link to="/signin" class="btn btn-primary btn-lg">
              Sign In Now <i class="bi bi-arrow-right ms-2"></i>
            </router-link>
          </div>
        </div>

        <!-- Registration Form (only shown when not successful yet) -->
        <div v-else>
          <!-- Header -->
          <div class="text-center mb-4">
            <h2 class="h5 fw-medium">Create your account</h2>
            <p class="text-muted mt-1">Join BOOKLET and start scanning books</p>
          </div>

          <!-- Error -->
          <div
            v-if="errorMessage"
            class="alert alert-danger alert-dismissible fade show mb-4"
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
          <form @submit.prevent="signUp">
            <!-- Username -->
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input
                  v-model="registerData.username"
                  type="text"
                  class="form-control"
                  id="username"
                  placeholder="Choose a username"
                  required
                  :disabled="isRegistering"
                />
              </div>
            </div>

            <!-- First Name + Last Name -->
            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="first_name" class="form-label">First Name</label>
                <input
                  v-model="registerData.first_name"
                  type="text"
                  class="form-control"
                  id="first_name"
                  placeholder="First name"
                  required
                  :disabled="isRegistering"
                />
              </div>
              <div class="col-md-6">
                <label for="last_name" class="form-label">Last Name</label>
                <input
                  v-model="registerData.last_name"
                  type="text"
                  class="form-control"
                  id="last_name"
                  placeholder="Last name"
                  required
                  :disabled="isRegistering"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input
                  v-model="registerData.email"
                  type="email"
                  class="form-control"
                  id="email"
                  placeholder="Enter your email"
                  required
                  :disabled="isRegistering"
                />
              </div>
            </div>

            <!-- Password + Confirm -->
            <div class="row mb-4">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="password" class="form-label">Password</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                  <input
                    v-model="registerData.password"
                    :type="passwordVisible ? 'text' : 'password'"
                    class="form-control"
                    id="password"
                    placeholder="Create a password"
                    required
                    :disabled="isRegistering"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="passwordVisible = !passwordVisible"
                    aria-label="Toggle password visibility"
                  >
                    <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <label for="password_confirm" class="form-label">Confirm Password</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                  <input
                    v-model="registerData.password_confirm"
                    :type="passwordConfirmVisible ? 'text' : 'password'"
                    class="form-control"
                    id="password_confirm"
                    placeholder="Confirm your password"
                    required
                    :disabled="isRegistering"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="passwordConfirmVisible = !passwordConfirmVisible"
                    aria-label="Toggle password visibility"
                  >
                    <i :class="passwordConfirmVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn btn-success w-100 btn-lg" :disabled="submitDisable">
              <span
                v-if="isRegistering"
                class="spinner-border spinner-border-sm me-2"
                role="status"
              ></span>
              {{ isRegistering ? 'Creating Account...' : 'Complete Registration' }}
              <i class="bi bi-chevron-right ms-2"></i>
            </button>
          </form>

          <!-- Footer -->
          <div class="text-center mt-4 small text-muted">
            Already have an account?
            <router-link to="/signin" class="text-primary text-decoration-none">
              Sign in</router-link
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 1rem;
  max-width: 680px;
  margin: 0 auto;
}

.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.text-success {
  color: #198754 !important;
}
</style>
