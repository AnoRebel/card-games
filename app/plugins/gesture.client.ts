/**
 * Register @vueuse/gesture so useDrag/useGesture work. Client-only (touch/
 * pointer gestures are a browser concern).
 */
import { GesturePlugin } from '@vueuse/gesture'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GesturePlugin)
})
