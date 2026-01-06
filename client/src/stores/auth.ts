import { defineStore } from 'pinia'
import { useApi, useApiPrivate } from '@/composables/useApi'
import type { IState, IUser, ILoginData, IRegisterData } from './types'

export const useAuthStore = defineStore('auth', {
  state: (): IState & { loading: boolean } => ({
    user: {} as IUser,
    accessToken: '',
    loading: false // ← New loading state
  }),

  getters: {
    userDetail: (state) => state.user,
    isAuthenticated: (state) => !!state.accessToken,
    // Optional: expose loading as getter too
    isLoading: (state) => state.loading
  },

  actions: {
    // Helper to set loading state
    setLoading(value: boolean) {
      this.loading = value
    },

    async attempt() {
      this.setLoading(true)
      try {
        await this.refresh()
        await this.getUser()
      } catch {
        this.reset()
      } finally {
        this.setLoading(false)
      }
    },

    async login(payload: ILoginData) {
      this.setLoading(true)
      try {
        const { data } = await useApi().post('/api/auth/login', payload)
        this.accessToken = data.access_token
        await this.getUser()
      } finally {
        this.setLoading(false)
      }
    },

    async register(payload: IRegisterData) {
      this.setLoading(true)
      try {
        await useApi().post('/api/auth/register', payload)
      } finally {
        this.setLoading(false)
      }
    },

    async getUser() {
      this.setLoading(true)
      try {
        const { data } = await useApiPrivate().get('/api/auth/user')
        this.user = data
      } finally {
        this.setLoading(false)
      }
    },

    async logout() {
      this.setLoading(true)
      try {
        await useApiPrivate().post('/api/auth/logout')
      } finally {
        this.reset()
        this.setLoading(false)
      }
    },

    async refresh() {
      try {
        const { data } = await useApi().post('/api/auth/refresh')
        this.accessToken = data.access_token
      } catch {
        this.reset()
        throw new Error('Refresh failed')
      }
    },

    reset() {
      this.accessToken = ''
      this.user = {} as IUser
      this.loading = false
    }
  }
})
