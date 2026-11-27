import type { DashboardData } from '@/types/dashboard'
import type { KpiCardProps } from '@/components/dashboard/kpi-card'
import { getCurrentMonthDateRange } from './date-range'
import {
  createBasePdfDoc,
  addReportHeader,
  addReportFooters,
  openPdfInNewTab,
  getLastAutoTableFinalY,
  PDF_MARGIN,
  SAGANA_BRAND,
  autoTable,
} from './pdf-utils'

export interface ExportDashboardReportOptions {
  data: DashboardData
  barangay?: string
  dateRange?: string
}

function sanitizePdfUnit(unit: KpiCardProps['unit']): string {
  const raw = typeof unit === 'string' ? unit : unit ? String(unit) : ''
  // jsPDF built-in Helvetica lacks Unicode subscript glyphs (e.g. CO₂ -> CO2).
  return raw.replace(/₂/g, '2')
}

function getKpiPdfStatus(kpi: KpiCardProps): string {
  const numericValue = Number(kpi.value)
  if (kpi.label === 'Machines online') {
    if (sanitizePdfUnit(kpi.unit).trim() === '/ 0') return 'No Data'
    return numericValue > 0 ? 'Online' : 'All Offline'
  }
  if (!Number.isFinite(numericValue) || numericValue === 0 || kpi.delta === 'N/A') {
    return 'No Data'
  }
  return kpi.deltaTone === 'good' ? 'On Track / Positive' : 'Attention / Monitor'
}

export function buildDashboardKpiPdfRows(kpis: KpiCardProps[]): string[][] {
  return kpis.map((kpi) => {
    const unitStr = sanitizePdfUnit(kpi.unit)
    return [
      kpi.label,
      `${kpi.value} ${unitStr}`.trim(),
      kpi.delta || '—',
      getKpiPdfStatus(kpi),
    ]
  })
}

export function buildShareDistributionPdfRows(
  items: ReadonlyArray<{ name: string; value: number }>,
  totalLabel: string
): { rows: string[][]; total: number } {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const rows = items.map((item) => {
    const share = total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0.0%'
    return [item.name, String(item.value), share]
  })
  rows.push([totalLabel, String(total), total > 0 ? '100.0%' : '0.0%'])
  return { rows, total }
}

export function exportDashboardReport({
  data,
  barangay = 'Assigned Barangay',
  dateRange = getCurrentMonthDateRange(),
}: ExportDashboardReportOptions): void {
  const { kpis, phaseData, userStatusData, recentBatches, totalThisMonth } = data

  const { rows: phaseRows, total: totalActiveBatches } = buildShareDistributionPdfRows(
    phaseData,
    'Total Active Batches'
  )
  const { rows: operatorRows, total: totalOperators } = buildShareDistributionPdfRows(
    userStatusData,
    'Total Operator Accounts'
  )
  const kpiRows = buildDashboardKpiPdfRows(kpis)

  const hasAnyData =
    recentBatches.length > 0 ||
    totalActiveBatches > 0 ||
    totalOperators > 0 ||
    kpis.some((kpi) => Number(kpi.value) > 0)

  const doc = createBasePdfDoc('Executive Dashboard Report')
  const formattedNow = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  let currentY = addReportHeader(doc, {
    title: 'Executive Dashboard Report',
    subtitle: 'SOLID WASTE MANAGEMENT & COMPOST MONITORING SYSTEM',
    metadata: [
      { label: 'Reporting Period', value: dateRange },
      { label: 'Facility / Barangay', value: barangay },
      { label: 'Generated Date', value: formattedNow },
      { label: 'Report Status', value: hasAnyData ? 'Live Snapshot' : 'No Data Found' },
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
    margin: { left: PDF_MARGIN, right: PDF_MARGIN, top: 16, bottom: 18 },
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('1. KEY PERFORMANCE INDICATORS (KPIs)', PDF_MARGIN, currentY)
  currentY += 2

  autoTable(doc, {
    ...commonTableStyles,
    startY: currentY,
    head: [['Metric', 'Current Value', 'Summary', 'Performance Status']],
    body: kpiRows,
    theme: 'striped',
  })

  currentY = getLastAutoTableFinalY(doc) + 8

  const pageHeight = doc.internal.pageSize.getHeight()
  if (currentY + 50 > pageHeight - 20) {
    doc.addPage()
    currentY = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('2. ACTIVE BATCHES BY STABILIZATION PHASE', PDF_MARGIN, currentY)
  currentY += 2

  autoTable(doc, {
    ...commonTableStyles,
    startY: currentY,
    head: [['Phase Name', 'Active Batches Count', 'Share of Active Total']],
    body: phaseRows,
    theme: 'striped',
    didParseCell: (cellData) => {
      if (cellData.row.index === phaseRows.length - 1) {
        cellData.cell.styles.fontStyle = 'bold'
        cellData.cell.styles.fillColor = [241, 245, 249]
      }
    },
  })

  currentY = getLastAutoTableFinalY(doc) + 8

  if (currentY + 50 > pageHeight - 20) {
    doc.addPage()
    currentY = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('3. OPERATOR ACCOUNTS DISTRIBUTION', PDF_MARGIN, currentY)
  currentY += 2

  autoTable(doc, {
    ...commonTableStyles,
    startY: currentY,
    head: [['Account Status', 'Total Accounts', 'Share of Total']],
    body: operatorRows,
    theme: 'striped',
    didParseCell: (cellData) => {
      if (cellData.row.index === operatorRows.length - 1) {
        cellData.cell.styles.fontStyle = 'bold'
        cellData.cell.styles.fillColor = [241, 245, 249]
      }
    },
  })

  currentY = getLastAutoTableFinalY(doc) + 8

  if (currentY + 45 > pageHeight - 20) {
    doc.addPage()
    currentY = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...SAGANA_BRAND.primaryDark)
  doc.text('4. RECENTLY COMPLETED BATCHES', PDF_MARGIN, currentY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...SAGANA_BRAND.textMuted)
  doc.text(
    `Showing ${recentBatches.length} of ${totalThisMonth || recentBatches.length} completed batches (${dateRange})`,
    PDF_MARGIN,
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

  addReportFooters(doc, 'Executive Dashboard Report')
  openPdfInNewTab(doc, 'SAGANA - Executive Dashboard Report')
}
