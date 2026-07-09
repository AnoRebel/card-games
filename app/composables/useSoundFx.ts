/**
 * Lightweight game sound + haptics. Cues are SYNTHESIZED via WebAudio (no asset
 * files → no bundle cost, works offline). Gated on the `sound` preference; the
 * AudioContext is created lazily and resumed on the first user gesture (browser
 * autoplay policy). Haptics use navigator.vibrate on supporting devices and are
 * suppressed under prefers-reduced-motion.
 */
type Cue = 'play' | 'draw' | 'win' | 'lose' | 'shuffle' | 'suit' | 'notify'

let ctx: AudioContext | null = null
let unlocked = false

function ensureCtx(): AudioContext | null {
  if (!import.meta.client) return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** One short enveloped tone. */
function tone(
  c: AudioContext,
  opts: { freq: number; dur: number; type?: OscillatorType; gain?: number; at?: number; slideTo?: number },
) {
  const t0 = c.currentTime + (opts.at ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.freq, t0)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + opts.dur)
  const peak = opts.gain ?? 0.12
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + opts.dur + 0.02)
}

/** A short filtered-noise burst (card slide / shuffle). */
function noise(c: AudioContext, dur: number, gain = 0.08, freq = 1800) {
  const t0 = c.currentTime
  const n = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(g).connect(c.destination)
  src.start(t0)
  src.stop(t0 + dur)
}

const RENDER: Record<Cue, (c: AudioContext) => void> = {
  play: (c) => noise(c, 0.09, 0.09, 2200),
  draw: (c) => noise(c, 0.12, 0.07, 1400),
  suit: (c) => {
    tone(c, { freq: 520, dur: 0.1, type: 'triangle', gain: 0.1 })
    tone(c, { freq: 780, dur: 0.14, type: 'triangle', gain: 0.09, at: 0.06 })
  },
  win: (c) => {
    // Rising arpeggio.
    ;[523, 659, 784, 1047].forEach((f, i) => tone(c, { freq: f, dur: 0.18, type: 'triangle', gain: 0.11, at: i * 0.09 }))
  },
  lose: (c) => tone(c, { freq: 320, dur: 0.35, type: 'sine', gain: 0.12, slideTo: 120 }),
  shuffle: (c) => {
    for (let i = 0; i < 4; i++) noise(c, 0.06, 0.05, 1600 + i * 200)
  },
  notify: (c) => tone(c, { freq: 880, dur: 0.12, type: 'sine', gain: 0.08 }),
}

const HAPTICS: Partial<Record<Cue, number | number[]>> = {
  play: 8,
  draw: 6,
  win: [24, 40, 24],
  lose: 40,
  suit: 12,
}

export function useSoundFx() {
  const { sound } = usePreferences()
  const reduced = usePreferredReducedMotion()
  // VueUse handles vibrate support detection + no-ops where unsupported.
  const { vibrate, isSupported: canVibrate } = useVibrate()

  // Unlock audio on the first user gesture (required by autoplay policies).
  function unlock() {
    if (unlocked || !import.meta.client) return
    const c = ensureCtx()
    if (c) unlocked = true
  }
  if (import.meta.client && !unlocked) {
    const once = () => { unlock(); window.removeEventListener('pointerdown', once); window.removeEventListener('keydown', once) }
    window.addEventListener('pointerdown', once, { once: true })
    window.addEventListener('keydown', once, { once: true })
  }

  function play(cue: Cue) {
    if (!import.meta.client) return
    // Sound (opt-in).
    if (sound.value) {
      const c = ensureCtx()
      if (c && c.state === 'running') {
        try { RENDER[cue](c) } catch { /* audio may be blocked */ }
      }
    }
    // Haptics (mobile), suppressed under reduced-motion.
    const pattern = HAPTICS[cue]
    if (pattern !== undefined && reduced.value !== 'reduce' && canVibrate.value) {
      vibrate(pattern)
    }
  }

  return { play, unlock }
}
