import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import saganaLogoDataUrl from '@/assets/sagana-logo.png?inline'
import { formatDisplayRange } from './date-range'

export const PDF_MARGIN = 16
const LOGO_ASPECT_RATIO = 661 / 153

export const SAGANA_BRAND = {
  primary: [113, 134, 25] as [number, number, number],
  primaryDark: [86, 109, 27] as [number, number, number],
  textDark: [31, 41, 55] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  bgMuted: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  altRow: [249, 250, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

export function createBasePdfDoc(title: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  doc.setProperties({
    title,
    subject: `${title} - SAGANA Waste Management`,
    author: 'SAGANA System',
    creator: 'SAGANA Web Portal',
  })

  return doc
}

export interface HeaderMetadataItem {
  label: string
  value: string
}

export function addReportHeader(
  doc: jsPDF,
  options: {
    title: string
    subtitle?: string
    metadata: HeaderMetadataItem[]
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PDF_MARGIN * 2

  doc.setFillColor(...SAGANA_BRAND.primary)
  doc.rect(0, 0, pageWidth, 3.5, 'F')

  const logoHeight = 7.5
  const logoWidth = logoHeight * LOGO_ASPECT_RATIO
  doc.addImage(saganaLogoDataUrl, 'PNG', PDF_MARGIN, 9.5, logoWidth, logoHeight)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...SAGANA_BRAND.textMuted)
  doc.text(
    options.subtitle || 'SOLID WASTE MANAGEMENT & COMPOST MONITORING SYSTEM',
    PDF_MARGIN,
    21.5
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...SAGANA_BRAND.textDark)
  doc.text(options.title.toUpperCase(), PDF_MARGIN, 31)

  const metaBoxY = 36
  const metaBoxHeight = 16
  doc.setFillColor(...SAGANA_BRAND.bgMuted)
  doc.setDrawColor(...SAGANA_BRAND.border)
  doc.setLineWidth(0.2)
  doc.roundedRect(PDF_MARGIN, metaBoxY, contentWidth, metaBoxHeight, 2, 2, 'FD')

  const itemCount = options.metadata.length
  const colWidth = contentWidth / itemCount

  options.metadata.forEach((item, index) => {
    const colX = PDF_MARGIN + index * colWidth + 4

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...SAGANA_BRAND.textMuted)
    doc.text(item.label.toUpperCase(), colX, metaBoxY + 5.8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SAGANA_BRAND.textDark)

    const maxValWidth = colWidth - 8
    const splitVal = doc.splitTextToSize(item.value, maxValWidth)
    doc.text(splitVal[0] || '', colX, metaBoxY + 11.8)
  })

  return metaBoxY + metaBoxHeight + 10
}

export function addReportFooters(doc: jsPDF, documentTitle: string): void {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    doc.setDrawColor(...SAGANA_BRAND.border)
    doc.setLineWidth(0.2)
    doc.line(PDF_MARGIN, pageHeight - 13, pageWidth - PDF_MARGIN, pageHeight - 13)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...SAGANA_BRAND.textMuted)
    doc.text(
      `SAGANA Official Report • ${documentTitle}`,
      PDF_MARGIN,
      pageHeight - 8
    )

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - PDF_MARGIN,
      pageHeight - 8,
      { align: 'right' }
    )
  }
}

export function openPdfInNewTab(doc: jsPDF, title: string): void {
  doc.setProperties({
    title,
    subject: title,
    author: 'SAGANA System',
    creator: 'SAGANA Web Portal',
  })

  const blob = doc.output('blob')
  const blobUrl = URL.createObjectURL(blob)

  const newTab = window.open(blobUrl, '_blank')

  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    const link = document.createElement('a')
    link.href = blobUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 60000)
}

export { autoTable }

export interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number
  }
}

export function getLastAutoTableFinalY(doc: jsPDF): number {
  const tableDoc = doc as DocWithAutoTable
  return tableDoc.lastAutoTable?.finalY ?? 20
}

export interface PdfTableColumn {
  header: string
  width: number
  fontStyle?: 'bold' | 'normal' | 'italic' | 'bolditalic'
}

export interface ExportTablePdfConfig {
  title: string
  headerTitle?: string
  tabTitle?: string
  subtitle?: string
  metadata: HeaderMetadataItem[]
  summary: string
  columns: PdfTableColumn[]
  rows: string[][]
  emptyMessage: string
}

// Formats filter state for report metadata while preserving an explicit all-items label.
export function formatPdfFilterLabel(value: string, allLabel = 'All Statuses'): string {
  if (!value || value === 'all') return allLabel
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// Formats date range filter keys and custom range tokens for clean PDF header display.
export function formatPdfDateRange(value?: string): string {
  if (!value || value === 'all') return 'All Time'
  if (value === '7d') return 'Last 7 Days'
  if (value === '30d') return 'Last 30 Days'
  if (value === 'this-year') return 'This Year'
  if (value.startsWith('custom:')) {
    const [startStr, endStr] = value.slice(7).split('_')
    if (startStr && endStr) {
      const start = new Date(`${startStr}T00:00:00`)
      const end = new Date(`${endStr}T00:00:00`)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return formatDisplayRange(start, end)
      }
    }
  }
  return value
}

// Renders a branded single-table SAGANA PDF report and opens it in a new browser tab.
export function exportTablePdf({
  title,
  headerTitle,
  tabTitle,
  subtitle,
  metadata,
  summary,
  columns,
  rows,
  emptyMessage,
}: ExportTablePdfConfig): void {
  const doc = createBasePdfDoc(title)
  const formattedNow = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const currentY = addReportHeader(doc, {
    title: headerTitle ?? title,
    subtitle,
    metadata: [...metadata, { label: 'Generated Date', value: formattedNow }],
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...SAGANA_BRAND.textDark)
  doc.text(summary, PDF_MARGIN, currentY)

  const body =
    rows.length === 0
      ? [[emptyMessage, ...Array<string>(Math.max(0, columns.length - 1)).fill('')]]
      : rows

  const columnStyles = Object.fromEntries(
    columns.map((col, idx) => [
      idx,
      col.fontStyle ? { cellWidth: col.width, fontStyle: col.fontStyle } : { cellWidth: col.width },
    ])
  )

  autoTable(doc, {
    startY: currentY + 5.5,
    head: [columns.map((col) => col.header)],
    body,
    theme: 'striped',
    headStyles: {
      fillColor: SAGANA_BRAND.primary,
      textColor: SAGANA_BRAND.white,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 3.2, right: 2.6, bottom: 3.2, left: 2.6 },
    },
    bodyStyles: {
      textColor: SAGANA_BRAND.textDark,
      fontSize: 8,
      cellPadding: { top: 3, right: 2.6, bottom: 3, left: 2.6 },
    },
    alternateRowStyles: {
      fillColor: SAGANA_BRAND.altRow,
    },
    columnStyles,
    tableLineColor: SAGANA_BRAND.border,
    tableLineWidth: 0.1,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN, top: 16, bottom: 18 },
    showHead: 'everyPage',
  })

  addReportFooters(doc, title)
  openPdfInNewTab(doc, tabTitle ?? `SAGANA - ${title}`)
}
