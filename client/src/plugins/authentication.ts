import { useAuthStore } from '@/stores/auth'

export const authentication = {
  async install() {
    const store = useAuthStore()
    await store.attempt()
  }
}
