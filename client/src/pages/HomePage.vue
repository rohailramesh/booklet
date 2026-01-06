<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Floating elements count
const floatingBooks = ref(15)

// Trigger entrance animations
onMounted(() => {
  document.querySelectorAll('.stagger-fade').forEach((el, index) => {
    setTimeout(() => el.classList.add('visible'), index * 200)
  })
})
</script>

<template>
  <div class="home min-vh-100 position-relative overflow-hidden d-flex flex-column">
    <!-- Subtle Floating Books Background -->
    <div class="bg-animation position-absolute w-100 h-100 top-0 start-0 pointer-events-none">
      <div
        v-for="n in floatingBooks"
        :key="n"
        class="floating-icon"
        :style="{
          '--delay': `${n * 1.2}s`,
          '--duration': `${18 + n * 3}s`,
          '--start-x': `${Math.random() * 100}%`,
          '--end-x': `${Math.random() * 100 - 50}%`,
          '--rotate': `${(Math.random() - 0.5) * 720}deg`
        }"
      >
        <i class="bi bi-book fs-2 text-primary opacity-05"></i>
      </div>
    </div>

    <!-- Hero Section -->
    <section class="hero flex-grow-1 d-flex align-items-center py-5 position-relative">
      <div class="container position-relative z-2">
        <div class="row align-items-center justify-content-center text-center text-lg-start">
          <div class="col-lg-6">
            <h1 class="display-4 fw-bold mb-4 stagger-fade text-gradient">
              Never Forget a Book You Want
            </h1>
            <p class="lead fs-2 text-muted mb-5 stagger-fade">
              Spot a book in the shop? Scan it instantly.<br />
              Build your personal "want-to-read & owned" library in one beautiful place.
            </p>

            <div
              class="d-flex flex-column flex-sm-row gap-4 justify-content-center justify-content-lg-start stagger-fade"
            >
              <router-link
                v-if="!authStore.isAuthenticated"
                to="/signup"
                class="btn btn-primary btn-lg px-5 py-3 shadow-lg pulse-btn"
              >
                <i class="bi bi-upc-scan me-2"></i>Start Scanning Free
              </router-link>
              <router-link
                v-else
                to="/books/add"
                class="btn btn-success btn-lg px-5 py-3 shadow-lg pulse-btn"
              >
                <i class="bi bi-camera me-2"></i>Scan a Book Now
              </router-link>

              <router-link
                v-if="authStore.isAuthenticated"
                to="/books"
                class="btn btn-outline-primary btn-lg px-5 py-3"
              >
                <i class="bi bi-collection me-2"></i>My Library
              </router-link>
            </div>
          </div>

          <div class="col-lg-6 mt-5 mt-lg-0 stagger-fade text-center">
            <div class="scene position-relative d-inline-block">
              <img
                src="https://images.unsplash.com/photo-1526248283201-fafd30eb2b90?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Person scanning a book barcode with phone in a bookstore"
                class="hero-img rounded-4 shadow-2xl"
              />
              <div class="badge-float bg-success text-white position-absolute">
                Instant Scan → Saved!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-5 bg-white">
      <div class="container">
        <h2 class="h3 text-center mb-5 fw-semibold stagger-fade">
          From Bookshop to Your Library in Seconds
        </h2>
        <div class="row g-5 text-center">
          <div class="col-md-4 stagger-fade">
            <div class="step-icon mb-4"><i class="bi bi-eye fs-1 text-primary"></i></div>
            <h4>Spot a Book</h4>
            <p class="text-muted">Browsing in a bookstore and see something you love?</p>
            <img
              src="https://images.unsplash.com/photo-1765634898266-6bd03cb0fce7?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Person browsing books in bookstore with phone"
              class="img-fluid rounded-3 shadow-sm mt-3"
            />
          </div>
          <div class="col-md-4 stagger-fade">
            <div class="step-icon mb-4"><i class="bi bi-upc-scan fs-1 text-success"></i></div>
            <h4>Scan the Barcode</h4>
            <p class="text-muted">Open BOOKLET and scan — no typing needed.</p>
            <img
              src="https://images.unsplash.com/photo-1643250048998-7ffa83ae2c63?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGJvb2tzaG9wfGVufDB8MHwwfHx8Mg%3D%3D"
              alt="Scanning book with smartphone"
              class="img-fluid rounded-3 shadow-sm mt-3"
            />
          </div>
          <div class="col-md-4 stagger-fade">
            <div class="step-icon mb-4"><i class="bi bi-book fs-1 text-info"></i></div>
            <h4>Own Your Library</h4>
            <p class="text-muted">Beautiful covers, details, and your personal collection</p>
            <img
              src="https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGJvb2tzaG9wfGVufDB8MHwwfHx8Mg%3D%3D"
              alt="Cozy home library bookshelf"
              class="img-fluid rounded-3 shadow-sm mt-3"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Wave Separator -->
    <div class="wave position-relative">
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path d="M0,0 C320,80 720,100 1440,20 L1440,100 L0,100 Z" fill="#ffffff" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.home {
  background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
}

/* Floating Books */
.bg-animation {
  z-index: 1;
}
.floating-icon {
  position: absolute;
  animation: drift linear infinite;
  animation-delay: var(--delay);
  animation-duration: var(--duration);
  left: var(--start-x);
  top: -10vh;
}
@keyframes drift {
  0% {
    transform: translateY(0) rotate(0) translateX(0);
    opacity: 0;
  }
  15% {
    opacity: 0.1;
  }
  85% {
    opacity: 0.1;
  }
  100% {
    transform: translateY(120vh) rotate(var(--rotate)) translateX(var(--end-x));
    opacity: 0;
  }
}

/* Text Gradient */
.text-gradient {
  background: linear-gradient(90deg, #0d6efd, #20c997);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Stagger Fade */
.stagger-fade {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1.2s ease, transform 1.2s ease;
}
.stagger-fade.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Pulse Button */
.pulse-btn {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(13, 110, 253, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(13, 110, 253, 0);
  }
}

/* Hero Image Scene */
.scene {
  perspective: 1200px;
}
.hero-img {
  max-width: 100%;
  height: auto;
  transform: rotateY(-12deg);
  transition: transform 0.8s ease;
}
.scene:hover .hero-img {
  transform: rotateY(-4deg) scale(1.04);
}
.badge-float {
  bottom: -20px;
  right: 20px;
  padding: 0.8rem 1.4rem;
  font-size: 1rem;
  border-radius: 50px;
  animation: bounce 2.5s infinite;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Images */
img {
  transition: transform 0.3s ease;
}
img:hover {
  transform: scale(1.03);
}

/* Wave */
.wave svg {
  display: block;
  height: 100px;
  width: 100%;
}
</style>
