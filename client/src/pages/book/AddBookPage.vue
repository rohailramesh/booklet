<script setup lang="ts">
import { ref, watch } from 'vue'
import { StreamBarcodeReader } from '@teckel/vue-barcode-reader'
import { useBookStore } from '@/stores/book'
import { useRouter } from 'vue-router'

const bookStore = useBookStore()
const router = useRouter()

// Scanner state
const manualInputRef = ref<HTMLInputElement | null>(null)
const manualISBN = ref('')
const pendingISBN = ref<string | null>(null)
const hasScanned = ref(false)

// Book preview
const bookTitle = ref('')
const authorName = ref('')
const coverUrl = ref('')

// UI states
const loading = ref(false)
const lookupError = ref('')
const saveError = ref('')
const scannedCode = ref<string | null>(null)
const scannerLoaded = ref(false)

const mode = ref<'scan' | 'manual'>('scan')

// const OL_USER_AGENT = 'BOOKLET/1.0 (contact: rohailramesh@hotmail.com)'

// const fetchFromOpenLibrary = async (url: string) => {
//   return fetch(url, {
//     headers: { 'User-Agent': OL_USER_AGENT }
//   })
// }
const fetchFromOpenLibrary = async (url: string) => {
  return fetch(url)
}
const isValidISBN = (value: string) => {
  const digits = value.replace(/[^0-9X]/gi, '')
  if (digits.length !== 13) return false
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10 === Number(digits[12])
}

const validateManualISBN = () => {
  const trimmed = manualISBN.value?.trim()
  if (trimmed && !isValidISBN(trimmed)) return 'Invalid ISBN-13 format'
  return ''
}

const lookupAndPreviewBook = async (isbn: string) => {
  pendingISBN.value = isbn
  loading.value = true
  lookupError.value = ''
  saveError.value = ''
  bookTitle.value = ''
  authorName.value = ''
  coverUrl.value = ''

  try {
    const isbnRes = await fetchFromOpenLibrary(`https://openlibrary.org/isbn/${isbn}.json`)
    if (!isbnRes.ok) throw new Error('Book not found on Open Library')
    const isbnData = await isbnRes.json()
    bookTitle.value = isbnData.title || 'Untitled Book'

    let authorKey: string | null = null

    if (isbnData.works?.[0]?.key) {
      const workRes = await fetchFromOpenLibrary(
        `https://openlibrary.org${isbnData.works[0].key}.json`
      )
      if (workRes.ok) {
        const workData = await workRes.json()
        authorKey = workData.authors?.[0]?.author?.key || null
      }
    }

    if (!authorKey && isbnData.authors?.[0]?.key) {
      authorKey = isbnData.authors[0].key
    }

    if (authorKey) {
      try {
        const authorRes = await fetchFromOpenLibrary(`https://openlibrary.org${authorKey}.json`)
        if (authorRes.ok) {
          const authorData = await authorRes.json()
          authorName.value = authorData.name || 'Unknown Author'
        }
      } catch {
        authorName.value = 'Unknown Author'
      }
    } else {
      authorName.value = 'Unknown Author'
    }

    try {
      const coverRes = await fetch(`https://bookcover.longitood.com/bookcover/${isbn}`)
      if (coverRes.ok) {
        const { url } = await coverRes.json()
        coverUrl.value = url || ''
      }
    } catch {
      coverUrl.value = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    }
  } catch (e: any) {
    lookupError.value = e.message || 'Could not find book details'
  } finally {
    loading.value = false
  }
}

const saveBook = async () => {
  if (!pendingISBN.value || !bookTitle.value) return

  saveError.value = ''
  loading.value = true

  try {
    await bookStore.addBook({
      isbn: pendingISBN.value,
      title: bookTitle.value,
      author: authorName.value || undefined,
      coverUrl: coverUrl.value || undefined
    })
    router.push('/books')
  } catch (err: any) {
    if (err.status === 409 || err.message?.toLowerCase().includes('duplicate')) {
      lookupError.value = 'This book is already in your library!'
    } else {
      saveError.value = err.message || 'Failed to save book'
    }
  } finally {
    loading.value = false
  }
}

const cancelPreview = () => {
  pendingISBN.value = null
  bookTitle.value = ''
  authorName.value = ''
  coverUrl.value = ''
  lookupError.value = ''
  saveError.value = ''
  scannedCode.value = null
  hasScanned.value = false
}

const submitManual = () => {
  const trimmed = manualISBN.value.trim()
  if (validateManualISBN() || !trimmed) return
  lookupAndPreviewBook(trimmed)
  manualISBN.value = ''
}

// Reset scanner on error
const resetScanner = () => {
  scannedCode.value = null
  lookupError.value = ''
}

// Watch for scanned barcode and process it
watch(scannedCode, (code) => {
  if (!code || hasScanned.value) return

  const isbn = code.trim()
  if (isValidISBN(isbn)) {
    hasScanned.value = true
    lookupAndPreviewBook(isbn)
  } else {
    lookupError.value = 'Scanned code is not a valid ISBN-13'
  }
})
</script>

<template>
  <div class="min-vh-100 bg-light py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card shadow">
            <div class="card-body p-4 p-md-5">
              <h2 class="h4 text-center mb-4">Add a New Book</h2>

              <ul class="nav nav-pills nav-fill mb-4">
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: mode === 'scan' }"
                    @click="mode = 'scan'"
                  >
                    <i class="bi bi-upc-scan me-2"></i>Scan Barcode
                  </button>
                </li>
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: mode === 'manual' }"
                    @click="mode = 'manual'"
                  >
                    <i class="bi bi-keyboard me-2"></i>Manual Entry
                  </button>
                </li>
              </ul>

              <!-- Scan Mode -->
              <div v-if="mode === 'scan' && !pendingISBN">
                <div class="scanner-wrapper">
                  <StreamBarcodeReader
                    @decode="(text: string) => (scannedCode = text)"
                    @loaded="scannerLoaded = true"
                    autofocus
                  />

                  <!-- Loading overlay -->
                  <div v-if="!scannerLoaded" class="overlay loading">
                    <div class="spinner-border text-light" role="status"></div>
                    <p class="mt-2 text-light">Loading camera...</p>
                  </div>

                  <!-- Brief scanned code display -->
                  <div v-if="scannedCode && !pendingISBN && !lookupError" class="overlay result">
                    <div class="result-box">
                      Scanned: <strong>{{ scannedCode }}</strong>
                    </div>
                  </div>

                  <!-- Error overlay -->
                  <div v-if="lookupError && !loading" class="overlay error">
                    <div class="alert alert-warning mb-3">{{ lookupError }}</div>
                    <button class="btn btn-light" @click="resetScanner">Try Again</button>
                  </div>
                </div>

                <div class="text-center mt-4 text-muted small">
                  Point your camera at the barcode on the back of the book
                </div>
              </div>

              <!-- Manual Mode -->
              <div v-if="mode === 'manual' && !pendingISBN">
                <div class="mb-3">
                  <label class="form-label fw-medium">Enter ISBN-13</label>
                  <input
                    ref="manualInputRef"
                    v-model="manualISBN"
                    type="text"
                    class="form-control form-control-lg"
                    placeholder="e.g. 9780143105985"
                    @keyup.enter="submitManual"
                  />
                  <div v-if="validateManualISBN()" class="text-danger mt-2 small">
                    {{ validateManualISBN() }}
                  </div>
                </div>
                <button
                  class="btn btn-primary btn-lg w-100"
                  @click="submitManual"
                  :disabled="!!validateManualISBN() || !manualISBN.trim() || loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Lookup Book
                </button>
              </div>

              <!-- Book Preview -->
              <div v-if="pendingISBN && !loading" class="mt-4">
                <div class="p-4 bg-white border rounded shadow-sm text-center">
                  <i class="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
                  <h5 class="text-success">Book Found!</h5>

                  <div class="d-flex gap-4 align-items-start justify-content-center my-4 flex-wrap">
                    <img
                      v-if="coverUrl"
                      :src="coverUrl"
                      alt="Book cover"
                      class="rounded shadow"
                      style="width: 120px; object-fit: contain"
                    />
                    <div
                      v-else
                      class="bg-light border rounded d-flex align-items-center justify-content-center"
                      style="width: 120px; height: 180px"
                    >
                      <i class="bi bi-book fs-2 text-muted"></i>
                    </div>
                    <div class="text-start">
                      <h4>{{ bookTitle }}</h4>
                      <p class="text-muted mb-1">{{ authorName || 'Unknown Author' }}</p>
                      <p class="small text-muted"><strong>ISBN:</strong> {{ pendingISBN }}</p>
                    </div>
                  </div>

                  <div v-if="lookupError.includes('already in your library')" class="my-4">
                    <p class="text-primary fs-5">✓ This book is already in your library!</p>
                    <div class="d-flex gap-2 mt-3">
                      <router-link to="/books" class="btn btn-primary flex-fill"
                        >View Library</router-link
                      >
                      <button class="btn btn-outline-secondary" @click="cancelPreview">
                        Scan Another
                      </button>
                    </div>
                  </div>
                  <div v-else>
                    <div v-if="lookupError" class="alert alert-warning">Error looking up book</div>
                    <div v-if="saveError" class="alert alert-danger mt-3">
                      Book already exists. Please check your library!
                    </div>
                    <div class="d-flex gap-2 mt-4">
                      <button
                        class="btn btn-success flex-fill"
                        @click="saveBook"
                        :disabled="loading"
                      >
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        Save to My Books
                      </button>
                      <button class="btn btn-outline-secondary" @click="cancelPreview">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Loading during lookup -->
              <div v-if="loading && pendingISBN" class="text-center py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem"></div>
                <p class="mt-3 text-muted">Looking up book details...</p>
              </div>

              <div class="text-center mt-5">
                <router-link to="/books" class="btn btn-link text-muted">
                  ← Back to My Books
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 1rem;
}

.scanner-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.scanner-wrapper :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  color: white;
  padding: 20px;
  text-align: center;
}

.result-box {
  background: rgba(0, 0, 0, 0.8);
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 1.5rem;
  border: 3px solid limegreen;
  font-weight: bold;
}

.error .alert {
  max-width: 80%;
}
</style>
