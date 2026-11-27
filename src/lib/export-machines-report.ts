import {
  getMachineCode,
  getMachineCurrentBatch,
  getMachineRegisteredBy,
  isMachineOnline,
  type Machine,
} from '@/types/machine'
import { formatDate } from './utils'
import {
  exportTablePdf,
  formatPdfDateRange,
  formatPdfFilterLabel,
  type PdfTableColumn,
} from './pdf-utils'

export interface ExportMachinesReportOptions {
  machines: Machine[]
  search?: string
  status?: string
  dateRange?: string
}

const MACHINE_COLUMNS: PdfTableColumn[] = [
  { header: 'Machine ID', width: 24, fontStyle: 'bold' },
  { header: 'Machine Name', width: 32 },
  { header: 'Registered By', width: 32 },
  { header: 'Status', width: 20 },
  { header: 'Current Batch & Phase', width: 44 },
  { header: 'Date Registered', width: 26 },
]

export function exportMachinesReport({
  machines,
  search = '',
  status = 'all',
  dateRange = 'All Time',
}: ExportMachinesReportOptions): void {
  const onlineCount = machines.filter((m) => isMachineOnline(m)).length
  const offlineCount = machines.length - onlineCount
  const searchLabel = search.trim() ? `"${search.trim()}"` : 'All Machines'

  exportTablePdf({
    title: 'Machines Inventory Report',
    metadata: [
      { label: 'Date Range', value: formatPdfDateRange(dateRange) },
      { label: 'Status Filter', value: formatPdfFilterLabel(status) },
      { label: 'Search Query', value: searchLabel },
    ],
    summary: `Summary: ${machines.length} total machine${machines.length === 1 ? '' : 's'} (${onlineCount} online, ${offlineCount} offline)`,
    columns: MACHINE_COLUMNS,
    rows: machines.map((m) => {
      const batch = getMachineCurrentBatch(m)
      return [
        getMachineCode(m),
        m.name,
        getMachineRegisteredBy(m) || '—',
        isMachineOnline(m) ? 'Online' : 'Offline',
        batch ? `${batch.code} (${batch.stage})` : 'Idle / None',
        formatDate(m.createdAt),
      ]
    }),
    emptyMessage: 'No machines found matching criteria',
  })
}
