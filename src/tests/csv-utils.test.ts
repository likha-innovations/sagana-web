import { escapeCsvCell } from '@/lib/csv-utils'

describe('escapeCsvCell', () => {
  it('neutralizes formula-leading strings while keeping numeric cells unprefixed', () => {
    expect(escapeCsvCell('=CMD()')).toBe("'=CMD()")
    expect(escapeCsvCell('+1+1')).toBe("'+1+1")
    expect(escapeCsvCell('-2+3')).toBe("'-2+3")
    expect(escapeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(escapeCsvCell('\t=1')).toBe("'\t=1")
    expect(escapeCsvCell(-42)).toBe('-42')
    expect(escapeCsvCell(150)).toBe('150')
  })

  it('escapes delimiters and doubles quotes after formula neutralization', () => {
    expect(escapeCsvCell('=HYPERLINK("a","b")')).toBe('"\'=HYPERLINK(""a"",""b"")"')
    expect(escapeCsvCell('Santos, Maria')).toBe('"Santos, Maria"')
    expect(escapeCsvCell(null)).toBe('')
  })
})
