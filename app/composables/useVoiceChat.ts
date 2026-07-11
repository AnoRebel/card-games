/**
 * useVoiceChat — WebRTC mesh voice chat for online game rooms.
 *
 * Each participant opens a direct RTCPeerConnection to every other participant
 * (a full mesh; no SFU/media server). Signalling (SDP/ICE) rides a dedicated
 * `/_voice` WebSocket, kept entirely separate from the game socket so voice
 * never pollutes the shared GameTransport. Audio flows peer-to-peer.
 *
 * Client-only: all WebRTC/WebAudio access is guarded behind `import.meta.client`.
 * Respects `enabled` (tears down when it goes false) and cleans up on scope
 * dispose.
 */

const STUN_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

// "Speaking" detection: RMS above this (0..1) counts as speech; after it drops,
// hold the flag for a short decay so the indicator doesn't flicker.
const SPEAKING_THRESHOLD = 0.02
const SPEAKING_DECAY_MS = 300

export type VoiceState = 'idle' | 'connecting' | 'connected' | 'error'

export interface VoicePeerInfo {
  peerId: string
  name: string
  speaking: boolean
  muted: boolean
}

/** Per-remote-peer bookkeeping (not reactive — mirrored into `peers`). */
interface PeerConn {
  peerId: string
  name: string
  pc: RTCPeerConnection
  audioEl: HTMLAudioElement
  analyser: AnalyserNode | null
  lastLoud: number
}

export interface UseVoiceChatOptions {
  roomId: MaybeRefOrGetter<string>
  peerId: string
  name: MaybeRefOrGetter<string>
  enabled: MaybeRefOrGetter<boolean>
}

export function useVoiceChat(opts: UseVoiceChatOptions) {
  const state = ref<VoiceState>('idle')
  const inVoice = computed(() => state.value === 'connecting' || state.value === 'connected')
  const muted = ref(false)
  const peers = ref<VoicePeerInfo[]>([])
  const error = ref<string | null>(null)

  // Non-reactive runtime handles (only meaningful on the client, in-voice).
  let ws: WebSocket | null = null
  let localStream: MediaStream | null = null
  let audioCtx: AudioContext | null = null
  let rafId: number | null = null
  const conns = new Map<string, PeerConn>()
  let closedByUs = false

  const myId = opts.peerId

  function setError(msg: string) {
    error.value = msg
    state.value = 'error'
  }

  function syncPeers() {
    peers.value = [...conns.values()].map((c) => ({
      peerId: c.peerId,
      name: c.name,
      speaking: c.lastLoud > 0 && Date.now() - c.lastLoud < SPEAKING_DECAY_MS,
      muted: false,
    }))
  }

  function wsUrl(): string {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${location.host}/_voice`
  }

  function sendWs(msg: Record<string, unknown>) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
  }

  // --- WebAudio speaking detection -----------------------------------------
  function attachAnalyser(stream: MediaStream): AnalyserNode | null {
    try {
      if (!audioCtx) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) return null
        audioCtx = new Ctx()
      }
      const src = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      src.connect(analyser)
      return analyser
    } catch {
      return null
    }
  }

  function startSpeakingLoop() {
    if (rafId != null) return
    const buf = new Uint8Array(256)
    const tick = () => {
      let changed = false
      for (const c of conns.values()) {
        if (!c.analyser) continue
        c.analyser.getByteTimeDomainData(buf)
        // RMS of the centered waveform (128 = silence).
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i]! - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        if (rms > SPEAKING_THRESHOLD) {
          c.lastLoud = Date.now()
          changed = true
        }
      }
      // Recompute reactive `peers` (cheap: a handful of entries). Only when
      // something is or was recently loud, so an idle room costs ~nothing.
      if (changed || peers.value.some((p) => p.speaking)) syncPeers()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  }

  // --- peer connections ----------------------------------------------------
  function createPeer(remoteId: string, name: string): PeerConn {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS })
    const audioEl = document.createElement('audio')
    audioEl.autoplay = true
    audioEl.dataset.voicePeer = remoteId
    audioEl.style.display = 'none'
    document.body.appendChild(audioEl)

    const conn: PeerConn = { peerId: remoteId, name, pc, audioEl, analyser: null, lastLoud: 0 }
    conns.set(remoteId, conn)

    // Add our mic track so the remote receives our audio.
    if (localStream) {
      for (const track of localStream.getAudioTracks()) pc.addTrack(track, localStream)
    }

    pc.addEventListener('icecandidate', (ev) => {
      if (ev.candidate) {
        sendWs({ t: 'signal', to: remoteId, from: myId, data: { candidate: ev.candidate } })
      }
    })

    pc.addEventListener('track', (ev) => {
      const [stream] = ev.streams
      if (!stream) return
      conn.audioEl.srcObject = stream
      conn.analyser = attachAnalyser(stream)
      startSpeakingLoop()
    })

    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // The relay will also send `left`; teardown there is idempotent.
      }
    })

    syncPeers()
    return conn
  }

  async function makeOffer(conn: PeerConn) {
    try {
      const offer = await conn.pc.createOffer()
      await conn.pc.setLocalDescription(offer)
      sendWs({ t: 'signal', to: conn.peerId, from: myId, data: { sdp: conn.pc.localDescription } })
    } catch {
      // Glare/renegotiation failures are non-fatal for a best-effort mesh.
    }
  }

  /** Deterministic offerer: the lexicographically smaller peerId offers. */
  function shouldOffer(remoteId: string): boolean {
    return myId < remoteId
  }

  async function onSignal(from: string, data: unknown) {
    const payload = data as { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }
    // An offer can race ahead of the `joined`/`peers` message that would have
    // created this peer (server fan-out order isn't guaranteed). Rather than
    // drop it — which would strand a listed-but-silent peer — create the conn
    // lazily so the answer path can run. A stray candidate with no conn is still
    // ignored (its offer will arrive and set things up).
    let conn = conns.get(from)
    if (!conn) {
      if (!payload.sdp || payload.sdp.type !== 'offer') return
      conn = createPeer(from, from)
    }
    try {
      if (payload.sdp) {
        await conn.pc.setRemoteDescription(payload.sdp)
        if (payload.sdp.type === 'offer') {
          const answer = await conn.pc.createAnswer()
          await conn.pc.setLocalDescription(answer)
          sendWs({ t: 'signal', to: from, from: myId, data: { sdp: conn.pc.localDescription } })
        }
      } else if (payload.candidate) {
        await conn.pc.addIceCandidate(payload.candidate)
      }
    } catch {
      // Ignore malformed / out-of-order signalling.
    }
  }

  function tearDownPeer(remoteId: string) {
    const conn = conns.get(remoteId)
    if (!conn) return
    conns.delete(remoteId)
    try { conn.pc.close() } catch { /* already closed */ }
    conn.audioEl.srcObject = null
    conn.audioEl.remove()
    syncPeers()
  }

  // --- signalling socket ---------------------------------------------------
  function onWsMessage(raw: string) {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return
    }
    const t = msg.t
    if (t === 'peers') {
      const list = Array.isArray(msg.peers) ? (msg.peers as { peerId: string; name: string }[]) : []
      for (const p of list) {
        if (p.peerId === myId) continue
        // A lazily-created conn (from an early offer) may already exist with the
        // peerId as a placeholder name — adopt the real name, don't re-create.
        const existing = conns.get(p.peerId)
        if (existing) { existing.name = p.name; syncPeers(); continue }
        const conn = createPeer(p.peerId, p.name)
        if (shouldOffer(p.peerId)) void makeOffer(conn)
      }
      state.value = 'connected'
    } else if (t === 'joined') {
      const peerId = typeof msg.peerId === 'string' ? msg.peerId : ''
      const name = typeof msg.name === 'string' ? msg.name : ''
      if (!peerId || peerId === myId) return
      const existing = conns.get(peerId)
      if (existing) { existing.name = name; syncPeers(); return }
      const conn = createPeer(peerId, name)
      if (shouldOffer(peerId)) void makeOffer(conn)
    } else if (t === 'left') {
      const peerId = typeof msg.peerId === 'string' ? msg.peerId : ''
      if (peerId) tearDownPeer(peerId)
    } else if (t === 'signal') {
      const from = typeof msg.from === 'string' ? msg.from : ''
      if (from) void onSignal(from, msg.data)
    }
  }

  // --- public API ----------------------------------------------------------
  async function join() {
    if (!import.meta.client) return
    if (inVoice.value) return
    error.value = null
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
      setError('unsupported')
      return
    }
    state.value = 'connecting'
    closedByUs = false
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch {
      setError('micDenied')
      return
    }
    // Apply current mute state to the freshly-acquired track.
    for (const track of localStream.getAudioTracks()) track.enabled = !muted.value

    const socket = new WebSocket(wsUrl())
    ws = socket
    socket.addEventListener('open', () => {
      sendWs({ t: 'join', roomId: toValue(opts.roomId), peerId: myId, name: toValue(opts.name) })
    })
    socket.addEventListener('message', (ev) => onWsMessage(String(ev.data)))
    socket.addEventListener('close', () => {
      if (!closedByUs && inVoice.value) setError('unsupported')
    })
    socket.addEventListener('error', () => {
      if (!closedByUs) setError('unsupported')
    })
  }

  function leave() {
    closedByUs = true
    if (rafId != null) { cancelAnimationFrame(rafId); rafId = null }
    for (const id of [...conns.keys()]) tearDownPeer(id)
    if (ws) {
      try { ws.close() } catch { /* already closing */ }
      ws = null
    }
    if (localStream) {
      for (const track of localStream.getTracks()) track.stop()
      localStream = null
    }
    if (audioCtx) {
      void audioCtx.close().catch(() => {})
      audioCtx = null
    }
    peers.value = []
    if (state.value !== 'error') state.value = 'idle'
  }

  function toggleMute() {
    muted.value = !muted.value
    if (localStream) {
      for (const track of localStream.getAudioTracks()) track.enabled = !muted.value
    }
  }

  // Respect `enabled`: leave when it flips false.
  if (import.meta.client) {
    watch(
      () => toValue(opts.enabled),
      (on) => {
        if (!on && inVoice.value) leave()
      },
    )
  }

  tryOnScopeDispose(() => leave())

  return { state, inVoice, muted, peers, error, join, leave, toggleMute }
}
