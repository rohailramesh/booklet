<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Fetch user details on mount
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
    return
  }
  await authStore.getUser()
})

// Logout handler
const logOut = async () => {
  try {
    await authStore.logout()
    router.replace({ name: 'home' })
  } catch (e) {
    console.error('Logout failed:', e)
  }
}
</script>

<template>
  <div class="min-vh-100 bg-light py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-6 col-md-8">
          <div class="card shadow">
            <div class="card-body p-5">
              <!-- Header -->
              <div class="text-center mb-5">
                <div
                  class="avatar-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                >
                  <i class="bi bi-person fs-1"></i>
                </div>
                <h2 class="h4 fw-semibold">My Profile</h2>
                <p class="text-muted">Your account information</p>
              </div>

              <!-- Loading state -->
              <div v-if="authStore.loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <!-- Profile Details -->
              <div v-else-if="authStore.userDetail" class="profile-details">
                <div class="row g-4">
                  <div class="col-12">
                    <label class="form-label text-muted small text-uppercase fw-medium"
                      >Username</label
                    >
                    <p class="fs-5 mb-0">{{ authStore.userDetail.username || '—' }}</p>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small text-uppercase fw-medium"
                      >Full Name</label
                    >
                    <p class="fs-5 mb-0">
                      {{ authStore.userDetail.first_name || '' }}
                      {{ authStore.userDetail.last_name || '' }}
                      <span
                        v-if="!authStore.userDetail.first_name && !authStore.userDetail.last_name"
                        class="text-muted"
                        >—</span
                      >
                    </p>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small text-uppercase fw-medium"
                      >Email</label
                    >
                    <p class="fs-5 mb-0">{{ authStore.userDetail.email }}</p>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small text-uppercase fw-medium"
                      >Member Since</label
                    >
                    <p class="fs-5 mb-0">
                      {{
                        new Date(authStore.userDetail.createdAt || Date.now()).toLocaleDateString(
                          undefined,
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )
                      }}
                    </p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <hr class="my-5" />

                <div class="d-grid gap-3">
                  <router-link to="/books" class="btn btn-outline-primary btn-lg">
                    <i class="bi bi-book me-2"></i>View My Books
                  </router-link>

                  <button @click="logOut" class="btn btn-outline-danger btn-lg">
                    <i class="bi bi-box-arrow-right me-2"></i>Sign Out
                  </button>
                </div>
              </div>

              <!-- Fallback if no user data -->
              <div v-else class="text-center py-5 text-muted">
                <i class="bi bi-person-x fs-1"></i>
                <p class="mt-3">Unable to load profile information.</p>
                <button @click="authStore.getUser()" class="btn btn-outline-primary">Retry</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
}

/* Subtle hover lift on card */
.card {
  border-radius: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
}
</style>
