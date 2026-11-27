import { api } from './client'
import { createLogger } from '@/lib/logger'
import type { BarangayCodeResponse } from '@/types/barangay'

const logger = createLogger('BarangayApi')

export const barangayApi = {
  getCode: async (): Promise<BarangayCodeResponse> => {
    logger.debug('Fetching barangay code')
    return api.get<BarangayCodeResponse>('/barangays/code')
  },
}
