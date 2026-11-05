import type { OperatorAccount } from '@/api/operator.api'
import {
  createBasePdfDoc,
  addReportHeader,
  addReportFooters,
  openPdfInNewTab,
  SAGANA_BRAND,
  autoTable,
} from './pdf-utils'

export interface ExportOperatorsReportOptions {
  accounts: OperatorAccount[]
  barangay?: string
  status?: string
  dateRange?: string
  search?: string
}

export function exportOperatorsReport({
  accounts,
  barangay = 'all',
  status = 'all',
  dateRange = 'All Time',
  search = '',
}: ExportOperatorsReportOptions): void {
  const doc = createBasePdfDoc('Operator Accounts Report')
  const formattedNow = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const barangayLabel =
    barangay === 'all' ? 'All Barangays' : barangay

  const statusLabel =
    status === 'all'
      ? 'All Statuses'
      : status.charAt(0).toUpperCase() + status.slice(1)

  const searchLabel = search.trim() ? `"${search.trim()}"` : 'All Operators'

  let currentY = addReportHeader(doc, {
    title: 'Operator Accounts Directory Report',
    subtitle: 'SOLID WASTE MANAGEMENT & COMPOST MONITORING SYSTEM',
    metadata: [
      { label: 'Facility / Barangay', value: barangayLabel },
      { label: 'Date Range', value: dateRange || 'All Time' },
      { label: 'Status Filter', value: statusLabel },
      { label: 'Generated Date', value: formattedNow },
    ],
  })

  const activeCount = accounts.filter((a) => a.status === 'active').length
  const suspendedCount = accounts.length - activeCount

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...SAGANA_BRAND.textDark)
  doc.text(
    `Summary: ${accounts.length} total account${accounts.length === 1 ? '' : 's'} (${activeCount} active, ${suspendedCount} suspended) • Scope: ${searchLabel}`,
    14,
    currentY
  )
  currentY += 4

  const tableRows =
    accounts.length === 0
      ? [['No operator accounts found matching criteria', '', '', '', '']]
      : accounts.map((op) => [
          op.name,
          op.email,
          op.status === 'active' ? 'Active' : 'Suspended',
          op.dateJoined,
          op.barangay,
        ])

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Operator Name',
        'Email Address',
        'Account Status',
        'Date Joined',
        'Barangay Location',
      ],
    ],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: SAGANA_BRAND.primary,
      textColor: SAGANA_BRAND.white,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.8,
    },
    bodyStyles: {
      textColor: SAGANA_BRAND.textDark,
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: SAGANA_BRAND.altRow,
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 26 },
      3: { cellWidth: 28 },
      4: { cellWidth: 40 },
    },
    tableLineColor: SAGANA_BRAND.border,
    tableLineWidth: 0.1,
    margin: { left: 14, right: 14, top: 14, bottom: 16 },
    showHead: 'everyPage',
  })

  addReportFooters(doc, 'Operator Accounts Report')
  openPdfInNewTab(doc, 'SAGANA - Operator Accounts Report')
}
