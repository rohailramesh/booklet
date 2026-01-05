<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { useBookStore } from '@/stores/book'
import { useAuthStore } from '@/stores/auth'

// Pinia stores
const bookStore = useBookStore()
const authStore = useAuthStore()

// Scanner & input state
const videoRef = ref<HTMLVideoElement | null>(null)
const manualInputRef = ref<HTMLInputElement | null>(null)
const videoDevices = ref<MediaDeviceInfo[]>([])
const selectedDeviceId = ref<string | null>(null)

const scannedCode = ref('')
const manualISBN = ref('')
const pendingISBN = ref<string | null>(null)
const lastProcessedISBN = ref<string | null>(null)

// Book info
const bookTitle = ref('')
const authorName = ref('')
const coverUrl = ref('')

// UI states
const loading = ref(false)
const error = ref('')
const manualError = ref('')
const showInlineConfirm = ref(false)
const scanning = ref(false)
const mode = ref<'scan' | 'manual'>('scan')

// ZXing reader
const codeReader = new BrowserMultiFormatReader()

// -------------------------
// Functions
// -------------------------

// Switch between scan/manual
const switchMode = (newMode: 'scan' | 'manual') => {
  mode.value = newMode
  resetAll()
  if (newMode === 'manual') nextTick(() => manualInputRef.value?.focus())
}

// Validate ISBN-13
const isValidISBN = (value: string) => {
  const digits = value.replace(/[^0-9X]/gi, '')
  if (digits.length !== 13) return false
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10 === Number(digits[12])
}

// Live validation for manual input
const validateManualISBN = () => {
  manualError.value = ''
  const trimmed = manualISBN.value.trim()
  if (trimmed && !isValidISBN(trimmed)) manualError.value = 'Invalid ISBN (13 digits)'
}

// Fetch book data from OpenLibrary + cover API
const fetchBookData = async (isbn: string) => {
  loading.value = true
  error.value = ''
  bookTitle.value = ''
  authorName.value = ''
  coverUrl.value = ''

  try {
    const bookRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
    if (!bookRes.ok) throw new Error('Book not found')
    const bookData = await bookRes.json()
    bookTitle.value = bookData.title || 'Unknown title'

    const authorKey = bookData.authors?.[0]?.key
    if (authorKey) {
      const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`)
      if (authorRes.ok) {
        const authorData = await authorRes.json()
        authorName.value = authorData.name || ''
      }
    }

    // External cover API
    const coverRes = await fetch(`https://bookcover.longitood.com/bookcover/${isbn}`)
    if (coverRes.ok) {
      const coverData = await coverRes.json()
      coverUrl.value = coverData.url || ''
    }
  } catch (e: any) {
    error.value = e.message || 'Unable to fetch book info'
  } finally {
    loading.value = false
  }
}

// Confirm and save book to backend
const confirmISBN = async () => {
  if (!pendingISBN.value) return
  showInlineConfirm.value = false
  lastProcessedISBN.value = pendingISBN.value
  await fetchBookData(pendingISBN.value)

  try {
    await bookStore.addBook({
      isbn: pendingISBN.value,
      title: bookTitle.value,
      author: authorName.value,
      coverUrl: coverUrl.value,
      user: authStore.user.id
    })
    await bookStore.fetchBooks()
  } catch (err) {
    console.error(err)
    error.value = 'Failed to save book'
  }

  pendingISBN.value = null
}

// Cancel pending ISBN
const cancelISBN = () => {
  pendingISBN.value = null
  scannedCode.value = ''
  showInlineConfirm.value = false
}

// Submit manual ISBN
const submitManualISBN = () => {
  if (manualError.value || !manualISBN.value.trim()) return
  pendingISBN.value = manualISBN.value.trim()
  showInlineConfirm.value = true
}

// Start scanning with camera
const startScanning = () => {
  scanning.value = true
  codeReader.decodeFromVideoDevice(selectedDeviceId.value, videoRef.value!, (result, err) => {
    if (result) {
      const value = result.text.trim()
      scannedCode.value = value

      if (!isValidISBN(value) || showInlineConfirm.value || value === lastProcessedISBN.value)
        return

      pendingISBN.value = value
      showInlineConfirm.value = true
      codeReader.reset()
      scanning.value = false
    }

    if (err && !(err instanceof NotFoundException)) {
      console.error(err)
      error.value = 'Camera error: ' + err.message
      scanning.value = false
    }
  })
}

// Reset everything
const resetAll = () => {
  codeReader.reset()
  scanning.value = false
  scannedCode.value = ''
  manualISBN.value = ''
  pendingISBN.value = null
  lastProcessedISBN.value = null
  bookTitle.value = ''
  authorName.value = ''
  coverUrl.value = ''
  error.value = ''
  manualError.value = ''
  showInlineConfirm.value = false
}

// Load devices & books
onMounted(async () => {
  videoDevices.value = await codeReader.listVideoInputDevices()
  selectedDeviceId.value = videoDevices.value[0]?.deviceId || null
  await bookStore.fetchBooks()
  nextTick(() => {
    const tooltipList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    ;[...tooltipList].forEach((el) => new bootstrap.Tooltip(el))
  })
})

onBeforeUnmount(() => codeReader.reset())
</script>

<template>
  <div class="container">
    <h1>My Books</h1>

    <!-- Mode tabs -->
    <div>
      <button @click="switchMode('scan')" :disabled="mode === 'scan'">Scan</button>
      <button @click="switchMode('manual')" :disabled="mode === 'manual'">Manual</button>
    </div>

    <!-- SCAN MODE -->
    <div v-if="mode === 'scan'">
      <video ref="videoRef" autoplay playsinline style="width: 100%; max-width: 400px"></video>
      <button @click="startScanning" :disabled="scanning">
        {{ scanning ? 'Scanning...' : 'Start Scan' }}
      </button>
      <button @click="resetAll">Reset</button>
    </div>

    <!-- MANUAL MODE -->
    <div v-if="mode === 'manual'">
      <input
        type="text"
        placeholder="Enter ISBN"
        v-model="manualISBN"
        @input="validateManualISBN"
        ref="manualInputRef"
      />
      <div v-if="manualError" style="color: red">{{ manualError }}</div>
      <button @click="submitManualISBN" :disabled="!!manualError || !manualISBN.trim()">
        Lookup
      </button>
    </div>

    <!-- Pending ISBN confirmation -->
    <div v-if="showInlineConfirm" style="margin-top: 1rem">
      <p>Confirm ISBN: {{ pendingISBN }}</p>
      <button @click="confirmISBN">Save</button>
      <button @click="cancelISBN">Cancel</button>
    </div>

    <!-- Error & loading -->
    <p v-if="error" style="color: red">{{ error }}</p>
    <p v-if="loading">Fetching book info...</p>

    <!-- Saved books -->
    <h2>Saved Books</h2>
    <ul>
      <li
        v-for="book in bookStore.books"
        :key="book._id"
        style="display: flex; align-items: center; margin-bottom: 1rem"
      >
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          alt="Cover"
          style="width: 80px; height: auto; margin-right: 1rem; object-fit: cover"
        />
        <div>
          <strong>{{ book.title }}</strong>
          <span v-if="book.author"> — {{ book.author }}</span
          ><br />
          ISBN: {{ book.isbn }}<br />
          <button @click="bookStore.removeBook(book._id)">Remove</button>
        </div>
      </li>
    </ul>

    <p v-if="bookStore.books.length === 0 && !loading">No books saved yet.</p>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 2rem auto;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 1rem;
}
</style>
