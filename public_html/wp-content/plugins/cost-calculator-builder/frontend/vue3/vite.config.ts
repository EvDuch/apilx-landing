import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { v4wp } from '@kucrut/vite-for-wp';
import { fileURLToPath, URL } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'path';
import prefixer from 'postcss-prefix-selector';
import postcssImport from 'postcss-import';

// https://vite.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        api: 'modern-compiler',
      },
    },
  },
  server: {
    cors: true,
  },
  plugins: [
    postcssImport(),
    prefixer({
      prefix: '.ccb-sticky-modal',
      transform(_: string, selector: string, prefixed: string) {
        if (
          selector.startsWith('body') ||
          selector.includes('.modal-backdrop')
        ) {
          return selector;
        }
        if (/^\.modal(\b|[.:#[])/.test(selector)) {
          return selector.replace(/^\.modal/, '.ccb-sticky-modal.modal');
        }
        return prefixed;
      },
    }),
    v4wp({
      input: {
        analytics: '/src/analytics/main.ts',
        widget: '/src/widget/main.ts',
        sticky: '/src/sticky/main.ts',
        orders: '/src/orders/main.ts',
      },
      outDir: './dist',
    }),
    vue(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@/styles': '/assets',
      '@/images': '/assets/images',
      '@/analytics': fileURLToPath(
        new URL('./src/analytics/', import.meta.url)
      ),
      '@/orders': fileURLToPath(new URL('./src/orders/', import.meta.url)),
      '@/widget': fileURLToPath(new URL('./src/widget/', import.meta.url)),
      '@/sticky': fileURLToPath(new URL('./src/sticky/', import.meta.url)),
      '@/common': fileURLToPath(new URL('./src/common/', import.meta.url)),

      // Force all imports of vue-demi to use the same copy from your project's node_modules
      'vue-demi': path.resolve(__dirname, 'node_modules/vue-demi'),
    },
  },
  build: {
    minify: true,
  },
});
