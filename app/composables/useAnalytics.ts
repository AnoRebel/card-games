/**
 * Thin analytics wrapper — fires named events to BOTH Umami (nuxt-umami's
 * umTrackEvent) and self-hosted Rybbit (window.rybbit.event). Without these the
 * dashboards only see pageviews, so we're blind on the actual funnel
 * (start → finish → invite → install). Client-only; every call is a safe no-op
 * on the server or if a provider isn't loaded.
 */
type EventProps = Record<string, string | number | boolean>

interface RybbitApi {
  event?: (name: string, props?: EventProps) => void
}

export function useAnalytics() {
  function track(name: string, props?: EventProps) {
    if (!import.meta.client) return
    // Umami — umTrackEvent is auto-imported by nuxt-umami.
    try {
      umTrackEvent(name, props)
    } catch { /* umami not ready */ }
    // Rybbit (raw SDK on window).
    try {
      const rb = (window as unknown as { rybbit?: RybbitApi }).rybbit
      rb?.event?.(name, props)
    } catch { /* rybbit not ready */ }
  }

  return { track }
}
