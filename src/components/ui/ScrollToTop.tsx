import { useEffect, useState } from 'react'
import styles from './ScrollToTop.module.css'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 480)
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  function scrollToTop() {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ behavior: reducedMotion ? 'auto' : 'smooth', top: 0 })
  }

  return (
    <button aria-label="Scroll to top" className={`${styles.button} ${isVisible ? styles.visible : ''}`} onClick={scrollToTop} type="button">
      <span aria-hidden="true">↑</span>
    </button>
  )
}
