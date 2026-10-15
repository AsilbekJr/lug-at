import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(process.cwd(), './src') },
      // One WASM-only runtime for VAD; avoid bundling WebGPU/WebGL and duplicate runtimes.
      { find: /^onnxruntime-web(?:\/wasm)?$/, replacement: path.resolve(process.cwd(), 'node_modules/onnxruntime-web/dist/ort.wasm.min.mjs') },
    ],
  },
});
