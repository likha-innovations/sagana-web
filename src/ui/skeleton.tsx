import { type HTMLAttributes } from 'react'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const base = 'animate-pulse bg-[#E2E1DC]/60'
  const rounded = className?.includes('rounded') ? '' : 'rounded-md'
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`${base} ${rounded} ${className ?? ''}`.trim()}
      {...props}
    />
  )
}
