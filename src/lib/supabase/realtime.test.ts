import { describe, expect, it, vi } from 'vitest'
import {
  matchTopic,
  parseMatchRealtimeEnvelope,
  reconcileMatchEnvelope,
  subscribeToMatch,
} from './realtime'

const envelope = {
  actor_profile_id: null,
  aggregate_version: 4,
  event_id: 'event-4',
  event_type: 'billiards_event',
  match_id: 'match-1',
  occurred_at: '2026-09-17T00:00:00.000Z',
  payload: { event_type: 'ball_toggled' },
  sequence: 4,
}

describe('match realtime protocol', () => {
  it('uses private match topics and parses the database envelope', () => {
    expect(matchTopic('match-1')).toBe('match:match-1')
    expect(parseMatchRealtimeEnvelope({ event: 'match_event', payload: envelope })).toMatchObject({
      aggregateVersion: 4,
      eventId: 'event-4',
      matchId: 'match-1',
    })
    expect(parseMatchRealtimeEnvelope({ event: 'match_event', payload: { ...envelope, aggregate_version: '4' } })).toBeNull()
  })

  it('ignores duplicates, applies the exact next version, and flags gaps', () => {
    const parsed = parseMatchRealtimeEnvelope(envelope)!
    expect(reconcileMatchEnvelope(4, parsed)).toEqual({ currentVersion: 4, kind: 'ignore' })
    expect(reconcileMatchEnvelope(3, parsed)).toEqual({ kind: 'apply', nextVersion: 4 })
    expect(reconcileMatchEnvelope(1, parsed)).toEqual({ expectedVersion: 2, kind: 'gap', receivedVersion: 4 })
  })

  it('subscribes privately and removes the channel during cleanup', async () => {
    const onStatus = vi.fn()
    const channel = {
      on: vi.fn().mockImplementation(() => channel),
      subscribe: vi.fn().mockImplementation((callback: (status: string) => void) => {
        callback('SUBSCRIBED')
        return channel
      }),
    }
    const client = {
      channel: vi.fn().mockReturnValue(channel),
      realtime: { setAuth: vi.fn().mockResolvedValue(undefined) },
      removeChannel: vi.fn().mockResolvedValue({ status: 'ok' }),
    }

    const subscription = await subscribeToMatch(client as never, 'match-1', { onEnvelope: vi.fn(), onStatus })
    expect(client.channel).toHaveBeenCalledWith('match:match-1', { config: { private: true } })
    expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED', undefined)
    await subscription.unsubscribe()
    expect(client.removeChannel).toHaveBeenCalledWith(channel)
  })
})
