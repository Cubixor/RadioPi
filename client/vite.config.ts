import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://192.168.1.100:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
})
