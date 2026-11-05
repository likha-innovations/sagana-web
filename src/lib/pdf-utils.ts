import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const SAGANA_BRAND = {
  primary: [113, 134, 25] as [number, number, number],      // #718619
  primaryDark: [86, 109, 27] as [number, number, number],  // #566D1B
  textDark: [31, 41, 55] as [number, number, number],       // #1F2937
  textMuted: [100, 116, 139] as [number, number, number],   // #64748B
  bgMuted: [248, 250, 252] as [number, number, number],     // #F8FAFC
  border: [226, 232, 240] as [number, number, number],      // #E2E8F0
  altRow: [249, 250, 251] as [number, number, number],      // #F9FAFB
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
  const leftMargin = 14
  const rightMargin = 14
  const contentWidth = pageWidth - leftMargin - rightMargin

  // Top accent bar
  doc.setFillColor(...SAGANA_BRAND.primary)
  doc.rect(0, 0, pageWidth, 4, 'F')

  // Brand Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...SAGANA_BRAND.primary)
  doc.text('SAGANA', leftMargin, 14)

  // Portal subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...SAGANA_BRAND.textMuted)
  doc.text(
    options.subtitle || 'SOLID WASTE MANAGEMENT & COMPOST MONITORING SYSTEM',
    leftMargin,
    18.5
  )

  // Report Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...SAGANA_BRAND.textDark)
  doc.text(options.title.toUpperCase(), leftMargin, 26)

  // Metadata Card / Container
  const metaBoxY = 30
  const metaBoxHeight = 16
  doc.setFillColor(...SAGANA_BRAND.bgMuted)
  doc.setDrawColor(...SAGANA_BRAND.border)
  doc.setLineWidth(0.2)
  doc.roundedRect(leftMargin, metaBoxY, contentWidth, metaBoxHeight, 2, 2, 'FD')

  // Distribute metadata items horizontally
  const itemCount = options.metadata.length
  const colWidth = contentWidth / itemCount

  options.metadata.forEach((item, index) => {
    const colX = leftMargin + index * colWidth + 4
    
    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...SAGANA_BRAND.textMuted)
    doc.text(item.label.toUpperCase(), colX, metaBoxY + 5.5)

    // Value
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SAGANA_BRAND.textDark)
    // Truncate if too long to prevent overlap
    const maxValWidth = colWidth - 8
    const splitVal = doc.splitTextToSize(item.value, maxValWidth)
    doc.text(splitVal[0] || '', colX, metaBoxY + 11)
  })

  // Returns next available Y coordinate
  return metaBoxY + metaBoxHeight + 8
}

export function addReportFooters(doc: jsPDF, documentTitle: string): void {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const leftMargin = 14
  const rightMargin = 14

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer divider line
    doc.setDrawColor(...SAGANA_BRAND.border)
    doc.setLineWidth(0.2)
    doc.line(leftMargin, pageHeight - 12, pageWidth - rightMargin, pageHeight - 12)

    // Footer text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...SAGANA_BRAND.textMuted)
    doc.text(
      `SAGANA Official Report • ${documentTitle}`,
      leftMargin,
      pageHeight - 7.5
    )

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - rightMargin,
      pageHeight - 7.5,
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

  // Automatically view in the next tab in the browser
  const newTab = window.open(blobUrl, '_blank')

  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    // Pop-up was blocked by browser settings: trigger standard anchor click fallback
    const link = document.createElement('a')
    link.href = blobUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Revoke object URL after a minute once loaded
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

