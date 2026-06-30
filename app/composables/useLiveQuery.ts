/**
 * Reactive Dexie liveQuery for Vue 3 `<script setup>`.
 *
 * Dexie ships no Vue composable; the official path is `useObservable` from
 * `@vueuse/rxjs` wrapping `liveQuery()`. To avoid pulling in all of rxjs for a
 * single subscription, this is the manual-subscription path the Dexie docs
 * bless — subscribe to the liveQuery Observable, mirror it into a ref, and
 * unsubscribe on unmount. Client-only (IndexedDB is unavailable during SSR).
 */
import { liveQuery } from 'dexie'

export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  initial: T,
): Ref<T> {
  const result = ref(initial) as Ref<T>

  if (import.meta.client) {
    const subscription = liveQuery(querier).subscribe({
      next: (value) => {
        result.value = value
      },
      error: (err) => {
        console.error('[useLiveQuery]', err)
      },
    })
    onScopeDispose(() => subscription.unsubscribe())
  }

  return result
}
