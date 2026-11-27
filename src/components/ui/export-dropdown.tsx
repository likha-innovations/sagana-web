import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, Loader2 } from 'lucide-react'

export interface ExportDropdownProps {
  onExportPdf: () => void | Promise<void>
  onExportSheets: () => void | Promise<void>
  isExporting?: boolean
  label?: string
  variant?: 'toolbar' | 'dashboard'
  align?: 'left' | 'right'
}

export function ExportDropdown({
  onExportPdf,
  onExportSheets,
  isExporting = false,
  label,
  variant = 'toolbar',
  align = 'right',
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; left: number; width: number } | null>(null)

  const updateMenuPos = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      left: rect.left,
      width: rect.width,
    })
  }

  useEffect(() => {
    if (!isOpen) return
    updateMenuPos()

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!popupRef.current || !popupRef.current.contains(target))
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    const handleScroll = () => updateMenuPos()

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isOpen])

  const handlePdfClick = async () => {
    setIsOpen(false)
    await onExportPdf()
  }

  const handleSheetsClick = async () => {
    setIsOpen(false)
    await onExportSheets()
  }

  const isDashboard = variant === 'dashboard'
  const displayLabel = label ?? (isDashboard ? 'Export report' : 'Export')

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={displayLabel}
        disabled={isExporting}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          isDashboard
            ? 'flex h-9.25 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold leading-[1.4] text-white shadow-xs transition-colors hover:bg-[#627920] active:bg-[#566d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60 cursor-pointer'
            : 'flex h-11 sm:h-13 items-center gap-2 rounded-[14px] border border-border bg-white px-3 sm:px-4.5 text-xs font-bold leading-[140%] text-foreground shadow-xs transition-colors hover:border-primary hover:bg-[#FAF9F5] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
        }
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className={isDashboard ? '' : 'hidden sm:inline'}>{displayLabel}</span>
      </button>

      {isOpen && menuPos && createPortal(
        <div
          ref={popupRef}
          role="menu"
          tabIndex={-1}
          style={{
            position: 'fixed',
            top: menuPos.top,
            ...(align === 'right'
              ? { right: menuPos.right }
              : { left: menuPos.left }),
          }}
          className="z-50 rounded-2xl bg-[#FDFCF7] p-2 shadow-[0_12px_32px_rgba(65,65,65,0.12)] animate-in fade-in zoom-in-95 duration-150 w-44 max-w-[calc(100vw-2rem)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handlePdfClick}
            className="flex w-full items-center rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-[#FAF9F4] cursor-pointer text-left"
          >
            Export as PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleSheetsClick}
            className="flex w-full items-center rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-[#FAF9F4] cursor-pointer text-left"
          >
            Export as Sheets
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}
