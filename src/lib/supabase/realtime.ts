import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import type { Database, Json } from './database.types'

export type MatchRealtimeEnvelope = {
  actorProfileId: string | null
  aggregateVersion: number
  eventId: string
  eventType: string
  matchId: string
  occurredAt: string
  payload: Json
  sequence: number
}

export type MatchEnvelopeDecision =
  | { kind: 'ignore'; currentVersion: number }
  | { kind: 'apply'; nextVersion: number }
  | { expectedVersion: number; kind: 'gap'; receivedVersion: number }

export type MatchRealtimeStatus = typeof REALTIME_SUBSCRIBE_STATES[keyof typeof REALTIME_SUBSCRIBE_STATES]

export type MatchRealtimeHandlers = {
  onEnvelope: (envelope: MatchRealtimeEnvelope) => void
  onMalformed?: (payload: unknown) => void
  onStatus?: (status: MatchRealtimeStatus, error?: Error) => void
}

export const matchTopic = (matchId: string): string => `match:${matchId}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isJson(value: unknown): value is Json {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isJson)
  }

  return isRecord(value) && Object.values(value).every(isJson)
}

export function parseMatchRealtimeEnvelope(input: unknown): MatchRealtimeEnvelope | null {
  const outer = isRecord(input) ? input : null
  const candidate = outer && isRecord(outer.payload) && 'match_id' in outer.payload ? outer.payload : input
  if (!isRecord(candidate)) {
    return null
  }

  const matchId = candidate.match_id
  const aggregateVersion = candidate.aggregate_version
  const sequence = candidate.sequence
  const eventId = candidate.event_id
  const eventType = candidate.event_type
  const occurredAt = candidate.occurred_at
  const actorProfileId = candidate.actor_profile_id
  const payload = candidate.payload

  if (
    typeof matchId !== 'string'
    || typeof aggregateVersion !== 'number'
    || !Number.isInteger(aggregateVersion)
    || aggregateVersion < 1
    || typeof sequence !== 'number'
    || !Number.isInteger(sequence)
    || sequence < 1
    || typeof eventId !== 'string'
    || typeof eventType !== 'string'
    || typeof occurredAt !== 'string'
    || (actorProfileId !== null && typeof actorProfileId !== 'string')
    || !isJson(payload)
  ) {
    return null
  }

  return {
    actorProfileId,
    aggregateVersion,
    eventId,
    eventType,
    matchId,
    occurredAt,
    payload,
    sequence,
  }
}

export function reconcileMatchEnvelope(
  currentVersion: number,
  envelope: MatchRealtimeEnvelope,
): MatchEnvelopeDecision {
  if (envelope.aggregateVersion <= currentVersion) {
    return { currentVersion, kind: 'ignore' }
  }

  if (envelope.aggregateVersion === currentVersion + 1) {
    return { kind: 'apply', nextVersion: envelope.aggregateVersion }
  }

  return {
    expectedVersion: currentVersion + 1,
    kind: 'gap',
    receivedVersion: envelope.aggregateVersion,
  }
}

export type MatchRealtimeSubscription = {
  channel: RealtimeChannel
  unsubscribe: () => Promise<void>
}

export async function subscribeToMatch(
  client: SupabaseClient<Database>,
  matchId: string,
  handlers: MatchRealtimeHandlers,
): Promise<MatchRealtimeSubscription> {
  await client.realtime.setAuth()

  const channel = client.channel(matchTopic(matchId), {
    config: { private: true },
  })

  channel.on('broadcast', { event: 'match_event' }, (payload) => {
    const envelope = parseMatchRealtimeEnvelope(payload)
    if (envelope && envelope.matchId === matchId) {
      handlers.onEnvelope(envelope)
    } else {
      handlers.onMalformed?.(payload)
    }
  })

  channel.subscribe((status, error) => {
    handlers.onStatus?.(status, error)
  })

  return {
    channel,
    unsubscribe: async () => {
      await client.removeChannel(channel)
    },
  }
}

export type MatchRealtimeConnectionState = 'connecting' | 'degraded' | 'idle' | 'live' | 'recovering'

export type UseMatchRealtimeOptions = {
  client: SupabaseClient<Database> | null
  currentVersion: number
  enabled?: boolean
  matchId: string | null
  onEnvelope: (envelope: MatchRealtimeEnvelope) => void
  onGap?: (envelope: MatchRealtimeEnvelope, expectedVersion: number) => void
  onMalformed?: (payload: unknown) => void
  onReconcile?: () => void
}

export function useMatchRealtime({
  client,
  currentVersion,
  enabled = true,
  matchId,
  onEnvelope,
  onGap,
  onMalformed,
  onReconcile,
}: UseMatchRealtimeOptions): { state: MatchRealtimeConnectionState } {
  const currentVersionRef = useRef(currentVersion)
  const lastMatchIdRef = useRef(matchId)
  const callbacksRef = useRef({ onEnvelope, onGap, onMalformed, onReconcile })
  const [state, setState] = useState<MatchRealtimeConnectionState>(() => (
    client && matchId && enabled ? 'connecting' : 'idle'
  ))

  useEffect(() => {
    if (lastMatchIdRef.current !== matchId) {
      currentVersionRef.current = currentVersion
      lastMatchIdRef.current = matchId
    } else {
      currentVersionRef.current = Math.max(currentVersionRef.current, currentVersion)
    }
    callbacksRef.current = { onEnvelope, onGap, onMalformed, onReconcile }
  }, [currentVersion, matchId, onEnvelope, onGap, onMalformed, onReconcile])

  useEffect(() => {
    if (!client || !matchId || !enabled) {
      queueMicrotask(() => setState('idle'))
      return
    }

    let disposed = false
    let subscription: MatchRealtimeSubscription | null = null
    const { data: authState } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState('idle')
        if (subscription) {
          void subscription.unsubscribe()
        }
        return
      }

      void client.realtime.setAuth(session.access_token).then(() => {
        if (!disposed) {
          reconcile()
        }
      })
    })

    queueMicrotask(() => {
      if (!disposed) {
        setState('connecting')
      }
    })

    const reconcile = () => {
      if (!disposed) {
        setState('recovering')
        callbacksRef.current.onReconcile?.()
      }
    }

    const start = async () => {
      try {
        subscription = await subscribeToMatch(client, matchId, {
          onEnvelope: (envelope) => {
            const decision = reconcileMatchEnvelope(currentVersionRef.current, envelope)
            if (decision.kind === 'apply') {
              currentVersionRef.current = decision.nextVersion
              callbacksRef.current.onEnvelope(envelope)
            } else if (decision.kind === 'gap') {
              callbacksRef.current.onGap?.(envelope, decision.expectedVersion)
            }
          },
          onMalformed: (payload) => callbacksRef.current.onMalformed?.(payload),
          onStatus: (status, error) => {
            if (disposed) {
              return
            }

            if (status === 'SUBSCRIBED') {
              setState('live')
              callbacksRef.current.onReconcile?.()
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setState('degraded')
              if (error) {
                callbacksRef.current.onMalformed?.(error)
              }
            } else if (status === 'CLOSED') {
              setState('idle')
            }
          },
        })

        if (disposed) {
          await subscription.unsubscribe()
        }
      } catch (error) {
        if (!disposed) {
          setState('degraded')
          callbacksRef.current.onMalformed?.(error)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reconcile()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    void start()

    return () => {
      disposed = true
      authState.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (subscription) {
        void subscription.unsubscribe()
      }
      setState('idle')
    }
  }, [client, enabled, matchId])

  return { state }
}
