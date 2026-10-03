import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths, so the build also works from a sub-folder such as username.github.io/repo/
  base: './',
  plugins: [react()],
})
