<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { useBookStore } from '@/stores/book'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const bookStore = useBookStore()
const authStore = useAuthStore()
const router = useRouter()

// Scanner state
const videoRef = ref<HTMLVideoElement | null>(null)
const manualInputRef = ref<HTMLInputElement | null>(null)
const videoDevices = ref<MediaDeviceInfo[]>([])
const selectedDeviceId = ref<string | null>(null)

const scannedCode = ref('')
const manualISBN = ref('')
const pendingISBN = ref<string | null>(null)

// Book preview (shown after lookup)
const bookTitle = ref('')
const authorName = ref('')
const coverUrl = ref('')

// UI states
const loading = ref(false)
const lookupError = ref('') // Error during book lookup
const saveError = ref('') // Error during actual save
const scanning = ref(false)
const mode = ref<'scan' | 'manual'>('scan')

const codeReader = new BrowserMultiFormatReader()
const OL_USER_AGENT = 'BOOKLET/1.0 (contact: rohailramesh@hotmail.com)'

// Helper function for all Open Library API calls
const fetchFromOpenLibrary = async (url: string) => {
  return fetch(url, {
    headers: {
      'User-Agent': OL_USER_AGENT
    }
  })
}

// --------------------- Functions ---------------------

const switchMode = (newMode: 'scan' | 'manual') => {
  mode.value = newMode
  resetForm()
  if (newMode === 'manual') nextTick(() => manualInputRef.value?.focus())
}

const isValidISBN = (value: string) => {
  const digits = value.replace(/[^0-9X]/gi, '')
  if (digits.length !== 13) return false
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10 === Number(digits[12])
}

const validateManualISBN = () => {
  const trimmed = manualISBN.value.trim()
  if (trimmed && !isValidISBN(trimmed)) {
    return 'Invalid ISBN-13 format'
  }
  return ''
}

// Automatically fetch book data when an ISBN is confirmed (scanned or manually submitted)
const lookupAndPreviewBook = async (isbn: string) => {
  pendingISBN.value = isbn
  loading.value = true
  lookupError.value = ''
  saveError.value = ''
  bookTitle.value = ''
  authorName.value = ''
  coverUrl.value = ''

  try {
    // Step 1: ISBN lookup with header
    const isbnRes = await fetchFromOpenLibrary(`https://openlibrary.org/isbn/${isbn}.json`)
    if (!isbnRes.ok) throw new Error('Book not found on Open Library')

    const isbnData = await isbnRes.json()
    bookTitle.value = isbnData.title || 'Untitled Book'

    let authorKey = null

    // Step 2: Work lookup if available
    if (isbnData.works?.[0]?.key) {
      const workKey = isbnData.works[0].key
      const workRes = await fetchFromOpenLibrary(`https://openlibrary.org${workKey}.json`)
      if (workRes.ok) {
        const workData = await workRes.json()
        if (workData.authors?.[0]?.author?.key) {
          authorKey = workData.authors[0].author.key
        }
      }
    }

    // Fallback: direct authors in ISBN data
    if (!authorKey && isbnData.authors?.[0]?.key) {
      authorKey = isbnData.authors[0].key
    }

    // Step 3: Author lookup
    if (authorKey) {
      try {
        const authorRes = await fetchFromOpenLibrary(`https://openlibrary.org${authorKey}.json`)
        if (authorRes.ok) {
          const authorData = await authorRes.json()
          authorName.value = authorData.name || 'Unknown Author'
        }
      } catch (err) {
        console.warn('Failed to fetch author:', err)
        authorName.value = 'Unknown Author'
      }
    } else {
      authorName.value = 'Unknown Author'
    }

    // Cover fetch (third-party, no User-Agent required, but safe to include)
    try {
      const coverRes = await fetch(`https://bookcover.longitood.com/bookcover/${isbn}`, {
        headers: { 'User-Agent': OL_USER_AGENT } // optional but polite
      })
      if (coverRes.ok) {
        const coverData = await coverRes.json()
        coverUrl.value = coverData.url || ''
      }
    } catch (err) {
      console.warn('Cover fetch failed:', err)
      coverUrl.value = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    }
  } catch (e: any) {
    lookupError.value = e.message || 'Could not find book details for this ISBN'
    console.error(e)
  } finally {
    loading.value = false
  }
}
// const lookupAndPreviewBook = async (isbn: string) => {
//   pendingISBN.value = isbn
//   loading.value = true
//   lookupError.value = ''
//   saveError.value = ''
//   bookTitle.value = ''
//   authorName.value = ''
//   coverUrl.value = ''

//   try {
//     const bookRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
//     if (!bookRes.ok) throw new Error('Book not found on Open Library')

//     const bookData = await bookRes.json()
//     console.log('Book data:', bookData)
//     bookTitle.value = bookData.title || 'Untitled Book'

//     if (bookData.authors?.[0]?.key) {
//       const authorRes = await fetch(`https://openlibrary.org${bookData.authors[0].key}.json`)
//       if (authorRes.ok) {
//         const authorData = await authorRes.json()
//         console.log('Author data:', authorData)
//         authorName.value = authorData.name || 'Unknown Author'
//       }
//     }

//     // Fetch cover
//     try {
//       const coverRes = await fetch(`https://bookcover.longitood.com/bookcover/${isbn}`)
//       if (coverRes.ok) {
//         const coverData = await coverRes.json()
//         coverUrl.value = coverData.url || ''
//       }
//     } catch {
//       // Cover optional — ignore errors
//     }
//   } catch (e: any) {
//     lookupError.value = e.message || 'Could not find book details for this ISBN'
//   } finally {
//     loading.value = false
//   }
// }

// User clicks "Save Book" after reviewing preview
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
      // user: authStore.user.id
    })

    // Success → go to books list
    router.push('/books')
  } catch (err: any) {
    // Handle duplicate book gracefully
    if (err.status === 409 || err.message?.toLowerCase().includes('duplicate')) {
      saveError.value = '' // clear any previous error
      lookupError.value = 'This book is already in your library!'
      // Optional: add a success-like style later in template
    } else {
      saveError.value = 'This book is already in your library!'
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
}

const submitManual = () => {
  const trimmed = manualISBN.value.trim()
  const validationError = validateManualISBN()
  if (validationError || !trimmed) return

  lookupAndPreviewBook(trimmed)
  manualISBN.value = '' // Clear input after lookup
}

const resetForm = () => {
  codeReader.reset()
  scanning.value = false
  manualISBN.value = ''
  cancelPreview()
}

const startScanning = async () => {
  scanning.value = true
  lookupError.value = ''

  let constraints: MediaStreamConstraints

  if (selectedDeviceId.value) {
    // Desktop or device with a selectable camera
    constraints = { video: { deviceId: { exact: selectedDeviceId.value } } }
  } else {
    // Mobile fallback: use rear camera
    constraints = { video: { facingMode: { exact: 'environment' } } }
  }

  try {
    await codeReader.decodeFromConstraints(constraints, videoRef.value!, async (result, err) => {
      if (result) {
        const isbn = result.getText().trim()
        if (!isValidISBN(isbn)) {
          lookupError.value = 'Invalid ISBN detected'
          return
        }

        codeReader.reset()
        scanning.value = false
        await lookupAndPreviewBook(isbn)
      }

      if (err && !(err instanceof NotFoundException)) {
        console.error('ZXing error:', err)
        lookupError.value = 'Camera error: ' + err.message
        scanning.value = false
      }
    })
  } catch (err: any) {
    console.error('Failed to start camera:', err)
    lookupError.value = 'Unable to access camera: ' + (err.message || err)
    scanning.value = false
  }
}

const stopScanning = () => {
  codeReader.reset()
  scanning.value = false
}

// ------------------ Device Setup ------------------

onMounted(async () => {
  try {
    const devices = await codeReader.listVideoInputDevices()
    videoDevices.value = devices.filter((d) => d.kind === 'videoinput')

    // Pick default: rear camera if available
    const rearCamera = videoDevices.value.find((d) => /back|rear|environment/i.test(d.label))
    selectedDeviceId.value = rearCamera?.deviceId || videoDevices.value[0]?.deviceId || null
  } catch (err) {
    console.warn('Could not list video devices:', err)
  }
})

onBeforeUnmount(() => stopScanning())
</script>

<template>
  <div class="min-vh-100 bg-light py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card shadow">
            <div class="card-body p-4 p-md-5">
              <h2 class="h4 text-center mb-4">Add a New Book</h2>

              <!-- Tabs -->
              <ul class="nav nav-pills nav-fill mb-4">
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: mode === 'scan' }"
                    @click="switchMode('scan')"
                  >
                    <i class="bi bi-upc-scan me-2"></i>Scan Barcode
                  </button>
                </li>
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: mode === 'manual' }"
                    @click="switchMode('manual')"
                  >
                    <i class="bi bi-keyboard me-2"></i>Manual Entry
                  </button>
                </li>
              </ul>

              <!-- Scan Mode -->
              <div v-if="mode === 'scan' && !pendingISBN">
                <div class="text-center mb-4">
                  <video
                    ref="videoRef"
                    class="img-fluid rounded border"
                    style="max-height: 400px; background: #000"
                    autoplay
                    playsinline
                    muted
                  ></video>
                </div>

                <div v-if="lookupError" class="alert alert-warning text-center">
                  {{ lookupError }}
                </div>

                <div class="d-grid">
                  <button
                    class="btn btn-primary btn-lg"
                    @click="startScanning"
                    :disabled="scanning"
                  >
                    <span v-if="scanning" class="spinner-border spinner-border-sm me-2"></span>
                    {{ scanning ? 'Scanning for barcode...' : 'Start Scanning' }}
                  </button>
                </div>
              </div>

              <!-- Manual Mode -->
              <div v-if="mode === 'manual' && !pendingISBN">
                <div class="mb-3">
                  <label for="manualISBN" class="form-label fw-medium">Enter ISBN-13</label>
                  <input
                    ref="manualInputRef"
                    v-model="manualISBN"
                    type="text"
                    class="form-control form-control-lg"
                    id="manualISBN"
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

              <!-- Book Preview (after successful lookup) -->
              <div v-if="pendingISBN && !loading" class="mt-4">
                <div class="p-4 bg-white border rounded shadow-sm">
                  <h5 class="mb-4 text-center text-success">
                    <i class="bi bi-check-circle me-2"></i>Book Found!
                  </h5>

                  <div class="d-flex gap-4 align-items-start mb-4">
                    <img
                      v-if="coverUrl"
                      :src="coverUrl"
                      alt="Book cover"
                      class="rounded shadow"
                      style="width: 120px; height: auto; object-fit: contain"
                    />
                    <div
                      v-else
                      class="bg-light border rounded d-flex align-items-center justify-content-center"
                      style="width: 120px; height: 180px"
                    >
                      <i class="bi bi-book fs-2 text-muted"></i>
                    </div>

                    <div class="flex-grow-1">
                      <h4 class="mb-1">{{ bookTitle }}</h4>
                      <p class="text-muted mb-1">
                        {{ authorName || 'Unknown Author' }}
                      </p>
                      <p class="small text-muted"><strong>ISBN:</strong> {{ pendingISBN }}</p>
                    </div>
                  </div>

                  <div v-if="lookupError" class="alert alert-danger">
                    {{ lookupError }}
                  </div>

                  <div v-if="saveError" class="alert alert-danger mt-3">
                    {{ saveError }}
                  </div>

                  <div class="d-flex gap-2 mt-4">
                    <button class="btn btn-success flex-fill" @click="saveBook" :disabled="loading">
                      <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                      Save to My Books
                    </button>
                    <button class="btn btn-outline-secondary" @click="cancelPreview">Cancel</button>
                  </div>
                </div>
              </div>

              <!-- Loading during lookup -->
              <div v-if="loading && pendingISBN" class="text-center py-5">
                <div
                  class="spinner-border text-primary"
                  style="width: 3rem; height: 3rem"
                  role="status"
                >
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Looking up book details...</p>
              </div>

              <!-- Back link -->
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
.nav-pills .nav-link.active {
  background-color: var(--bs-primary);
}

/* Improve video feed appearance */
video {
  background: #000;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
