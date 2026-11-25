import {
  type CompostBatch,
  getBatchPhase,
  getDaysComposting,
  formatBatchDate,
} from '@/types/batch'
import {
  exportTablePdf,
  formatPdfDateRange,
  formatPdfFilterLabel,
  type PdfTableColumn,
} from './pdf-utils'

export interface ExportBatchesReportOptions {
  batches: CompostBatch[]
  search?: string
  status?: string
  dateRange?: string
}

const BATCH_COLUMNS: PdfTableColumn[] = [
  { header: 'Batch ID', width: 40 },
  { header: 'Started By', width: 19 },
  { header: 'Machine', width: 26 },
  { header: 'Phase / Status', width: 23 },
  { header: 'Feedstock Weight', width: 22 },
  { header: 'Started On', width: 22 },
  { header: 'Composting Time', width: 26 },
]

export function exportBatchesReport({
  batches,
  search = '',
  status = 'all',
  dateRange = 'All Time',
}: ExportBatchesReportOptions): void {
  const completedCount = batches.filter(
    (b) => b.completionDate != null || b.status?.toLowerCase() === 'completed'
  ).length
  const ongoingCount = batches.length - completedCount
  const searchLabel = search.trim() ? `"${search.trim()}"` : 'All Batches'

  exportTablePdf({
    title: 'Compost Batches Report',
    headerTitle: 'Compost Batches Directory Report',
    metadata: [
      { label: 'Date Range', value: formatPdfDateRange(dateRange) },
      { label: 'Phase Filter', value: formatPdfFilterLabel(status, 'All Phases') },
      { label: 'Search Query', value: searchLabel },
    ],
    summary: `Summary: ${batches.length} total batch${batches.length === 1 ? '' : 'es'} found (${ongoingCount} active / in progress, ${completedCount} completed)`,
    columns: BATCH_COLUMNS,
    rows: batches.map((b) => [
      b.batchCode,
      'Operator',
      b.machineName || 'Machine',
      getBatchPhase(b),
      `${b.totalWeight} kg`,
      formatBatchDate(b.startDate),
      `${getDaysComposting(b)} day${getDaysComposting(b) === 1 ? '' : 's'}`,
    ]),
    emptyMessage: 'No compost batches found matching criteria',
  })
}
