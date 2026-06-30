/**
 * Player identity — a stable id + display name persisted in localStorage
 * (shared across tabs, survives reload; used for reconnect & leaderboards).
 */
export function usePlayerIdentity() {
  const name = useLocalStorage('cg:player-name', 'You')
  const id = useLocalStorage('cg:player-id', '')
  if (import.meta.client && !id.value) {
    // Generate a stable id once (client only; crypto is fine here — not engine).
    id.value =
      globalThis.crypto?.randomUUID?.() ??
      `p-${Date.now().toString(36)}-${Math.floor(performance.now())}`
  }
  return { id, name }
}
