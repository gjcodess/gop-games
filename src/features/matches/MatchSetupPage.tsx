import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { fetchActiveGameCatalog, type GameCatalogRow } from '../../lib/supabase/gameCatalog'
import { createMatch } from '../../lib/supabase/matches'
import { fetchActiveGroupProfiles, fetchActiveGroups, type ActiveGroup } from '../../lib/supabase/groups'
import { supabase } from '../../lib/supabase/client'
import type { PickerProfile } from '../../lib/supabase/profile'
import styles from './MatchSetup.module.css'

type SetupData = {
  games: GameCatalogRow[]
  groups: ActiveGroup[]
}

export function MatchSetupPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<SetupData>({ games: [], groups: [] })
  const [players, setPlayers] = useState<PickerProfile[]>([])
  const [gameId, setGameId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(profile ? [profile.id] : [])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadSetup() {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        const [{ games }, groups] = await Promise.all([
          fetchActiveGameCatalog(supabase),
          fetchActiveGroups(supabase),
        ])
        const binaryGames = games.filter((game) => game.scoring_model === 'binary')
        if (active) {
          setData({ games: binaryGames, groups })
          setGameId(binaryGames[0]?.id ?? '')
          setGroupId(groups[0]?.id ?? '')
          setError(null)
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load match setup.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadSetup()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadPlayers() {
      if (!supabase || !groupId) {
        setPlayers([])
        return
      }

      try {
        const nextPlayers = await fetchActiveGroupProfiles(supabase, groupId)
        if (active) {
          setPlayers(nextPlayers)
          setSelectedPlayerIds((current) => current.filter((id) => nextPlayers.some((player) => player.id === id)))
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load group players.')
      }
    }

    void loadPlayers()
    return () => { active = false }
  }, [groupId])

  const selectedGame = useMemo(() => data.games.find((game) => game.id === gameId) ?? null, [data.games, gameId])
  const canSubmit = Boolean(supabase && gameId && groupId && selectedPlayerIds.length >= (selectedGame?.min_players ?? 2) && selectedPlayerIds.length <= (selectedGame?.max_players ?? selectedPlayerIds.length) && !isSubmitting)

  function togglePlayer(profileId: string) {
    setSelectedPlayerIds((current) => current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId])
  }

  async function handleSubmit() {
    if (!supabase || !canSubmit) return

    setError(null)
    setIsSubmitting(true)
    try {
      const matchId = await createMatch(supabase, {
        gameId,
        groupId,
        notes: notes.trim() || undefined,
        participantProfileIds: selectedPlayerIds,
      })
      navigate(`/app/matches/${matchId}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create this match.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/app"><span className={styles.brandMark}>GOP Games</span> / New match</Link>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <button className={styles.signOut} onClick={() => void signOut()} type="button">Sign out</button>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.hero} aria-labelledby="setup-heading">
          <p className={styles.eyebrow}>Start a live table</p>
          <h1 id="setup-heading">Who’s playing?</h1>
          <p>Choose a binary win/loss game and the players around the table. The room will keep the result synced for everyone.</p>
        </section>

        {isLoading ? <p aria-busy="true" className={styles.status}>Loading games and groups…</p> : error ? <p className={styles.error} role="alert">{error}</p> : !supabase ? <p className={styles.status}>Supabase is not configured in this environment.</p> : data.groups.length === 0 ? (
          <section className={styles.emptyState} aria-labelledby="group-heading">
            <p className={styles.eyebrow}>Membership needed</p>
            <h2 id="group-heading">No active game group yet.</h2>
            <p>Your account needs an active group membership before it can create a shared match. Ask a group owner to activate your membership.</p>
            <Link className={styles.secondaryButton} to="/app">Back to game room</Link>
          </section>
        ) : (
          <section className={styles.formPanel} aria-label="New match setup">
            <label className={styles.field}>
              Game
              <select onChange={(event) => setGameId(event.target.value)} value={gameId}>
                {data.games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}
              </select>
            </label>

            <label className={styles.field}>
              Group
              <select onChange={(event) => setGroupId(event.target.value)} value={groupId}>
                {data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>

            <fieldset className={styles.playerFieldset}>
              <legend>Players <span>{selectedPlayerIds.length} selected</span></legend>
              <div className={styles.playerList}>
                {players.map((player) => (
                  <label className={`${styles.playerOption} ${selectedPlayerIds.includes(player.id) ? styles.playerSelected : ''}`} key={player.id}>
                    <input checked={selectedPlayerIds.includes(player.id)} onChange={() => togglePlayer(player.id)} type="checkbox" />
                    <span>{player.display_name}</span>
                    {player.id === profile?.id && <small>You</small>}
                  </label>
                ))}
              </div>
              {players.length === 0 && <p className={styles.status}>No active players are available in this group.</p>}
            </fieldset>

            <label className={styles.field}>
              Notes <span className={styles.optional}>Optional</span>
              <textarea maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder="Table stakes, house rules, or a quick note" rows={3} value={notes} />
            </label>

            {selectedGame && <p className={styles.helper}>This game needs {selectedGame.min_players}–{selectedGame.max_players ?? '∞'} players.</p>}
            <button className={styles.primaryButton} disabled={!canSubmit} onClick={() => void handleSubmit()} type="button">{isSubmitting ? 'Opening table…' : 'Open live table'}</button>
          </section>
        )}
      </main>
    </div>
  )
}
