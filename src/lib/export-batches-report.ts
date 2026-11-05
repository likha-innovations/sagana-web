import type { Batch } from '@/api/batch.api'
import {
  createBasePdfDoc,
  addReportHeader,
  addReportFooters,
  openPdfInNewTab,
  SAGANA_BRAND,
  autoTable,
} from './pdf-utils'

export interface ExportBatchesReportOptions {
  batches: Batch[]
  search?: string
  status?: string
  dateRange?: string
}

export function exportBatchesReport({
  batches,
  search = '',
  status = 'all',
  dateRange = 'All Time',
}: ExportBatchesReportOptions): void {
  const doc = createBasePdfDoc('Compost Batches Report')
  const formattedNow = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const statusLabel =
    status === 'all'
      ? 'All Phases'
      : status.charAt(0).toUpperCase() + status.slice(1)

  const searchLabel = search.trim() ? `"${search.trim()}"` : 'All Batches'

  let currentY = addReportHeader(doc, {
    title: 'Compost Batches Directory Report',
    subtitle: 'SOLID WASTE MANAGEMENT & COMPOST MONITORING SYSTEM',
    metadata: [
      { label: 'Date Range', value: dateRange || 'All Time' },
      { label: 'Phase Filter', value: statusLabel },
      { label: 'Search Query', value: searchLabel },
      { label: 'Generated Date', value: formattedNow },
    ],
  })

  // Quick summary breakdown
  const completedCount = batches.filter((b) => b.status === 'Completed').length
  const ongoingCount = batches.length - completedCount

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...SAGANA_BRAND.textDark)
  doc.text(
    `Summary: ${batches.length} total batch${batches.length === 1 ? '' : 'es'} found (${ongoingCount} active / in progress, ${completedCount} completed)`,
    14,
    currentY
  )
  currentY += 4

  const tableRows =
    batches.length === 0
      ? [['No compost batches found matching criteria', '', '', '', '', '', '']]
      : batches.map((b) => [
          b.code,
          b.startedBy,
          b.machine,
          b.status,
          b.feedstockWeight,
          b.startedOn,
          `${b.daysComposting} day${b.daysComposting === 1 ? '' : 's'}`,
        ])

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Batch ID',
        'Started By',
        'Machine',
        'Phase / Status',
        'Feedstock Weight',
        'Started On',
        'Composting Time',
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
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 30 },
      3: { cellWidth: 26 },
      4: { cellWidth: 24 },
      5: { cellWidth: 24 },
      6: { cellWidth: 20 },
    },
    tableLineColor: SAGANA_BRAND.border,
    tableLineWidth: 0.1,
    margin: { left: 14, right: 14, top: 14, bottom: 16 },
    showHead: 'everyPage',
  })

  addReportFooters(doc, 'Compost Batches Report')
  openPdfInNewTab(doc, 'SAGANA - Compost Batches Report')
}

