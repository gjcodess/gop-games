import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { fetchMatchSnapshot, type MatchSnapshot } from '../../lib/supabase/matchSnapshot'
import { recordBinaryResult, startMatch } from '../../lib/supabase/matches'
import { supabase } from '../../lib/supabase/client'
import { useMatchRealtime } from '../../lib/supabase/realtime'
import styles from './MatchRoom.module.css'

type OutcomeMode = 'draw' | 'no_contest' | 'winner'

function randomEventId(): string {
  return crypto.randomUUID()
}

export function MatchRoomPage() {
  const { matchId = '' } = useParams<{ matchId: string }>()
  const { signOut } = useAuth()
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null)
  const [gameName, setGameName] = useState('Live match')
  const [maxWinners, setMaxWinners] = useState(1)
  const [winnerTeamIds, setWinnerTeamIds] = useState<string[]>([])
  const [outcomeMode, setOutcomeMode] = useState<OutcomeMode>('winner')
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase && matchId))
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const snapshotGameId = snapshot?.match.game_id

  const refreshSnapshot = useCallback(async () => {
    if (!supabase || !matchId) return

    try {
      const nextSnapshot = await fetchMatchSnapshot(supabase, matchId)
      setSnapshot(nextSnapshot)
      setWinnerTeamIds((current) => current.filter((id) => nextSnapshot.teams.some((team) => team.id === id)))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this match.')
    } finally {
      setIsLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    const client = supabase
    if (!client || !snapshotGameId) return
    const queryClient = client
    const queryGameId = snapshotGameId

    let active = true
    async function loadGame() {
      const { data, error: gameError } = await queryClient.from('games').select('name, max_winners').eq('id', queryGameId).single()
      if (active && gameError) setError(gameError.message)
      if (active && data) {
        setGameName(data.name)
        setMaxWinners(data.max_winners ?? 1)
      }
    }

    void loadGame()
    return () => { active = false }
  }, [snapshotGameId])

  useEffect(() => {
    if (supabase && matchId) queueMicrotask(() => { void refreshSnapshot() })
  }, [matchId, refreshSnapshot])

  const realtime = useMatchRealtime({
    client: supabase,
    currentVersion: snapshot?.match.version ?? 0,
    matchId: snapshot?.match.id ?? null,
    onEnvelope: () => { void refreshSnapshot() },
    onGap: () => { void refreshSnapshot() },
    onReconcile: () => { void refreshSnapshot() },
  })

  const selectedWinnerCount = winnerTeamIds.length
  const canSubmitResult = Boolean(snapshot && snapshot.match.status !== 'completed' && !isMutating && (
    outcomeMode !== 'winner' || (selectedWinnerCount > 0 && selectedWinnerCount <= maxWinners)
  ))

  const resultByTeamId = useMemo(() => new Map((snapshot?.results ?? []).map((result) => [result.team_id, result])), [snapshot?.results])

  function toggleWinner(teamId: string) {
    setOutcomeMode('winner')
    setWinnerTeamIds((current) => {
      if (current.includes(teamId)) return current.filter((id) => id !== teamId)
      return maxWinners === 1 ? [teamId] : current.length < maxWinners ? [...current, teamId] : current
    })
  }

  async function handleStart() {
    if (!supabase || !snapshot || snapshot.match.status !== 'setup') return
    setIsMutating(true)
    setError(null)
    try {
      await startMatch(supabase, { clientEventId: randomEventId(), expectedVersion: snapshot.match.version, matchId: snapshot.match.id })
      await refreshSnapshot()
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to start this match.')
      await refreshSnapshot()
    } finally {
      setIsMutating(false)
    }
  }

  async function handleResult() {
    if (!supabase || !snapshot || !canSubmitResult) return
    setIsMutating(true)
    setError(null)
    const results = snapshot.teams.map((team, index) => ({
      outcome: outcomeMode === 'draw' ? 'draw' as const : outcomeMode === 'no_contest' ? 'no_contest' as const : winnerTeamIds.includes(team.id) ? 'win' as const : 'loss' as const,
      placement: outcomeMode === 'winner' ? (winnerTeamIds.includes(team.id) ? winnerTeamIds.indexOf(team.id) + 1 : index + 1) : undefined,
      teamId: team.id,
    }))

    try {
      await recordBinaryResult(supabase, { clientEventId: randomEventId(), expectedVersion: snapshot.match.version, matchId: snapshot.match.id, results })
      await refreshSnapshot()
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to record this result.')
      await refreshSnapshot()
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/app"><span className={styles.brandMark}>GOP Games</span> / Live table</Link>
        <div className={styles.headerActions}>
          <span className={`${styles.connection} ${styles[`connection${realtime.state}`]}`}>{realtime.state === 'live' ? 'Live' : realtime.state}</span>
          <ThemeToggle />
          <button className={styles.signOut} onClick={() => void signOut()} type="button">Sign out</button>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        {isLoading ? <p aria-busy="true" className={styles.status}>Setting the table…</p> : error && !snapshot ? <section className={styles.error} role="alert"><p>{error}</p><button className={styles.secondaryButton} onClick={() => void refreshSnapshot()} type="button">Try again</button></section> : snapshot ? (
          <>
            <section className={styles.hero} aria-labelledby="room-heading">
              <p className={styles.eyebrow}>{gameName} · {snapshot.match.status}</p>
              <h1 id="room-heading">Make the call.</h1>
              <p>Everyone in this group sees committed table changes as they happen.</p>
            </section>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <section className={styles.scoreboard} aria-label={`${gameName} scoreboard`}>
              {snapshot.teams.map((team) => {
                const result = resultByTeamId.get(team.id)
                const isWinner = winnerTeamIds.includes(team.id)
                return (
                  <button className={`${styles.team} ${isWinner ? styles.teamSelected : ''}`} disabled={snapshot.match.status === 'completed' || isMutating} key={team.id} onClick={() => toggleWinner(team.id)} type="button">
                    <span className={styles.teamNumber}>{String(team.position).padStart(2, '0')}</span>
                    <strong>{team.name}</strong>
                    <span>{result?.outcome ?? (isWinner ? 'Winner' : 'Tap to select')}</span>
                  </button>
                )
              })}
            </section>

            {snapshot.match.status === 'setup' && <button className={styles.primaryButton} disabled={isMutating} onClick={() => void handleStart()} type="button">{isMutating ? 'Starting…' : 'Start match'}</button>}

            {snapshot.match.status !== 'completed' && snapshot.match.status !== 'setup' && (
              <section className={styles.resultPanel} aria-labelledby="result-heading">
                <div><p className={styles.eyebrow}>Finish the table</p><h2 id="result-heading">How did it end?</h2></div>
                <div className={styles.modeRow}>
                  <button className={outcomeMode === 'winner' ? styles.modeActive : styles.modeButton} onClick={() => setOutcomeMode('winner')} type="button">Winner{maxWinners > 1 ? 's' : ''}</button>
                  <button className={outcomeMode === 'draw' ? styles.modeActive : styles.modeButton} onClick={() => { setOutcomeMode('draw'); setWinnerTeamIds([]) }} type="button">Draw</button>
                  <button className={outcomeMode === 'no_contest' ? styles.modeActive : styles.modeButton} onClick={() => { setOutcomeMode('no_contest'); setWinnerTeamIds([]) }} type="button">No contest</button>
                </div>
                <p className={styles.helper}>{outcomeMode === 'winner' ? `Select up to ${maxWinners} winner${maxWinners === 1 ? '' : 's'} above.` : 'This result will be recorded for every team.'}</p>
                <button className={styles.primaryButton} disabled={!canSubmitResult} onClick={() => void handleResult()} type="button">{isMutating ? 'Saving result…' : 'Record result'}</button>
              </section>
            )}

            {snapshot.match.status === 'completed' && <section className={styles.completePanel} aria-live="polite"><p className={styles.eyebrow}>Final result</p><h2>Table closed.</h2><p>Recorded at version {snapshot.match.version}. It is now part of your group history.</p></section>}
            <Link className={styles.backLink} to="/app">← Back to game room</Link>
          </>
        ) : null}
      </main>
    </div>
  )
}
