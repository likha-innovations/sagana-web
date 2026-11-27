import {
  getOperatorBarangayName,
  getOperatorName,
  type OperatorAccount,
} from '@/types/operator'
import {
  getMachineCode,
  getMachineCurrentBatch,
  getMachineRegisteredBy,
  isMachineOnline,
  type Machine,
} from '@/types/machine'
import type { CompostBatch } from '@/types/batch'
import type { DashboardData } from '@/types/dashboard'
import { getBatchPhase, getDaysComposting, formatBatchDate } from '@/types/batch'
import { formatDate } from './utils'
import { downloadCsv } from './csv-utils'

function getTimestampSuffix(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function exportOperatorsToSheets(accounts: OperatorAccount[]): void {
  const headers = [
    'Operator ID',
    'Name',
    'Email',
    'Barangay',
    'Status',
    'Date Joined',
  ]

  const rows = accounts.map((acc) => [
    acc.id,
    getOperatorName(acc),
    acc.email,
    getOperatorBarangayName(acc),
    acc.status.toUpperCase(),
    formatDate(acc.createdAt),
  ])

  downloadCsv(`operator-accounts-${getTimestampSuffix()}`, headers, rows)
}

export function exportBatchesToSheets(batches: CompostBatch[]): void {
  const headers = [
    'Batch Code',
    'Machine',
    'Phase / Status',
    'Feedstock Weight (kg)',
    'Start Date',
    'Composting Time (Days)',
    'Completed Date',
  ]

  const rows = batches.map((b) => [
    b.batchCode,
    b.machineName || b.machineId || 'N/A',
    getBatchPhase(b),
    b.totalWeight,
    formatBatchDate(b.startDate),
    getDaysComposting(b),
    b.completionDate ? formatBatchDate(b.completionDate) : 'In Progress',
  ])

  downloadCsv(`compost-batches-${getTimestampSuffix()}`, headers, rows)
}

export function exportMachinesToSheets(machines: Machine[]): void {
  const headers = [
    'Machine Code',
    'Machine Name',
    'Registered By',
    'Status',
    'Current Batch & Phase',
    'Date Registered',
  ]

  const rows = machines.map((m) => {
    const batch = getMachineCurrentBatch(m)
    const status = isMachineOnline(m) ? 'ONLINE' : 'OFFLINE'
    return [
      getMachineCode(m),
      m.name,
      getMachineRegisteredBy(m) ?? '—',
      status,
      batch ? `${batch.code} (${batch.stage})` : 'Idle / None',
      formatDate(m.createdAt),
    ]
  })

  downloadCsv(`machines-inventory-${getTimestampSuffix()}`, headers, rows)
}

export function exportDashboardToSheets(
  data: DashboardData,
  barangay = 'Barangay 176-E',
  dateRange = 'Current Month'
): void {
  const { kpis, recentBatches } = data

  const headers = [
    'Section',
    'Barangay',
    'Period',
    'Metric / Batch Code',
    'Value / Operator',
    'Unit / Machine',
    'Weight / Metric',
    'Days / Note',
    'Completed Date',
  ]

  const kpiRows = kpis.map((kpi) => [
    'Executive KPI',
    barangay,
    dateRange,
    String(kpi.label ?? ''),
    String(kpi.value ?? ''),
    String(kpi.unit ?? ''),
    '',
    '',
    '',
  ])

  const batchRows = recentBatches.map((b) => [
    'Recently Completed Batch',
    b.barangay,
    dateRange,
    b.id,
    b.account,
    b.machine,
    b.weight,
    b.days,
    b.completed,
  ])

  downloadCsv(`dashboard-report-${getTimestampSuffix()}`, headers, [...kpiRows, ...batchRows])
}
