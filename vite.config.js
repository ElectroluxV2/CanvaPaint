import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(__dirname, 'src/pages'),
  publicDir: resolve(__dirname, 'src/assets'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
        dashboard: resolve(__dirname, 'src/pages/dashboard/index.html')
      }
    }
  }
});
