/**
 * `:ui` overrides so @nuxt/ui overlays (UModal / USlideover) adopt the active
 * app theme (--cg-* tokens) instead of the default neutral surface.
 */
export function useThemedModalUi() {
  return {
    content:
      'bg-[var(--cg-surface-solid)] text-[var(--cg-text)] ring-1 ring-[var(--cg-border)] divide-[var(--cg-border)]',
    header: 'border-b border-[var(--cg-border)]',
    footer: 'border-t border-[var(--cg-border)]',
    title: 'text-[var(--cg-text)] font-display',
    overlay: 'bg-black/60',
  }
}
