import type { HTMLAttributes } from 'react'
import styles from './LoadingSkeleton.module.css'

type LoadingSkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  width?: string
}

export function LoadingSkeleton({ className, width, ...props }: LoadingSkeletonProps) {
  return <span aria-hidden="true" className={[styles.skeleton, className].filter(Boolean).join(' ')} style={{ width }} {...props} />
}
