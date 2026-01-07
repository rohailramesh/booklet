import type { Pinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export const authentication = {
  async install(pinia: Pinia) {
    const store = useAuthStore(pinia)
    await store.attempt()
  }
}
