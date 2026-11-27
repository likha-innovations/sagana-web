export const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'this-month', label: 'This month' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'this-year', label: 'This year' },
]

export function resolveDateRange(
  dateRange: string
): { start: Date; end: Date } | null {
  if (!dateRange || dateRange === 'all') return null

  const now = new Date()
  now.setHours(23, 59, 59, 999)

  if (dateRange === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }

  if (dateRange === '7d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }

  if (dateRange === '30d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }

  if (dateRange === 'this-year') {
    const start = new Date(now.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }

  if (dateRange.startsWith('custom:')) {
    const parts = dateRange.slice(7).split('_')
    if (parts.length === 2) {
      const start = new Date(parts[0] + 'T00:00:00')
      const end = new Date(parts[1] + 'T23:59:59.999')
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return { start, end }
      }
    }
  }

  return null
}

export function isDateInRange(dateStr: string, dateRange: string): boolean {
  const range = resolveDateRange(dateRange)
  if (!range) return true

  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return true

  return d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime()
}

export function isOnOrBeforeDate(dateStr: string, asOf?: Date): boolean {
  if (!asOf) return true
  const created = new Date(dateStr).getTime()
  return isNaN(created) || created <= asOf.getTime()
}

export function getCurrentMonthDateRange(date = new Date()): string {
  const monthName = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate()
  return `${monthName} 1–${lastDay}, ${year}`
}

export function formatDisplayRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('en-US', opts)

  if (sameMonth) {
    return `${fmt(start, { month: 'short' })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
  }
  if (sameYear) {
    return `${fmt(start, { month: 'short' })} ${start.getDate()} – ${fmt(end, { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`
  }
  return `${fmt(start, { month: 'short', day: 'numeric', year: 'numeric' })} – ${fmt(end, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function formatDateRangeLabel(value?: string): string {
  if (!value || value === 'all') return 'All Time'
  if (value === 'this-month') return getCurrentMonthDateRange()
  if (value === '7d') return 'Last 7 Days'
  if (value === '30d') return 'Last 30 Days'
  if (value === 'this-year') return 'This Year'
  if (value.startsWith('custom:')) {
    const [startStr, endStr] = value.slice(7).split('_')
    if (startStr && endStr) {
      const start = new Date(`${startStr}T00:00:00`)
      const end = new Date(`${endStr}T00:00:00`)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return formatDisplayRange(start, end)
      }
    }
  }
  return value
}
