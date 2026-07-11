/**
 * Voice signalling relay tests — the dumb `/_voice` relay exercised with mock
 * peers (no real socket). Covers: peer discovery on join, join/left broadcast,
 * targeted signal forwarding, and cleanup on close.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import type { VoicePeer } from '../server/routes/_voice'

// `_voice.ts` calls Nitro's auto-imported `defineWebSocketHandler` at its module
// top level (same pattern as the game socket `_ws.ts`). That global doesn't
// exist in the unit-test context, so we provide a no-op stub BEFORE importing
// the module. Nitro supplies the real one at build/runtime.
;(globalThis as Record<string, unknown>).defineWebSocketHandler = (h: unknown) => h

const { handleVoiceMessage, handleVoiceClose } = await import('../server/routes/_voice')

/** A mock voice peer that records everything sent to it. */
class MockPeer implements VoicePeer {
  sent: Array<Record<string, unknown>> = []
  constructor(public id: string) {}
  send(data: string) {
    this.sent.push(JSON.parse(data))
  }
  last(type: string) {
    return [...this.sent].reverse().find((m) => m.t === type)
  }
  all(type: string) {
    return this.sent.filter((m) => m.t === type)
  }
}

// Each test uses a unique room id so the module-level room map doesn't bleed
// state between tests (the relay's `rooms` map is process-global by design).
let n = 0
const freshRoom = () => `room-${++n}-${Math.random().toString(36).slice(2)}`

function join(peer: MockPeer, roomId: string, peerId: string, name = peerId) {
  handleVoiceMessage(peer, JSON.stringify({ t: 'join', roomId, peerId, name }))
}

describe('voice relay — join & discovery', () => {
  let roomId: string
  beforeEach(() => {
    roomId = freshRoom()
  })

  it('tells the first joiner there are no existing peers', () => {
    const a = new MockPeer('sockA')
    join(a, roomId, 'pa')
    expect(a.last('peers')).toEqual({ t: 'peers', peers: [] })
  })

  it('gives a later joiner the list of existing peers (not itself)', () => {
    const a = new MockPeer('sockA')
    const b = new MockPeer('sockB')
    join(a, roomId, 'pa', 'Alice')
    join(b, roomId, 'pb', 'Bob')
    // B learns about A only.
    expect(b.last('peers')).toEqual({ t: 'peers', peers: [{ peerId: 'pa', name: 'Alice' }] })
  })

  it('broadcasts `joined` to existing peers when someone new arrives', () => {
    const a = new MockPeer('sockA')
    const b = new MockPeer('sockB')
    join(a, roomId, 'pa', 'Alice')
    join(b, roomId, 'pb', 'Bob')
    // A is told B joined; B is NOT told about its own join.
    expect(a.last('joined')).toEqual({ t: 'joined', peerId: 'pb', name: 'Bob' })
    expect(b.all('joined')).toHaveLength(0)
  })

  it('ignores a join missing roomId or peerId', () => {
    const a = new MockPeer('sockA')
    handleVoiceMessage(a, JSON.stringify({ t: 'join', roomId, name: 'x' }))
    handleVoiceMessage(a, JSON.stringify({ t: 'join', peerId: 'pa', name: 'x' }))
    expect(a.sent).toHaveLength(0)
  })
})

describe('voice relay — signalling', () => {
  let roomId: string
  beforeEach(() => {
    roomId = freshRoom()
  })

  it('forwards a signal only to the named target peer', () => {
    const a = new MockPeer('sockA')
    const b = new MockPeer('sockB')
    const c = new MockPeer('sockC')
    join(a, roomId, 'pa')
    join(b, roomId, 'pb')
    join(c, roomId, 'pc')

    // A sends an SDP offer to B.
    handleVoiceMessage(
      a,
      JSON.stringify({ t: 'signal', to: 'pb', from: 'pa', data: { sdp: 'OFFER' } }),
    )
    expect(b.last('signal')).toEqual({ t: 'signal', to: 'pb', from: 'pa', data: { sdp: 'OFFER' } })
    // C must not receive it.
    expect(c.all('signal')).toHaveLength(0)
  })

  it('drops a signal to an unknown target', () => {
    const a = new MockPeer('sockA')
    join(a, roomId, 'pa')
    handleVoiceMessage(
      a,
      JSON.stringify({ t: 'signal', to: 'ghost', from: 'pa', data: { sdp: 'x' } }),
    )
    // Nothing sent beyond the initial `peers` reply.
    expect(a.all('signal')).toHaveLength(0)
  })

  it('drops a signal from a peer that never joined', () => {
    const roomId2 = freshRoom()
    const a = new MockPeer('sockA')
    join(a, roomId2, 'pa')
    const stranger = new MockPeer('sockX') // never joined
    handleVoiceMessage(
      stranger,
      JSON.stringify({ t: 'signal', to: 'pa', from: 'px', data: { sdp: 'x' } }),
    )
    expect(a.all('signal')).toHaveLength(0)
  })
})

describe('voice relay — leaving', () => {
  it('broadcasts `left` to the room when a peer disconnects', () => {
    const roomId = freshRoom()
    const a = new MockPeer('sockA')
    const b = new MockPeer('sockB')
    join(a, roomId, 'pa')
    join(b, roomId, 'pb')

    handleVoiceClose(b)
    expect(a.last('left')).toEqual({ t: 'left', peerId: 'pb' })
  })

  it('cleans up so a rejoin sees the reduced peer list', () => {
    const roomId = freshRoom()
    const a = new MockPeer('sockA')
    const b = new MockPeer('sockB')
    join(a, roomId, 'pa')
    join(b, roomId, 'pb')
    handleVoiceClose(a)

    // A new peer joining now sees only B.
    const c = new MockPeer('sockC')
    join(c, roomId, 'pc')
    expect(c.last('peers')).toEqual({ t: 'peers', peers: [{ peerId: 'pb', name: 'pb' }] })
  })

  it('close of a peer that never joined is a no-op', () => {
    const ghost = new MockPeer('sockGhost')
    expect(() => handleVoiceClose(ghost)).not.toThrow()
  })
})
