<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBookStore } from '@/stores/book'

const bookStore = useBookStore()

// For delete confirmation modal
const bookToDelete = ref<any>(null) // Holds the book object we're considering deleting
const isDeleting = ref(false)

// Open confirmation modal
const confirmDelete = (book: any) => {
  bookToDelete.value = book
}

// Actually perform the delete
const performDelete = async () => {
  if (!bookToDelete.value) return

  isDeleting.value = true
  try {
    await bookStore.removeBook(bookToDelete.value._id)
    // Optionally refresh list if your store doesn't auto-update
    // await bookStore.fetchBooks()
  } catch (err) {
    console.error('Failed to delete book:', err)
  } finally {
    isDeleting.value = false
    closeModal()
  }
}

// Close modal and reset
const closeModal = () => {
  bookToDelete.value = null
}

onMounted(async () => {
  await bookStore.fetchBooks()
})
</script>

<template>
  <div class="min-vh-100 bg-light py-5">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">My Books</h1>
        <router-link to="/books/add" class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i>Add Book
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="bookStore.loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="bookStore.books.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-book display-1"></i>
        <p class="mt-3 fs-5">No books added yet.</p>
        <router-link to="/books/add" class="btn btn-outline-primary">
          <i class="bi bi-upc-scan me-2"></i>Scan or add your first book
        </router-link>
      </div>

      <!-- Books Grid -->
      <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <div v-for="book in bookStore.books" :key="book._id" class="col">
          <div class="card h-100 shadow-sm hover-shadow transition">
            <img
              v-if="book.coverUrl"
              :src="book.coverUrl"
              class="card-img-top"
              style="height: 300px; object-fit: contain"
              :alt="book.title"
            />
            <div
              v-else
              class="card-img-top bg-light d-flex align-items-center justify-content-center"
              style="height: 300px"
            >
              <i class="bi bi-book fs-1 text-muted"></i>
            </div>

            <div class="card-body d-flex flex-column">
              <h5 class="card-title mb-2">{{ book.title }}</h5>
              <p class="card-text text-muted flex-grow-1 mb-2">
                {{ book.author || 'Unknown Author' }}
              </p>
              <small class="text-muted mb-3">ISBN: {{ book.isbn }}</small>

              <button @click="confirmDelete(book)" class="btn btn-outline-danger btn-sm mt-auto">
                <i class="bi bi-trash me-1"></i>Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      class="modal fade"
      :class="{ show: bookToDelete }"
      :style="{ display: bookToDelete ? 'block' : 'none' }"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title text-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>Confirm Deletion
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              :disabled="isDeleting"
            ></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to remove this book from your library?</p>
            <div class="d-flex align-items-center gap-3 p-3 bg-light rounded">
              <img
                v-if="bookToDelete?.coverUrl"
                :src="bookToDelete.coverUrl"
                class="rounded shadow-sm"
                style="width: 60px; height: auto"
              />
              <div
                v-else
                class="bg-white border rounded d-flex align-items-center justify-content-center"
                style="width: 60px; height: 90px"
              >
                <i class="bi bi-book text-muted"></i>
              </div>
              <div>
                <strong>{{ bookToDelete?.title }}</strong
                ><br />
                <span class="text-muted small">{{ bookToDelete?.author || 'Unknown Author' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="closeModal"
              :disabled="isDeleting"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="performDelete"
              :disabled="isDeleting"
            >
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2"></span>
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="bookToDelete" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>
</template>

<style scoped>
.hover-shadow {
  transition: all 0.3s ease;
}
.hover-shadow:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12) !important;
}

/* Ensure modal is on top */
.modal {
  z-index: 1055;
}
.modal-backdrop {
  z-index: 1050;
}
</style>
