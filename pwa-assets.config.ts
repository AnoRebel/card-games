import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

// Generates the full PWA icon set (favicon, apple-touch, maskable, 192/512)
// from a single source SVG into /public. Run: `bun run pwa:assets`.
export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
})
