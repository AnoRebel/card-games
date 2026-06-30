/**
 * Nitro native WebSocket endpoint (crossws) — carries the room/game protocol.
 *
 * Enabled by `nitro.experimental.websocket` in nuxt.config. Each connected peer
 * is bridged into the RoomHub, which enforces server-authoritative play,
 * per-viewer state redaction, host controls and spectator access control.
 *
 * Conduit (WebRTC P2P + relay) remains an optional enhancement behind the same
 * client-side GameTransport seam; this WS path is the reliable default carrier.
 */
import { getRoomHub, type WsPeer } from '../utils/roomHub'

// crossws Peer → our minimal WsPeer surface.
function asWsPeer(peer: {
  id: string
  send: (d: string) => void
  subscribe: (t: string) => void
  unsubscribe: (t: string) => void
  publish: (t: string, d: string) => void
}): WsPeer {
  return {
    id: peer.id,
    send: (d) => peer.send(d),
    subscribe: (t) => peer.subscribe(t),
    unsubscribe: (t) => peer.unsubscribe(t),
    publish: (t, d) => peer.publish(t, d),
  }
}

export default defineWebSocketHandler({
  open() {
    // Membership is established by the client's `join` message.
  },

  message(peer, message) {
    getRoomHub().onMessage(asWsPeer(peer as never), message.text())
  },

  close(peer) {
    getRoomHub().onClose(asWsPeer(peer as never))
  },

  error(peer) {
    getRoomHub().onClose(asWsPeer(peer as never))
  },
})
