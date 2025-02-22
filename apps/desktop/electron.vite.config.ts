import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['next', '@vercel/turbopack-ecmascript-runtime'],
      }),
    ],
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['next', '@vercel/turbopack-ecmascript-runtime'],
      }),
    ],
  },
});
