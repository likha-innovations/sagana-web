export interface PasswordRule {
  id: 'length' | 'number' | 'symbol'
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: 'At least 12+ characters',
    test: (password) => password.length >= 12,
  },
  {
    id: 'number',
    label: 'Must have a number (0–9)',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'symbol',
    label: 'Must have a special symbol (e.g., !@#$)',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
]

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}

export function applyOtpChange(
  otp: string[],
  index: number,
  rawValue: string
): { nextOtp: string[]; focusIndex: number | null } {
  const digits = rawValue.replace(/\D/g, '')
  const nextOtp = [...otp]

  if (!digits) {
    nextOtp[index] = ''
    return { nextOtp, focusIndex: null }
  }

  if (digits.length === 1) {
    nextOtp[index] = digits
    return { nextOtp, focusIndex: index < 5 ? index + 1 : null }
  }

  // Handle paste or autofill starting from 0 when a full 6-digit code is pasted
  const startIndex = digits.length >= 6 ? 0 : index
  const slice = digits.slice(0, 6 - startIndex).split('')
  slice.forEach((digit, offset) => {
    nextOtp[startIndex + offset] = digit
  })

  return {
    nextOtp,
    focusIndex: Math.min(startIndex + slice.length, 5),
  }
}

export function extractClerkErrorMessage(err: unknown, fallback: string): string {
  const clerkErr = err as {
    errors?: Array<{ longMessage?: string; message?: string }>
    message?: string
  } | null

  return (
    clerkErr?.errors?.[0]?.longMessage ||
    clerkErr?.errors?.[0]?.message ||
    (err instanceof Error ? err.message : clerkErr?.message) ||
    fallback
  )
}

export function isClerkSessionExistsError(err: unknown): boolean {
  const clerkErr = err as {
    errors?: Array<{ code?: string }>
  } | null
  const hasSessionCode = clerkErr?.errors?.some(
    (e) => e.code === 'session_exists' || e.code === 'identifier_already_signed_in'
  )
  if (hasSessionCode) return true
  return /already signed in|session_exists/i.test(extractClerkErrorMessage(err, ''))
}
