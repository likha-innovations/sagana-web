import { useState, useRef, useEffect, type ReactNode } from 'react'
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
  rightIcon?: ReactNode
  className?: string
  ariaLabel?: string
  /** When true, a "Custom" option with a date range calendar is available */
  enableCustomDateRange?: boolean
  /** Dropdown menu alignment relative to trigger button: 'left' | 'right' */
  align?: 'left' | 'right'
}

/** Parse a `custom:YYYY-MM-DD_YYYY-MM-DD` value back into two Dates */
export function parseCustomDateRange(value: string): { start: Date; end: Date } | null {
  if (!value.startsWith('custom:')) return null
  const parts = value.slice(7).split('_')
  if (parts.length !== 2) return null
  const start = new Date(parts[0] + 'T00:00:00')
  const end = new Date(parts[1] + 'T00:00:00')
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  return { start, end }
}

/** Format a custom date range for display, e.g. "Oct 1 – Oct 15, 2026" */
function formatCustomLabel(value: string): string {
  const parsed = parseCustomDateRange(value)
  if (!parsed) return 'Custom'
  const { start, end } = parsed

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  const sameDay = sameMonth && start.getDate() === end.getDate()

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })

  if (sameDay) {
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()}`
  }
  if (sameMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
  }
  if (sameYear) {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
  }
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
  rightIcon,
  className = 'w-full sm:w-[160px]',
  ariaLabel,
  enableCustomDateRange = false,
  align,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Default alignment: 'right' if custom date range enabled (as date filters are right-aligned),
  // otherwise 'left'.
  const defaultAlign = align ?? (enableCustomDateRange ? 'right' : 'left')
  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>(defaultAlign)

  useEffect(() => {
    setComputedAlign(align ?? (enableCustomDateRange ? 'right' : 'left'))
  }, [align, enableCustomDateRange])

  // Viewport boundary collision detection
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return

    const rect = dropdownRef.current.getBoundingClientRect()
    const popupWidth = showCalendar ? 290 : 200

    const wouldOverflowRight = rect.left + popupWidth > window.innerWidth - 16
    const wouldOverflowLeft = rect.right - popupWidth < 16

    if (wouldOverflowRight && !wouldOverflowLeft) {
      setComputedAlign('right')
    } else if (wouldOverflowLeft && !wouldOverflowRight) {
      setComputedAlign('left')
    } else if (align) {
      setComputedAlign(align)
    } else {
      setComputedAlign(defaultAlign)
    }
  }, [isOpen, showCalendar, align, defaultAlign])

  // Determine if current value is a custom date range
  const isCustomValue = value.startsWith('custom:')

  // Build display label
  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = isCustomValue
    ? formatCustomLabel(value)
    : selectedOption
      ? selectedOption.label
      : placeholder

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCalendar(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    if (optionValue === '__custom__') {
      setShowCalendar(true)
      return
    }
    onChange(optionValue)
    setIsOpen(false)
    setShowCalendar(false)
  }

  const handleCustomRangeSelect = (start: Date, end: Date) => {
    const val = `custom:${toISODate(start)}_${toISODate(end)}`
    onChange(val)
    setIsOpen(false)
    setShowCalendar(false)
  }

  const handleCalendarCancel = () => {
    setShowCalendar(false)
  }

  // Parse existing custom value for calendar initial state
  const existingCustom = parseCustomDateRange(value)

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayLabel}
        onClick={() => {
          setIsOpen((prev) => !prev)
          if (isOpen) setShowCalendar(false)
        }}
        className={`h-[52px] w-full flex items-center justify-between gap-2 rounded-[14px] border bg-white px-4 text-xs font-normal text-[#414141] outline-none transition-all cursor-pointer select-none ${
          isOpen
            ? 'border-[#718619] ring-1 ring-[#718619]/25 bg-[#FAF9F0]'
            : 'border-[#DCDBD5] hover:bg-[#FAF9F5] hover:border-[#CAC9C2]'
        }`}
      >
        <span className="truncate text-left">
          {displayLabel}
        </span>

        <span className="shrink-0 text-[#7C7D74]">
          {rightIcon ? (
            rightIcon
          ) : (
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-[#718619]' : ''
              }`}
            />
          )}
        </span>
      </button>

      {/* Floating Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute top-[calc(100%+6px)] ${
            computedAlign === 'right' ? 'right-0' : 'left-0'
          } z-50 rounded-2xl bg-[#FDFCF7] p-1.5 shadow-[0_12px_32px_rgba(65,65,65,0.14)] border border-[#DCDBD5] animate-in fade-in zoom-in-95 duration-150 ${
            showCalendar
              ? 'w-[290px] max-w-[calc(100vw-32px)] overflow-visible'
              : 'min-w-full w-max max-w-[280px] max-h-[420px] overflow-y-auto'
          }`}
        >
          {showCalendar ? (
            <DateRangeCalendar
              startDate={existingCustom?.start ?? null}
              endDate={existingCustom?.end ?? null}
              onRangeSelect={handleCustomRangeSelect}
              onCancel={handleCalendarCancel}
            />
          ) : (
            <>
              {options.map((option) => {
                const isSelected = option.value === value

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors duration-100 cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#F4F3EC] text-[#566811] font-semibold'
                        : 'text-[#414141] hover:bg-[#FAF9F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {option.icon && (
                        <span className="shrink-0 text-[#7C7D74]">{option.icon}</span>
                      )}
                      <span className="truncate">{option.label}</span>
                    </div>

                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#566811]" />
                    )}
                  </button>
                )
              })}

              {/* Custom date range option */}
              {enableCustomDateRange && (
                <>
                  <div className="mx-2 my-1 h-px bg-[#ECEAE4]" />
                  <button
                    type="button"
                    role="option"
                    aria-selected={isCustomValue}
                    onClick={() => handleSelect('__custom__')}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors duration-100 cursor-pointer text-left ${
                      isCustomValue
                        ? 'bg-[#F4F3EC] text-[#566811] font-semibold'
                        : 'text-[#414141] hover:bg-[#FAF9F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Custom</span>
                    </div>

                    {isCustomValue && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#566811]" />
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
