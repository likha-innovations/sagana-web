import type { OperatorAccount } from '@/api/operator.api'
import {
  exportTablePdf,
  formatPdfDateRange,
  formatPdfFilterLabel,
  type PdfTableColumn,
} from './pdf-utils'

export interface ExportOperatorsReportOptions {
  accounts: OperatorAccount[]
  barangay?: string
  status?: string
  dateRange?: string
  search?: string
}

const OPERATOR_COLUMNS: PdfTableColumn[] = [
  { header: 'Operator Name', width: 38 },
  { header: 'Email Address', width: 50 },
  { header: 'Account Status', width: 24 },
  { header: 'Date Joined', width: 26 },
  { header: 'Barangay Location', width: 40 },
]

export function exportOperatorsReport({
  accounts,
  barangay = 'all',
  status = 'all',
  dateRange = 'All Time',
  search = '',
}: ExportOperatorsReportOptions): void {
  const activeCount = accounts.filter((a) => a.status === 'active').length
  const suspendedCount = accounts.length - activeCount
  const barangayLabel =
    barangay && barangay !== 'all'
      ? barangay
      : accounts[0]?.barangay || 'Assigned Barangay'
  const searchLabel = search.trim() ? `"${search.trim()}"` : 'All Operators'

  exportTablePdf({
    title: 'Operator Accounts Report',
    headerTitle: 'Operator Accounts Directory Report',
    metadata: [
      { label: 'Facility / Barangay', value: barangayLabel },
      { label: 'Date Range', value: formatPdfDateRange(dateRange) },
      { label: 'Status Filter', value: formatPdfFilterLabel(status) },
    ],
    summary: `Summary: ${accounts.length} total account${accounts.length === 1 ? '' : 's'} (${activeCount} active, ${suspendedCount} suspended) • Scope: ${searchLabel}`,
    columns: OPERATOR_COLUMNS,
    rows: accounts.map((op) => [
      op.name,
      op.email,
      op.status === 'active' ? 'Active' : 'Suspended',
      op.dateJoined,
      op.barangay,
    ]),
    emptyMessage: 'No operator accounts found matching criteria',
  })
}
