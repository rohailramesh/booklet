import { defineStore } from 'pinia'
import { useApi, useApiPrivate } from '@/composables/useApi'
import type { IState, IUser, ILoginData, IRegisterData } from './types'

export const useAuthStore = defineStore('auth', {
  state: (): IState => ({
    user: {} as IUser,
    accessToken: ''
  }),

  getters: {
    userDetail: (state) => state.user,
    isAuthenticated: (state) => !!state.accessToken
  },

  actions: {
    // 🔹 Called on app startup
    async attempt() {
      try {
        await this.refresh()
        await this.getUser()
      } catch {
        this.reset()
      }
    },

    async login(payload: ILoginData) {
      const { data } = await useApi().post('/api/auth/login', payload)
      this.accessToken = data.access_token
      await this.getUser()
    },

    async register(payload: IRegisterData) {
      await useApi().post('/api/auth/register', payload)
    },

    async getUser() {
      const { data } = await useApiPrivate().get('/api/auth/user')
      this.user = data
    },

    async logout() {
      await useApiPrivate().post('/api/auth/logout')
      this.reset()
    },

    // 🔥 IMPORTANT FIX
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
    }
  }
})
