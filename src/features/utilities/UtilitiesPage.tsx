import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAuth } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase/client'
import { fetchPickerProfiles, type PickerProfile } from '../../lib/supabase/profile'
import { assignTeams, flipCoin, pickOddOneOut, pickRandom } from './randomizers'
import styles from './Utilities.module.css'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function Avatar({ profile, decorative = false }: { decorative?: boolean; profile: PickerProfile }) {
  if (profile.avatarUrl) {
    return <img alt={decorative ? '' : profile.display_name} className={styles.avatarImage} loading="lazy" src={profile.avatarUrl} />
  }

  return <span aria-hidden={decorative} className={styles.avatarFallback}>{initials(profile.display_name)}</span>
}

function ProfileChip({ profile, selected, onToggle }: { onToggle: () => void; profile: PickerProfile; selected: boolean }) {
  return (
    <label className={`${styles.profileChip} ${selected ? styles.profileChipSelected : ''}`}>
      <input aria-label={profile.display_name} checked={selected} onChange={onToggle} type="checkbox" />
      <Avatar profile={profile} />
      <span>{profile.display_name}</span>
    </label>
  )
}

export function UtilitiesPage() {
  const { profile, signOut, user } = useAuth()
  const [profiles, setProfiles] = useState<PickerProfile[]>([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])
  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<PickerProfile[][]>([])
  const [teamMessage, setTeamMessage] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<PickerProfile | null>(null)
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads')
  const [oddOneOut, setOddOneOut] = useState<PickerProfile | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const spinTimer = useRef<number | null>(null)
  const coinTimer = useRef<number | null>(null)
  const profileId = profile?.id
  const profileName = profile?.display_name
  const profileAvatarPath = profile?.avatar_path ?? null
  const fallbackProfile = useMemo<PickerProfile | null>(() => profileId
    ? { avatarUrl: null, avatar_path: profileAvatarPath, display_name: profileName ?? 'Player', id: profileId }
    : null, [profileAvatarPath, profileId, profileName])

  useEffect(() => {
    let active = true
    async function loadProfiles() {
      if (!supabase) {
        if (fallbackProfile) {
          setProfiles([fallbackProfile])
          setSelectedProfileIds([fallbackProfile.id])
        }
        setIsLoadingProfiles(false)
        return
      }

      try {
        const nextProfiles = await fetchPickerProfiles(supabase)
        if (active) {
          setProfiles(nextProfiles)
          setSelectedProfileIds(nextProfiles.map((item) => item.id))
          setProfileError(null)
        }
      } catch (error) {
        if (active) {
          setProfileError(error instanceof Error ? error.message : 'Unable to load the game-night players.')
        }
      } finally {
        if (active) {
          setIsLoadingProfiles(false)
        }
      }
    }

    void loadProfiles()
    return () => {
      active = false
    }
  }, [fallbackProfile])

  useEffect(() => () => {
    if (spinTimer.current) window.clearTimeout(spinTimer.current)
    if (coinTimer.current) window.clearTimeout(coinTimer.current)
  }, [])

  const selectedProfiles = useMemo(
    () => profiles.filter((item) => selectedProfileIds.includes(item.id)),
    [profiles, selectedProfileIds],
  )

  function toggleProfile(profileId: string) {
    setSelectedProfileIds((current) => current.includes(profileId)
      ? current.filter((id) => id !== profileId)
      : [...current, profileId])
  }

  function dealTeams() {
    try {
      setTeams(assignTeams(selectedProfiles, teamCount))
      setTeamMessage(null)
    } catch (error) {
      setTeamMessage(error instanceof Error ? error.message : 'Choose more players before dealing teams.')
      setTeams([])
    }
  }

  function spinPerson() {
    if (profiles.length < 1 || isSpinning) {
      return
    }

    setIsSpinning(true)
    setSelectedPerson(null)
    spinTimer.current = window.setTimeout(() => {
      setSelectedPerson(pickRandom(profiles))
      setIsSpinning(false)
    }, 1200)
  }

  function tossCoin() {
    if (isFlipping) {
      return
    }

    setIsFlipping(true)
    coinTimer.current = window.setTimeout(() => {
      setCoinSide(flipCoin())
      setIsFlipping(false)
    }, 800)
  }

  function chooseOddOneOut() {
    if (selectedProfiles.length < 1) {
      setOddOneOut(null)
      return
    }
    setOddOneOut(pickOddOneOut(selectedProfiles))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/app"><span className={styles.brandMark}>GOP Games</span> / Night tools</Link>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <button className={styles.signOut} onClick={() => void signOut()} type="button">Sign out</button>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.intro} aria-labelledby="utilities-heading">
          <p className={styles.eyebrow}>Game-night utilities</p>
          <h1 id="utilities-heading">Settle the little moments.</h1>
          <p>Pick a teammate, break a tie, or give the table a tiny bit of drama. Every tool is quick to use, keyboard-accessible, and safe to replay.</p>
        </section>

        <section className={styles.playerDock} aria-labelledby="players-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Shared player pool</p>
              <h2 id="players-heading">Who is at the table?</h2>
            </div>
            <p className={styles.signedInAs}>{user?.email ?? 'Signed-in player'}</p>
          </div>
          {isLoadingProfiles ? (
            <p className={styles.status} aria-live="polite">Loading player profiles…</p>
          ) : profileError ? (
            <p className={styles.error} role="alert">{profileError}</p>
          ) : profiles.length > 0 ? (
            <div className={styles.profileList}>
              {profiles.map((item) => <ProfileChip key={item.id} onToggle={() => toggleProfile(item.id)} profile={item} selected={selectedProfileIds.includes(item.id)} />)}
            </div>
          ) : (
            <p className={styles.status}>No shared profiles are available yet.</p>
          )}
        </section>

        <div className={styles.toolLayout}>
          <section className={`${styles.toolPanel} ${styles.teamTool}`} aria-labelledby="teams-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Deal the table</p>
                <h2 id="teams-heading">Random teams</h2>
              </div>
              <label className={styles.compactField}>
                <span>Teams</span>
                <select aria-label="Number of teams" onChange={(event) => setTeamCount(Number(event.target.value))} value={teamCount}>
                  {[2, 3, 4].map((count) => <option key={count} value={count}>{count}</option>)}
                </select>
              </label>
            </div>
            <p className={styles.toolDescription}>A fresh deal keeps the teams balanced while making sure every selected player appears once.</p>
            <button className={styles.primaryButton} disabled={selectedProfiles.length < teamCount} onClick={dealTeams} type="button">Deal teams</button>
            {teamMessage && <p className={styles.error} role="alert">{teamMessage}</p>}
            {teams.length > 0 && (
              <div className={styles.teamResults} aria-live="polite">
                {teams.map((team, index) => (
                  <div className={styles.team} key={`team-${index}`}>
                    <p>Team {index + 1}</p>
                    <ul>{team.map((item) => <li key={item.id}><Avatar profile={item} />{item.display_name}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={`${styles.toolPanel} ${styles.personTool}`} aria-labelledby="person-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Spin the wheel</p>
                <h2 id="person-heading">Random person</h2>
              </div>
            </div>
            <div className={styles.wheelStage}>
              <div aria-hidden="true" className={`${styles.wheel} ${isSpinning ? styles.wheelSpinning : ''}`}>
                <span className={styles.wheelPointer}>▼</span>
                {profiles.map((item, index) => {
                  const angle = (360 / Math.max(profiles.length, 1)) * index
                  return <span className={styles.wheelAvatar} key={item.id} style={{ transform: `rotate(${angle}deg) translateY(-5.7rem) rotate(-${angle}deg)` }}><Avatar decorative profile={item} /></span>
                })}
              </div>
            </div>
            <button className={styles.primaryButton} disabled={profiles.length < 1 || isSpinning} onClick={spinPerson} type="button">{isSpinning ? 'Spinning…' : 'Spin the wheel'}</button>
            <p aria-live="polite" className={styles.result}>{selectedPerson ? `${selectedPerson.display_name} is up.` : 'The wheel is waiting.'}</p>
          </section>

          <section className={`${styles.toolPanel} ${styles.coinTool}`} aria-labelledby="coin-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Quick call</p>
                <h2 id="coin-heading">Flip a coin</h2>
              </div>
            </div>
            <div aria-label={`Coin shows ${coinSide}`} className={`${styles.coin} ${isFlipping ? styles.coinFlipping : ''}`} role="img">
              <span>{coinSide === 'heads' ? 'H' : 'T'}</span>
            </div>
            <button className={styles.secondaryButton} disabled={isFlipping} onClick={tossCoin} type="button">{isFlipping ? 'In the air…' : 'Flip it'}</button>
            <p aria-live="polite" className={styles.result}>{isFlipping ? 'The coin is in the air.' : `It landed ${coinSide}.`}</p>
          </section>

          <section className={`${styles.toolPanel} ${styles.maibaTool}`} aria-labelledby="maiba-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>No debate</p>
                <h2 id="maiba-heading">Maiba Taya</h2>
              </div>
            </div>
            <p className={styles.toolDescription}>Choose an odd one out from the selected table players.</p>
            <button className={styles.secondaryButton} disabled={selectedProfiles.length < 1} onClick={chooseOddOneOut} type="button">Choose the tagger</button>
            <p aria-live="polite" className={styles.result}>{oddOneOut ? `${oddOneOut.display_name} is taya.` : 'No tagger chosen yet.'}</p>
          </section>
        </div>
      </main>
    </div>
  )
}
