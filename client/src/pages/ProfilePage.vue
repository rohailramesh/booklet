<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const drawer = ref(true)
const rail = ref(false)
const user = computed(() => {
  return authStore.userDetail
})

const getUser = async () => {
  await authStore.getUser()
  console.log(user.value)
}

const logOut = async () => {
  await authStore
    .logout()
    .then(() => {
      router.replace({ name: 'home' })
    })
    .catch((e) => {
      console.log(e)
    })
}

onMounted(async () => {
  await getUser()
})
</script>
<template>
  <v-layout v-if="user">
    {{ user }}
    <v-main> </v-main>
  </v-layout>
</template>

<style scoped></style>
