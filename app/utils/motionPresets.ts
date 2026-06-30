/**
 * Shared @vueuse/motion presets for card animations.
 *
 * All transforms are compositor-friendly (translate/scale/opacity only) to stay
 * smooth and memory-light on mobile (card-presentation-ui spec). Components
 * gate these behind prefers-reduced-motion.
 */

export const dealMotion = {
  initial: { opacity: 0, y: -40, scale: 0.9 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
}

export const playMotion = {
  initial: { opacity: 0, scale: 0.8 },
  enter: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

export const popMotion = {
  initial: { opacity: 0, scale: 0.6 },
  enter: {
    opacity: 1,
    scale: 1,
    transition: { duration: 180 },
  },
}

/** Staggered enter for a freshly-dealt hand. */
export function dealStagger(index: number) {
  return {
    initial: { opacity: 0, y: -30, scale: 0.9 },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 26,
        delay: index * 45,
      },
    },
  }
}
