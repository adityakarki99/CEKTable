import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// Library build config, kept separate from vite.config.ts (which still
// builds the demo app). Run with `npm run build:lib`.
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      include: ['src/index.ts', 'src/components/DataTable.tsx', 'src/components/Checkbox.tsx', 'src/core/**/*.ts'],
      exclude: ['src/core/__tests__/**'],
      outDir: 'dist/lib',
      insertTypesEntry: true,
    }),
  ],
  publicDir: false,
  build: {
    outDir: 'dist/lib',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@tanstack/react-table'],
    },
  },
})
