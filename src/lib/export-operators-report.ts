import {
  getOperatorBarangayName,
  getOperatorName,
  type OperatorAccount,
} from '@/types/operator'
import { formatDate } from './utils'
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
      : accounts[0]
        ? getOperatorBarangayName(accounts[0])
        : 'Assigned Barangay'
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
      getOperatorName(op),
      op.email,
      op.status === 'active' ? 'Active' : 'Suspended',
      formatDate(op.createdAt),
      getOperatorBarangayName(op),
    ]),
    emptyMessage: 'No operator accounts found matching criteria',
  })
}
