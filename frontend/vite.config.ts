import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Tworzymy alias '@', który wskazuje na folder 'src'
            '@': path.resolve(__dirname, './src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                // Teraz używamy aliasu. Ważne: Sass wymaga średnika na końcu!
                additionalData: `@use "@/variables" as *;`
            }
        }
    }
})