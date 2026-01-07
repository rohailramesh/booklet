import { useAuthStore } from '@/stores/auth'
import { axiosPrivateInstance, axiosInstance } from '@/utils/axios'
import type { AxiosInstance } from 'axios'

let isInterceptorSet = false

/**
 * Public API instance (no auth headers, no interceptors needed)
 */
export function useApi(): AxiosInstance {
  return axiosInstance
}

/**
 * Private API instance (with auth header + refresh logic)
 */
export function useApiPrivate(): AxiosInstance {
  const authStore = useAuthStore()

  // Set up interceptors only once per app lifetime
  if (!isInterceptorSet) {
    isInterceptorSet = true

    // Request interceptor: add Bearer token if available
    axiosPrivateInstance.interceptors.request.use(
      (config) => {
        if (authStore.accessToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${authStore.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor: handle 401 by refreshing token
    axiosPrivateInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config

        // Only attempt refresh on 401 and if we haven't retried this request yet
        if (error?.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true

          try {
            await authStore.refresh() // This will update accessToken in the store

            // Update the header with the new token and retry
            originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
            return axiosPrivateInstance(originalRequest)
          } catch (refreshError) {
            // Refresh failed → user is truly unauthenticated
            authStore.reset()
            // Redirect to login (you can adjust the path if needed)
            if (window.location.pathname !== '/signin') {
              window.location.href = '/signin'
            }
            return Promise.reject(refreshError)
          }
        }

        // For all other errors (including 403 or non-retried 401), just reject
        return Promise.reject(error)
      }
    )
  }

  return axiosPrivateInstance
}

// import { useAuthStore } from '@/stores/auth'
// import { axiosPrivateInstance } from '@/utils/axios'
// import type { AxiosInstance } from 'axios'
// import { axiosInstance } from '@/utils/axios'

// let isInterceptorSet = false

// export function useApiPrivate(): AxiosInstance {
//   const authStore = useAuthStore()

//   if (!isInterceptorSet) {
//     isInterceptorSet = true

//     axiosPrivateInstance.interceptors.request.use(
//       (config) => {
//         if (!config.headers.Authorization && authStore.accessToken) {
//           config.headers.Authorization = `Bearer ${authStore.accessToken}`
//         }
//         return config
//       },
//       (error) => Promise.reject(error)
//     )

//     axiosPrivateInstance.interceptors.response.use(
//       (response) => response,
//       async (error) => {
//         const prevRequest = error?.config

//         if (
//           (error?.response?.status === 401 || error?.response?.status === 403) &&
//           !prevRequest._retry
//         ) {
//           prevRequest._retry = true

//           await authStore.refresh()

//           prevRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
//           return axiosPrivateInstance(prevRequest)
//         }

//         return Promise.reject(error)
//       }
//     )
//   }

//   return axiosPrivateInstance
// }

// export function useApi(): AxiosInstance {
//   return axiosInstance
// }
