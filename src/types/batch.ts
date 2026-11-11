import { z } from 'zod'

export const batchFeedstockSchema = z.object({
  id: z.string(),
  feedstockId: z.string().optional(),
  name: z.string(),
  category: z.string(),
  weightKg: z.number().nonnegative(),
})
export type BatchFeedstock = z.infer<typeof batchFeedstockSchema>

export const compostingPhaseSchema = z.object({
  phaseName: z.string(),
  status: z.string().optional(),
  timestamp: z.string().optional(),
})
export type CompostingPhase = z.infer<typeof compostingPhaseSchema>

// Direct Prisma-aligned CompostBatch schema matching sagana-mobile
export const compostBatchSchema = z.object({
  id: z.string(),
  machineId: z.string(),
  userId: z.string().optional(),
  batchCode: z.string(),
  status: z.string().default('active'),
  startDate: z.string(),
  completionDate: z.string().nullable().optional(),
  totalWeight: z.number().nonnegative(),
  finalWeight: z.number().nonnegative().nullable().optional(),
  machineName: z.string().optional(),
  feedstocks: z.array(batchFeedstockSchema).optional().default([]),
  compostingPhases: z.array(compostingPhaseSchema).optional().default([]),
})
export type CompostBatch = z.infer<typeof compostBatchSchema>

// Batch alias pointing directly to the domain CompostBatch
export type Batch = CompostBatch
export type BatchPhase = 'Cooling' | 'Thermophilic' | 'Mesophilic' | 'Completed'

export function getBatchPhase(batch: CompostBatch): BatchPhase {
  if (batch.completionDate || batch.status?.toLowerCase() === 'completed') {
    return 'Completed'
  }
  const phases = batch.compostingPhases || []
  const latestPhase = phases[phases.length - 1]?.phaseName?.toLowerCase()
  if (latestPhase?.includes('cool')) return 'Cooling'
  if (latestPhase?.includes('thermo')) return 'Thermophilic'
  return 'Mesophilic'
}

export function getDaysComposting(batch: CompostBatch): number {
  const start = new Date(batch.startDate).getTime()
  if (isNaN(start)) return 0
  const end = batch.completionDate ? new Date(batch.completionDate).getTime() : Date.now()
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

export function formatBatchDate(dateStr: string): string {
  const d = new Date(dateStr)
  return isNaN(d.getTime())
    ? 'Unknown date'
    : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

