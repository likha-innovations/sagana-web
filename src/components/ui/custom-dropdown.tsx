import { useState, useRef, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { DateRangeCalendar } from './date-range-calendar'

export interface DropdownOption {
  value: string
  label: string
  icon?: ReactNode
}

interface CustomDropdownProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
  triggerClassName?: string
  ariaLabel?: string
  enableCustomDateRange?: boolean
  align?: 'left' | 'right'
}

function parseCustomDateRange(value: string): { start: Date; end: Date } | null {
  if (!value.startsWith('custom:')) return null
  const parts = value.slice(7).split('_')
  if (parts.length !== 2) return null
  const start = new Date(parts[0] + 'T00:00:00')
  const end = new Date(parts[1] + 'T00:00:00')
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  return { start, end }
}

function formatCustomLabel(value: string): string {
  const parsed = parseCustomDateRange(value)
  if (!parsed) return 'Date range'
  const { start, end } = parsed

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  const sameDay = sameMonth && start.getDate() === end.getDate()

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })

  if (sameDay) return `${startMonth} ${start.getDate()}, ${start.getFullYear()}`
  if (sameMonth) return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
  if (sameYear) return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
  return `${startMonth} ${start.getDate()}, ${start.getFullYear()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function CustomDropdown({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  leftIcon,
  rightIcon,
  className = 'w-full sm:w-40',
  triggerClassName,
  ariaLabel,
  enableCustomDateRange = false,
  align,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left?: number; right?: number; minWidth: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const isCustomValue = value.startsWith('custom:')

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = isCustomValue
    ? formatCustomLabel(value)
    : selectedOption
      ? selectedOption.label
      : placeholder

  const computeMenuPos = useCallback(() => {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    let resolvedAlign = align ?? (enableCustomDateRange ? 'right' : 'left')
    if (resolvedAlign === 'left' && rect.left + 200 > window.innerWidth - 16) {
      resolvedAlign = 'right'
    } else if (resolvedAlign === 'right' && rect.right - 200 < 16) {
      resolvedAlign = 'left'
    }
    return {
      top: rect.bottom + 6,
      minWidth: rect.width,
      ...(resolvedAlign === 'right'
        ? { right: window.innerWidth - rect.right }
        : { left: rect.left }),
    }
  }, [align, enableCustomDateRange])

  const close = useCallback(() => {
    setIsOpen(false)
    setShowCalendar(false)
    setMenuPos(null)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popupRef.current?.contains(target) ||
        calendarRef.current?.contains(target)
      ) return
      close()
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    const handleReposition = () => {
      setMenuPos(computeMenuPos())
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [isOpen, close, computeMenuPos])

  const handleToggle = () => {
    if (isOpen) {
      close()
      return
    }
    setMenuPos(computeMenuPos())
    setIsOpen(true)
  }

  const handleSelect = (optionValue: string) => {
    if (optionValue === '__custom__') {
      setShowCalendar(true)
      return
    }
    onChange(optionValue)
    close()
  }

  const handleCustomRangeSelect = (start: Date, end: Date) => {
    onChange(`custom:${toISODate(start)}_${toISODate(end)}`)
    close()
  }

  const existingCustom = parseCustomDateRange(value)

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayLabel}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 rounded-[14px] border text-xs text-foreground outline-none transition-all cursor-pointer select-none ${
          triggerClassName ?? 'h-11 sm:h-13 px-3 sm:px-4 font-normal'
        } ${
          isOpen
            ? 'border-primary ring-1 ring-primary/25 bg-[#FAF9F0]'
            : `${triggerClassName ? '' : 'bg-white '}border-border hover:bg-[#FAF9F5] hover:border-[#CAC9C2]`
        }`}
      >
        <span className="flex items-center gap-2 truncate text-left">
          {leftIcon}
          <span className="truncate">{displayLabel}</span>
        </span>

        <span className="shrink-0 text-text-email">
          {rightIcon ? (
            rightIcon
          ) : (
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-180 text-primary' : ''
                }`}
            />
          )}
        </span>
      </button>

      {isOpen && !showCalendar && menuPos && createPortal(
        <div
          ref={popupRef}
          role="listbox"
          tabIndex={-1}
          style={{ position: 'fixed', ...menuPos } as CSSProperties}
          className="z-50 rounded-2xl bg-[#FDFCF7] p-2 shadow-[0_12px_32px_rgba(65,65,65,0.12)] animate-in fade-in zoom-in-95 duration-150 w-max max-w-[min(280px,calc(100vw-2rem))] max-h-105 overflow-y-auto"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-xs transition-colors duration-100 cursor-pointer text-left ${isSelected
                  ? 'font-bold text-foreground'
                  : 'font-normal text-foreground hover:bg-[#FAF9F4]'
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && (
                    <span className="shrink-0 text-text-email">{option.icon}</span>
                  )}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-foreground" />}
              </button>
            )
          })}

          {enableCustomDateRange && (
            <button
              type="button"
              role="option"
              aria-selected={isCustomValue}
              onClick={() => handleSelect('__custom__')}
              className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-xs transition-colors duration-100 cursor-pointer text-left ${isCustomValue
                ? 'font-bold text-foreground'
                : 'font-normal text-foreground hover:bg-[#FAF9F4]'
                }`}
            >
              <div className="flex items-center gap-2">
                <span>Date range</span>
              </div>
              {isCustomValue && <Check className="h-4 w-4 shrink-0 text-foreground" />}
            </button>
          )}
        </div>,
        document.body
      )}

      {isOpen && showCalendar && createPortal(
        <div ref={calendarRef} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative rounded-2xl bg-[#FDFCF7] p-1.5 shadow-[0_12px_32px_rgba(65,65,65,0.14)] animate-in fade-in zoom-in-95 duration-150 w-72.5">
            <DateRangeCalendar
              startDate={existingCustom?.start ?? null}
              endDate={existingCustom?.end ?? null}
              onRangeSelect={handleCustomRangeSelect}
              onCancel={() => setShowCalendar(false)}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
