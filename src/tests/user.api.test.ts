import { api } from '@/api/client'
import { userApi } from '@/api/user.api'
import { updateProfileSchema } from '@/types/auth'

jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}))

describe('user.api & updateProfileSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends firstName and lastName to PATCH /me', async () => {
    const updatedUser = {
      id: 'user_1',
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      role: 'admin',
      status: 'active',
    }
    jest.mocked(api.patch).mockResolvedValueOnce(updatedUser)

    const result = await userApi.updateProfile({
      firstName: 'Maria',
      lastName: 'Santos',
    })

    expect(api.patch).toHaveBeenCalledWith('/me', {
      firstName: 'Maria',
      lastName: 'Santos',
    })
    expect(result).toEqual(updatedUser)
  })

  it('validates firstName and lastName length to match backend DTO', () => {
    expect(
      updateProfileSchema.safeParse({ firstName: 'Maria', lastName: 'Santos' }).success
    ).toBe(true)
    expect(
      updateProfileSchema.safeParse({ firstName: 'M', lastName: 'Santos' }).success
    ).toBe(false)
    expect(
      updateProfileSchema.safeParse({ firstName: 'Maria', lastName: '' }).success
    ).toBe(false)
  })
})
