import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true // Jesli port 3000 bedzie zajety, Vite zglosi blad zamiast zmieniac port
  }
});