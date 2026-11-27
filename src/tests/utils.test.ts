import {
  formatBirthday,
  formatDate,
  getInitials,
  paginateList,
  toCanonicalBirthday,
} from '@/lib/utils'

describe('Shared formatting and pagination utils', () => {
  it('formats dates with configurable empty and invalid fallbacks', () => {
    expect(formatDate('2026-10-01T00:00:00.000Z')).toBe('Oct 01, 2026')
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined, 'Nov 09, 2026')).toBe('Nov 09, 2026')
    expect(formatDate('bad-date', '—', 'Unknown date')).toBe('Unknown date')
  })

  it('preserves UTC calendar day in formatBirthday and toCanonicalBirthday', () => {
    expect(formatBirthday('1995-05-05T00:00:00.000Z')).toBe('05/05/1995')
    expect(toCanonicalBirthday('05/05/1995')).toBe('1995-05-05')
    expect(toCanonicalBirthday('   ')).toBeNull()
  })

  it('derives up to two uppercase initials with fallback', () => {
    expect(getInitials('Maria Santos')).toBe('MS')
    expect(getInitials('Alex', 'OP')).toBe('A')
    expect(getInitials('', 'OP')).toBe('OP')
    expect(getInitials(null)).toBe('A')
  })

  it('paginates lists consistently', () => {
    const res = paginateList([1, 2, 3, 4, 5], 2, 2)
    expect(res).toEqual({
      data: [3, 4],
      total: 5,
      page: 2,
      pageSize: 2,
      totalPages: 3,
    })
    expect(paginateList([], 1, 10).totalPages).toBe(1)
  })
})
