import { defineStore } from 'pinia'
import { useApiPrivate } from '@/composables/useApi'
import type { IBook, IBookState } from './types'

export const useBookStore = defineStore('book', {
  state: (): IBookState => ({
    books: [],
    loading: false,
    error: null
  }),

  getters: {
    allBooks: (state) => state.books,
    bookCount: (state) => state.books.length
  },

  actions: {
    async fetchBooks() {
      this.loading = true
      this.error = null

      try {
        const { data } = await useApiPrivate().get('/api/books')
        this.books = data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Failed to fetch books'
      } finally {
        this.loading = false
      }
    },

    async addBook(payload: { isbn: string; title: string; author?: string; coverUrl?: string }) {
      this.error = null

      try {
        const { data } = await useApiPrivate().post('/api/books', payload)
        this.books.unshift(data) // optimistic update
        return data
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Failed to add book'
        throw err
      }
    },

    async removeBook(bookId: string) {
      this.error = null

      try {
        await useApiPrivate().delete(`/api/books/${bookId}`)
        this.books = this.books.filter((b) => b._id !== bookId)
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Failed to remove book'
        throw err
      }
    },

    clearBooks() {
      this.books = []
      this.error = null
    }
  }
})
