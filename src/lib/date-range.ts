/**
 * Resolves a dateRange filter value (e.g. 'all', '7d', '30d', 'this-year', 'custom:2026-01-01_2026-06-30')
 * into a { start, end } Date range, or null if 'all' (no filtering).
 */
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

  // Custom: "custom:YYYY-MM-DD_YYYY-MM-DD"
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

/**
 * Returns true if the given date string falls within the resolved date range.
 * dateStr can be an ISO string or any parseable date string.
 */
export function isDateInRange(dateStr: string, dateRange: string): boolean {
  const range = resolveDateRange(dateRange)
  if (!range) return true // 'all' → everything matches

  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return true // can't parse → don't filter out

  return d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime()
}

/**
 * Returns the formatted date range for the current month in real-time,
 * e.g. "Oct 1–31, 2026", "Nov 1–30, 2026", etc.
 */
export function getCurrentMonthDateRange(date = new Date()): string {
  const monthName = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate()
  return `${monthName} 1–${lastDay}, ${year}`
}

