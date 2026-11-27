import {
  resetPasswordConfirmSchema,
  resetPasswordRequestSchema,
  verifyCodeSchema,
} from '@/types/auth'
import {
  PASSWORD_RULES,
  applyOtpChange,
  extractClerkErrorMessage,
  isPasswordValid,
} from '@/lib/password-reset'

describe('Password Reset Validation & Helpers', () => {
  describe('Zod schemas', () => {
    it('validates password reset request email', () => {
      expect(resetPasswordRequestSchema.safeParse({ email: 'admin@sagana.ph' }).success).toBe(true)
      expect(resetPasswordRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
      expect(resetPasswordRequestSchema.safeParse({ email: '   ' }).success).toBe(false)
    })

    it('validates 6-digit verification code', () => {
      expect(verifyCodeSchema.safeParse({ code: '123456' }).success).toBe(true)
      expect(verifyCodeSchema.safeParse({ code: '12345' }).success).toBe(false)
      expect(verifyCodeSchema.safeParse({ code: '12a456' }).success).toBe(false)
    })

    it('validates reset confirmation payload with 12+ character password', () => {
      expect(
        resetPasswordConfirmSchema.safeParse({ code: '123456', password: 'StrongPass1!' }).success
      ).toBe(true)
      expect(
        resetPasswordConfirmSchema.safeParse({ code: '123456', password: 'Short1!' }).success
      ).toBe(false)
    })
  })

  describe('PASSWORD_RULES & isPasswordValid', () => {
    it('accepts password with 12+ chars, number, and symbol', () => {
      expect(isPasswordValid('SaganaAdmin1!')).toBe(true)
    })

    it('rejects password missing length, number, or symbol', () => {
      expect(isPasswordValid('Short1!')).toBe(false)
      expect(isPasswordValid('NoNumbersHere!')).toBe(false)
      expect(isPasswordValid('NoSymbolsHere12')).toBe(false)
      expect(PASSWORD_RULES.map((r) => r.test('NoSymbolsHere12'))).toEqual([true, true, false])
    })
  })

  describe('applyOtpChange', () => {
    it('sets a single digit and advances focus', () => {
      const empty = ['', '', '', '', '', '']
      expect(applyOtpChange(empty, 0, '7')).toEqual({
        nextOtp: ['7', '', '', '', '', ''],
        focusIndex: 1,
      })
    })

    it('fills all boxes when a 6-digit code is pasted into any box', () => {
      const partial = ['1', '', '', '', '', '']
      expect(applyOtpChange(partial, 2, '98-76-54')).toEqual({
        nextOtp: ['9', '8', '7', '6', '5', '4'],
        focusIndex: 5,
      })
    })

    it('clears current digit when emptied', () => {
      const filled = ['1', '2', '', '', '', '']
      expect(applyOtpChange(filled, 1, '')).toEqual({
        nextOtp: ['1', '', '', '', '', ''],
        focusIndex: null,
      })
    })
  })

  describe('extractClerkErrorMessage', () => {
    it('prefers Clerk longMessage, then message, then Error.message, then fallback', () => {
      expect(
        extractClerkErrorMessage(
          { errors: [{ longMessage: 'Detailed Clerk error', message: 'Short' }] },
          'Fallback'
        )
      ).toBe('Detailed Clerk error')
      expect(
        extractClerkErrorMessage({ errors: [{ message: 'Short Clerk error' }] }, 'Fallback')
      ).toBe('Short Clerk error')
      expect(extractClerkErrorMessage(new Error('Standard error'), 'Fallback')).toBe('Standard error')
      expect(extractClerkErrorMessage(null, 'Fallback')).toBe('Fallback')
    })
  })
})
