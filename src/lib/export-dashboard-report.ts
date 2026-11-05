import type { DashboardData } from '@/types/dashboard'
import { getCurrentMonthDateRange } from './date-range'
import {
  createBasePdfDoc,
  addReportHeader,
  addReportFooters,
  openPdfInNewTab,
  getLastAutoTableFinalY,
  SAGANA_BRAND,
  autoTable,
} from './pdf-utils'

export interface ExportDashboardReportOptions {
  data: DashboardData
  barangay?: string
  dateRange?: string
}

export function exportDashboardReport({
  data,
  barangay = 'Barangay 176-E',
  dateRange = getCurrentMonthDateRange(),
}: ExportDashboardReportOptions): void {
  const { kpis, phaseData, userStatusData, recentBatches, totalThisMonth } = data

  const doc = createBasePdfDoc('Executive Dashboard Report')
  const formattedNow = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  // 1. Report Header Banner
  let currentY = addReportHeader(doc, {
    title: 'Executive Dashboard Report',
    subtitle: 'SOLID WASTE MANAGEMENT & COMPOST MONITORING SYSTEM',
    metadata: [
      { label: 'Reporting Period', value: dateRange },
      { label: 'Facility / Barangay', value: barangay },
      { label: 'Generated Date', value: formattedNow },
      { label: 'Report Status', value: 'Live Snapshot' },
    ],
  })

  const commonTableStyles = {
    headStyles: {
      fillColor: SAGANA_BRAND.primary,
      textColor: SAGANA_BRAND.white,
      fontStyle: 'bold' as const,
      fontSize: 8,
      cellPadding: 2.8,
    },
    bodyStyles: {
      textColor: SAGANA_BRAND.textDark,
      fontSize: 8,
      cellPadding: 2.4,
    },
    alternateRowStyles: {
      fillColor: SAGANA_BRAND.altRow,
    },
    tableLineColor: SAGANA_BRAND.border,
    tableLineWidth: 0.1,
    margin: { left: 14, right: 14, top: 14, bottom: 16 },
  }

  // 2. Section 1: Key Performance Indicators (KPIs)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('1. KEY PERFORMANCE INDICATORS (KPIs)', 14, currentY)
  currentY += 2

  const kpiRows = kpis.map((kpi) => {
    const unitStr = typeof kpi.unit === 'string' ? kpi.unit : kpi.unit ? String(kpi.unit) : ''
    return [
      kpi.label,
      `${kpi.value} ${unitStr}`.trim(),
      kpi.delta || '—',
      kpi.deltaTone === 'good' ? 'On Track / Positive' : 'Attention / Monitor',
    ]
  })

  autoTable(doc, {
    ...commonTableStyles,
    startY: currentY,
    head: [['Metric', 'Current Value', 'MoM Change', 'Performance Status']],
    body: kpiRows,
    theme: 'striped',
  })

  currentY = getLastAutoTableFinalY(doc) + 8

  // Check if Section 2 and 3 fit on page 1, else add page
  const pageHeight = doc.internal.pageSize.getHeight()
  if (currentY + 50 > pageHeight - 20) {
    doc.addPage()
    currentY = 20
  }

  // 3. Section 2: Active Batches by Stabilization Phase
  const totalActiveBatches = phaseData.reduce((sum, p) => sum + p.value, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('2. ACTIVE BATCHES BY STABILIZATION PHASE', 14, currentY)
  currentY += 2

  const phaseRows = phaseData.map((phase) => {
    const share = totalActiveBatches > 0
      ? `${((phase.value / totalActiveBatches) * 100).toFixed(1)}%`
      : '0.0%'
    return [phase.name, String(phase.value), share]
  })

  // Add Summary Total row
  phaseRows.push(['Total Active Batches', String(totalActiveBatches), '100.0%'])

  autoTable(doc, {
    ...commonTableStyles,
    startY: currentY,
    head: [['Phase Name', 'Active Batches Count', 'Share of Active Total']],
    body: phaseRows,
    theme: 'striped',
    didParseCell: (data) => {
      // Bold the total summary row
      if (data.row.index === phaseRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [241, 245, 249]
      }
    },
  })

  currentY = getLastAutoTableFinalY(doc) + 8

  if (currentY + 50 > pageHeight - 20) {
    doc.addPage()
    currentY = 20
  }

  // 4. Section 3: Operator Accounts Distribution
  const totalOperators = userStatusData.reduce((sum, u) => sum + u.value, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('3. OPERATOR ACCOUNTS DISTRIBUTION', 14, currentY)
  currentY += 2

  const operatorRows = userStatusData.map((status) => {
    const share = totalOperators > 0
      ? `${((status.value / totalOperators) * 100).toFixed(1)}%`
      : '0.0%'
    return [status.name, String(status.value), share]
  })

  operatorRows.push(['Total Operator Accounts', String(totalOperators), '100.0%'])

  autoTable(doc, {
    ...commonTableStyles,
    startY: currentY,
    head: [['Account Status', 'Total Accounts', 'Share of Total']],
    body: operatorRows,
    theme: 'striped',
    didParseCell: (data) => {
      if (data.row.index === operatorRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [241, 245, 249]
      }
    },
  })

  currentY = getLastAutoTableFinalY(doc) + 8

  // 5. Section 4: Recently Completed Batches
  if (currentY + 45 > pageHeight - 20) {
    doc.addPage()
    currentY = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('4. RECENTLY COMPLETED BATCHES', 14, currentY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...SAGANA_BRAND.textMuted)
  doc.text(
    `Showing ${recentBatches.length} of ${totalThisMonth || recentBatches.length} batches completed this month`,
    14,
    currentY + 4
  )
  currentY += 6

  const batchTableRows =
    recentBatches.length === 0
      ? [['No recently completed batches found', '', '', '', '', '', '']]
      : recentBatches.map((b) => [
          b.id,
          b.account,
          b.barangay,
          b.machine,
          b.weight,
          b.days,
          b.completed,
        ])

  autoTable(doc, {
    ...commonTableStyles,
    startY: currentY,
    head: [
      [
        'Batch ID',
        'Operator',
        'Barangay',
        'Machine',
        'Weight',
        'Days',
        'Completed',
      ],
    ],
    body: batchTableRows,
    theme: 'striped',
    showHead: 'everyPage',
  })

  // Footers on all generated pages
  addReportFooters(doc, 'Executive Dashboard Report')

  // Automatically view in next tab in the browser
  openPdfInNewTab(doc, 'SAGANA - Executive Dashboard Report')
}
