/**
 * User preferences (small scalars) persisted in localStorage — shared across
 * tabs, survive reload. Consumed by notifications, animation gating, etc.
 */
export function usePreferences() {
  const notifications = useLocalStorage('cg:pref-notifications', true)
  const animations = useLocalStorage('cg:pref-animations', true)
  const sound = useLocalStorage('cg:pref-sound', false)
  return { notifications, animations, sound }
}
