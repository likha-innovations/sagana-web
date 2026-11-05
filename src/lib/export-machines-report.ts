import type { Machine } from '@/api/machine.api'
import {
  createBasePdfDoc,
  addReportHeader,
  addReportFooters,
  openPdfInNewTab,
  SAGANA_BRAND,
  autoTable,
} from './pdf-utils'

export interface ExportMachinesReportOptions {
  machines: Machine[]
  search?: string
  status?: string
  dateRange?: string
}

export function exportMachinesReport({
  machines,
  search = '',
  status = 'all',
  dateRange = 'All Time',
}: ExportMachinesReportOptions): void {
  const doc = createBasePdfDoc('Machines Inventory Report')
  const formattedNow = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const statusLabel =
    status === 'all'
      ? 'All Statuses'
      : status.charAt(0).toUpperCase() + status.slice(1)

  const searchLabel = search.trim() ? `"${search.trim()}"` : 'All Machines'

  let currentY = addReportHeader(doc, {
    title: 'Machines Inventory Report',
    subtitle: 'SOLID WASTE MANAGEMENT & COMPOST MONITORING SYSTEM',
    metadata: [
      { label: 'Date Range', value: dateRange || 'All Time' },
      { label: 'Status Filter', value: statusLabel },
      { label: 'Search Query', value: searchLabel },
      { label: 'Generated Date', value: formattedNow },
    ],
  })

  const onlineCount = machines.filter((m) => m.status === 'online').length
  const offlineCount = machines.length - onlineCount

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...SAGANA_BRAND.textDark)
  doc.text(
    `Summary: ${machines.length} total machine${machines.length === 1 ? '' : 's'} (${onlineCount} online, ${offlineCount} offline)`,
    14,
    currentY
  )
  currentY += 4

  const tableRows =
    machines.length === 0
      ? [['No machines found matching criteria', '', '', '', '', '']]
      : machines.map((m) => [
          m.code,
          m.name,
          m.registeredBy?.name || '—',
          m.status === 'online' ? 'Online' : 'Offline',
          m.currentBatch
            ? `${m.currentBatch.code} (${m.currentBatch.stage})`
            : 'Idle / None',
          m.dateRegistered,
        ])

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Machine ID',
        'Machine Name',
        'Registered By',
        'Status',
        'Current Batch & Phase',
        'Date Registered',
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
      1: { cellWidth: 34 },
      2: { cellWidth: 32 },
      3: { cellWidth: 22 },
      4: { cellWidth: 42 },
      5: { cellWidth: 26 },
    },
    tableLineColor: SAGANA_BRAND.border,
    tableLineWidth: 0.1,
    margin: { left: 14, right: 14, top: 14, bottom: 16 },
    showHead: 'everyPage',
  })

  addReportFooters(doc, 'Machines Inventory Report')
  openPdfInNewTab(doc, 'SAGANA - Machines Inventory Report')
}

