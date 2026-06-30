/**
 * Turn-order helpers.
 *
 * Seats are 0..n-1. Default direction is clockwise (increasing seat, wrapping).
 * Games that support reversing (e.g. Last Card's reverse card) pass `dir = -1`.
 */

import type { Seat } from './types'

export type Direction = 1 | -1

/** The next seat after `seat` among `count` seats, in `dir`. */
export function nextSeat(seat: Seat, count: number, dir: Direction = 1): Seat {
  return (((seat + dir) % count) + count) % count
}

/** Advance `steps` seats from `seat` (e.g. skip = 2). */
export function advanceSeat(
  seat: Seat,
  count: number,
  steps: number,
  dir: Direction = 1,
): Seat {
  return (((seat + dir * steps) % count) + count) % count
}

/** Ordered list of seats starting at `from` (inclusive), following `dir`. */
export function seatOrder(
  from: Seat,
  count: number,
  dir: Direction = 1,
): Seat[] {
  const order: Seat[] = []
  let s = from
  for (let i = 0; i < count; i++) {
    order.push(s)
    s = nextSeat(s, count, dir)
  }
  return order
}
