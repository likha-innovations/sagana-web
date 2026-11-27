import { api } from './client'
import { createLogger } from '@/lib/logger'
import type { User, UpdateProfileInput } from '@/types/auth'

const logger = createLogger('UserApi')

export const userApi = {
  getProfile: (): Promise<User> => {
    logger.debug('Fetching current user profile')
    return api.get<User>('/me')
  },
  updateProfile: (data: UpdateProfileInput): Promise<User> => {
    logger.info('Updating current user profile')
    return api.patch<User>('/me', data)
  },
}
