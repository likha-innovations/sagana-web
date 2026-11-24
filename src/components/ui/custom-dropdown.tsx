import { useState, useRef, useEffect, type ReactNode } from 'react'
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
  rightIcon?: ReactNode
  className?: string
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
  className = 'w-full sm:w-40',
  ariaLabel,
  enableCustomDateRange = false,
  align,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)


  const defaultAlign = align ?? (enableCustomDateRange ? 'right' : 'left')
  const [alignOverride, setAlignOverride] = useState<'left' | 'right' | null>(null)


  const updateMenuPos = () => {
    if (!dropdownRef.current) return
    const rect = dropdownRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })


    const popupWidth = 200
    if (rect.left + popupWidth > window.innerWidth - 16) {
      setAlignOverride('right')
    } else if (rect.right - popupWidth < 16) {
      setAlignOverride('left')
    } else {
      setAlignOverride(null)
    }
  }


  useEffect(() => {
    if (!isOpen) return
    updateMenuPos()
    const handleScroll = () => updateMenuPos()
    const handleResize = () => updateMenuPos()
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  const computedAlign = alignOverride ?? defaultAlign


  const isCustomValue = value.startsWith('custom:')


  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = isCustomValue
    ? formatCustomLabel(value)
    : selectedOption
      ? selectedOption.label
      : placeholder


  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        (!popupRef.current || !popupRef.current.contains(target)) &&
        (!calendarRef.current || !calendarRef.current.contains(target))
      ) {
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


  const existingCustom = parseCustomDateRange(value)

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
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
        className={`h-11 sm:h-13 w-full flex items-center justify-between gap-2 rounded-[14px] border bg-white px-3 sm:px-4 text-xs font-normal text-foreground outline-none transition-all cursor-pointer select-none ${isOpen
          ? 'border-primary ring-1 ring-primary/25 bg-[#FAF9F0]'
          : 'border-border hover:bg-[#FAF9F5] hover:border-[#CAC9C2]'
          }`}
      >
        <span className="truncate text-left">
          {displayLabel}
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
          style={{
            position: 'fixed',
            top: menuPos.top,
            ...(computedAlign === 'right'
              ? { right: window.innerWidth - menuPos.left - menuPos.width }
              : { left: menuPos.left }),
            minWidth: menuPos.width,
          }}
          className="z-50 rounded-2xl bg-[#FDFCF7] p-2 shadow-[0_12px_32px_rgba(65,65,65,0.12)] animate-in fade-in zoom-in-95 duration-150 w-max max-w-[min(280px,calc(100vw-2rem))] max-h-105 overflow-y-auto"
        >
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

                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-foreground" />
                  )}
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

                {isCustomValue && (
                  <Check className="h-4 w-4 shrink-0 text-foreground" />
                )}
              </button>
            )}
          </>
        </div>,
        document.body
      )}

      {isOpen && showCalendar && createPortal(
        <div ref={calendarRef} className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowCalendar(false)
              setIsOpen(false)
            }}
          />
          <div className="relative rounded-2xl bg-[#FDFCF7] p-1.5 shadow-[0_12px_32px_rgba(65,65,65,0.14)] animate-in fade-in zoom-in-95 duration-150 w-72.5">
            <DateRangeCalendar
              startDate={existingCustom?.start ?? null}
              endDate={existingCustom?.end ?? null}
              onRangeSelect={handleCustomRangeSelect}
              onCancel={handleCalendarCancel}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
