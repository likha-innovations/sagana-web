
export function resolveDateRange(
  dateRange: string
): { start: Date; end: Date } | null {
  if (!dateRange || dateRange === 'all') return null

  const now = new Date()
  now.setHours(23, 59, 59, 999)

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
