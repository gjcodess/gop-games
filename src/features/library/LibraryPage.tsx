import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAuth } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase/client'
import {
  derivePlayerStats,
  fetchCompletedMatchHistory,
  fetchPublishedRules,
  specialRulesAsText,
  type MatchHistoryEntry,
  type PlayerStats,
  type RuleEntry,
} from '../../lib/supabase/library'
import styles from './Library.module.css'

type LibraryData = {
  history: MatchHistoryEntry[]
  rules: RuleEntry[]
}

function ruleKey(entry: RuleEntry): string {
  return `${entry.game.id}:${entry.variant?.id ?? 'base'}`
}

function formatDate(value: string | null): string {
  if (!value) return 'Date not recorded'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function searchableRuleText(entry: RuleEntry): string {
  const specialRules = specialRulesAsText(entry.revision.special_rules).join(' ')
  return [entry.game.name, entry.game.description ?? '', entry.variant?.name ?? '', entry.revision.description, entry.revision.objective, entry.revision.setup, entry.revision.scoring_rules, entry.revision.winning_conditions, specialRules].join(' ').toLowerCase()
}

function searchableHistoryText(entry: MatchHistoryEntry): string {
  return [entry.gameName, entry.gameSlug, entry.notes ?? '', ...entry.participants.map((participant) => participant.displayName)].join(' ').toLowerCase()
}

function recordLabel(stats: PlayerStats | undefined): string {
  if (!stats) return 'No completed matches yet'
  return `${stats.wins}W · ${stats.losses}L · ${stats.draws}D`
}

export function LibraryPage() {
  const { profile, signOut, user } = useAuth()
  const [data, setData] = useState<LibraryData>({ history: [], rules: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedRuleKey, setSelectedRuleKey] = useState('')

  useEffect(() => {
    let active = true
    async function loadLibrary() {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        const [rules, history] = await Promise.all([
          fetchPublishedRules(supabase),
          fetchCompletedMatchHistory(supabase),
        ])
        if (active) {
          setData({ history, rules })
          setSelectedRuleKey(rules[0] ? ruleKey(rules[0]) : '')
          setError(null)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the game library.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadLibrary()
    return () => {
      active = false
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredRules = useMemo(
    () => normalizedQuery ? data.rules.filter((entry) => searchableRuleText(entry).includes(normalizedQuery)) : data.rules,
    [data.rules, normalizedQuery],
  )
  const filteredHistory = useMemo(
    () => normalizedQuery ? data.history.filter((entry) => searchableHistoryText(entry).includes(normalizedQuery)) : data.history,
    [data.history, normalizedQuery],
  )
  const stats = useMemo(() => derivePlayerStats(data.history), [data.history])
  const filteredStats = useMemo(
    () => normalizedQuery ? stats.filter((item) => item.displayName.toLowerCase().includes(normalizedQuery)) : stats,
    [normalizedQuery, stats],
  )
  const gameChoices = useMemo(() => {
    const seen = new Set<string>()
    return data.rules.filter((entry) => {
      if (seen.has(entry.game.id)) return false
      seen.add(entry.game.id)
      return true
    })
  }, [data.rules])
  const selectedEntry = filteredRules.find((entry) => ruleKey(entry) === selectedRuleKey) ?? filteredRules[0] ?? null
  const selectedGameEntries = selectedEntry ? filteredRules.filter((entry) => entry.game.id === selectedEntry.game.id) : []
  const currentStats = stats.find((item) => item.profileId === profile?.id)
  const searchResultCount = filteredRules.length + filteredHistory.length + filteredStats.length

  function selectGame(gameId: string) {
    const entry = filteredRules.find((candidate) => candidate.game.id === gameId)
    if (entry) setSelectedRuleKey(ruleKey(entry))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/app"><span className={styles.brandMark}>GOP Games</span> / Library</Link>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <button className={styles.signOut} onClick={() => void signOut()} type="button">Sign out</button>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.intro} aria-labelledby="library-heading">
          <p className={styles.eyebrow}>Rules, history, records</p>
          <h1 id="library-heading">Keep the table’s memory.</h1>
          <p>Find a rule before the next round, look back at a finished match, or see how the room is trending.</p>
        </section>

        <section className={styles.searchPanel} aria-label="Search the game library" role="search">
          <label className={styles.searchLabel} htmlFor="library-search">Search games, rules, players, and history</label>
          <div className={styles.searchRow}>
            <input id="library-search" onChange={(event) => setQuery(event.target.value)} placeholder="Try “Flip 7” or a player name" type="search" value={query} />
            {query && <button className={styles.clearButton} onClick={() => setQuery('')} type="button">Clear</button>}
          </div>
          {normalizedQuery && <p aria-live="polite" className={styles.searchSummary}>{searchResultCount} matching result{searchResultCount === 1 ? '' : 's'} across the library.</p>}
        </section>

        {isLoading ? (
          <p aria-busy="true" className={styles.status}>Loading rules and match history…</p>
        ) : error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : !supabase ? (
          <p className={styles.status}>Supabase is not configured in this environment.</p>
        ) : (
          <>
            <div className={styles.libraryLayout}>
              <nav aria-label="Games with published rules" className={styles.gameNav}>
                <div className={styles.navHeading}>
                  <p className={styles.eyebrow}>Rule shelf</p>
                  <h2>Games</h2>
                </div>
                {filteredRules.length > 0 ? gameChoices.filter((game) => filteredRules.some((entry) => entry.game.id === game.game.id)).map((game) => (
                  <button className={`${styles.gameButton} ${selectedEntry?.game.id === game.game.id ? styles.gameButtonActive : ''}`} key={game.game.id} onClick={() => selectGame(game.game.id)} type="button">
                    <span>{game.game.name}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                )) : <p className={styles.status}>No rules match that search.</p>}
              </nav>

              <section aria-labelledby="rules-heading" className={styles.rulesPanel}>
                {selectedEntry ? (
                  <>
                    <div className={styles.rulesHeader}>
                      <div>
                        <p className={styles.eyebrow}>{selectedEntry.variant?.name ?? 'Core rules'}</p>
                        <h2 id="rules-heading">{selectedEntry.game.name}</h2>
                        <p>{selectedEntry.game.description ?? selectedEntry.revision.description}</p>
                      </div>
                      {selectedGameEntries.length > 1 && (
                        <label className={styles.variantField}>
                          <span>Variant</span>
                          <select aria-label={`${selectedEntry.game.name} rules variant`} onChange={(event) => setSelectedRuleKey(event.target.value)} value={ruleKey(selectedEntry)}>
                            {selectedGameEntries.map((entry) => <option key={ruleKey(entry)} value={ruleKey(entry)}>{entry.variant?.name ?? 'Core rules'}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                    <div className={styles.ruleSections}>
                      <article><h3>Objective</h3><p>{selectedEntry.revision.objective}</p></article>
                      <article><h3>Setup</h3><p>{selectedEntry.revision.setup}</p></article>
                      <article><h3>Scoring</h3><p>{selectedEntry.revision.scoring_rules}</p></article>
                      <article><h3>Winning conditions</h3><p>{selectedEntry.revision.winning_conditions}</p></article>
                      {specialRulesAsText(selectedEntry.revision.special_rules).length > 0 && <article><h3>Special rules</h3><ul>{specialRulesAsText(selectedEntry.revision.special_rules).map((rule) => <li key={rule}>{rule}</li>)}</ul></article>}
                    </div>
                    <p className={styles.updatedAt}>Last updated {formatDate(selectedEntry.revision.published_at ?? selectedEntry.revision.updated_at)} · Revision {selectedEntry.revision.version}</p>
                  </>
                ) : <p className={styles.status}>Choose a game to read its rules.</p>}
              </section>
            </div>

            <section aria-labelledby="stats-heading" className={styles.statsPanel}>
              <div className={styles.sectionHeading}>
                <div><p className={styles.eyebrow}>The room’s record</p><h2 id="stats-heading">Player statistics</h2></div>
                <p className={styles.signedInAs}>{user?.email ?? 'Signed-in player'}</p>
              </div>
              <div className={styles.statsHighlight}>
                <div><span>Your record</span><strong>{recordLabel(currentStats)}</strong></div>
                <div><span>Win rate</span><strong>{currentStats ? `${currentStats.winRate}%` : '—'}</strong></div>
                <div><span>Completed</span><strong>{currentStats?.gamesPlayed ?? 0}</strong></div>
              </div>
              {filteredStats.length > 0 ? <ol className={styles.leaderboard}>{filteredStats.map((item) => <li key={item.profileId}><span><strong>{item.displayName}</strong><small>{item.gamesPlayed} completed</small></span><span>{item.wins}W · {item.losses}L · {item.winRate}%</span></li>)}</ol> : <p className={styles.status}>No player statistics match that search.</p>}
            </section>

            <section aria-labelledby="history-heading" className={styles.historyPanel}>
              <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Finished tables</p><h2 id="history-heading">Match history</h2></div><span className={styles.historyCount}>{filteredHistory.length} shown</span></div>
              {filteredHistory.length > 0 ? <ol className={styles.historyList}>{filteredHistory.map((match) => <li key={match.id}><div><strong>{match.gameName}</strong><span>{match.participants.map((participant) => `${participant.displayName} · ${participant.outcome ?? 'recorded'}`).join('  /  ')}</span></div><time dateTime={match.completedAt ?? match.createdAt}>{formatDate(match.completedAt ?? match.createdAt)}</time></li>)}</ol> : <p className={styles.status}>No completed matches are visible for this group yet.</p>}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
