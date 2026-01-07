// src/utils/axios.ts

import axios from 'axios'

/**
 * Public Axios instance – used for unauthenticated requests
 * (login, register, refresh token endpoint)
 */
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URI,
  headers: {
    'Content-Type': 'application/json'
  }
  // Removed: withCredentials: true → no cookies involved anymore
})

/**
 * Private Axios instance – used for authenticated requests
 * Interceptors are added in useApi.ts composable
 */
export const axiosPrivateInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URI,
  headers: {
    'Content-Type': 'application/json'
  }
  // Removed: withCredentials: true → no cookies involved anymore
})
// import axios from 'axios'

// axios.defaults.withCredentials = true

// export const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URI,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// })

// export const axiosPrivateInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URI,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// })
