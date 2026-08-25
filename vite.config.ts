import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "/src" is resolved by Vite relative to the project root.
    alias: { '@': '/src' },
  },
});
