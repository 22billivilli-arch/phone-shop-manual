import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 상대경로 base: 카페24 루트(hk.io.kr) + GitHub Pages 서브경로 모두에서 동작
export default defineConfig({
  plugins: [react()],
  base: './',
})
