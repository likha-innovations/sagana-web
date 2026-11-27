export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function formatDate(
  dateStr?: string | null,
  emptyFallback = '—',
  invalidFallback?: string
): string {
  if (!dateStr) return emptyFallback
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return invalidFallback ?? dateStr
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function parseCalendarDate(
  dateStr?: string | null
): { yyyy: string; mm: string; dd: string } | null {
  const trimmed = dateStr?.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return { yyyy: isoMatch[1], mm: isoMatch[2], dd: isoMatch[3] }
  }

  const mdyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (mdyMatch) {
    const mmNum = Number(mdyMatch[1])
    const ddNum = Number(mdyMatch[2])
    const yyyyNum = Number(mdyMatch[3])
    const utc = new Date(Date.UTC(yyyyNum, mmNum - 1, ddNum))
    if (
      utc.getUTCFullYear() === yyyyNum &&
      utc.getUTCMonth() === mmNum - 1 &&
      utc.getUTCDate() === ddNum
    ) {
      return { yyyy: mdyMatch[3], mm: mdyMatch[1], dd: mdyMatch[2] }
    }
  }

  return null
}

// Use UTC calendar parts so UTC-midnight birthdays do not shift by timezone.
export function formatBirthday(dateStr?: string | null): string {
  if (!dateStr) return ''
  const trimmed = dateStr.trim()
  const parts = parseCalendarDate(trimmed)
  if (parts) {
    return `${parts.mm}/${parts.dd}/${parts.yyyy}`
  }

  const d = new Date(trimmed)
  if (isNaN(d.getTime())) return trimmed
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${mm}/${dd}/${yyyy}`
}

export function toCanonicalBirthday(birthday?: string): string | null {
  const trimmed = birthday?.trim()
  if (!trimmed) return null
  const parts = parseCalendarDate(trimmed)
  return parts ? `${parts.yyyy}-${parts.mm}-${parts.dd}` : trimmed
}

export function getInitials(name?: string | null, fallback = 'A'): string {
  if (!name) return fallback
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || fallback
  )
}

export function paginateList<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  return {
    data: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  }
}
