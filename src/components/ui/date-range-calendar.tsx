import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

interface DateRangeCalendarProps {
  startDate: Date | null
  endDate: Date | null
  onRangeSelect: (start: Date, end: Date) => void
  onCancel: () => void
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false
  const t = date.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function DateRangeCalendar({
  startDate: initialStart,
  endDate: initialEnd,
  onRangeSelect,
  onCancel,
}: DateRangeCalendarProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return d
  }, [])
  const [viewMonth, setViewMonth] = useState(initialStart?.getMonth() ?? new Date().getMonth())
  const [viewYear, setViewYear] = useState(initialStart?.getFullYear() ?? new Date().getFullYear())

  const [rangeStart, setRangeStart] = useState<Date | null>(initialStart)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEnd)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [selectingEnd, setSelectingEnd] = useState(!!initialStart && !initialEnd)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }, [])

  const handleDayClick = (day: number) => {
    const clicked = new Date(viewYear, viewMonth, day)
    clicked.setHours(0, 0, 0, 0)

    if (!selectingEnd || !rangeStart) {
      // Selecting start date
      setRangeStart(clicked)
      setRangeEnd(null)
      setSelectingEnd(true)
    } else {
      // Selecting end date
      if (clicked.getTime() < rangeStart.getTime()) {
        // Clicked before start: swap
        setRangeEnd(rangeStart)
        setRangeStart(clicked)
      } else {
        setRangeEnd(clicked)
      }
      setSelectingEnd(false)
    }
  }

  const handleApply = () => {
    if (rangeStart && rangeEnd) {
      onRangeSelect(rangeStart, rangeEnd)
    } else if (rangeStart) {
      // Single day selected — use same date for both
      onRangeSelect(rangeStart, rangeStart)
    }
  }

  // The effective end for hover preview
  const previewEnd = selectingEnd && hoverDate && rangeStart
    ? (hoverDate.getTime() >= rangeStart.getTime() ? hoverDate : null)
    : rangeEnd

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const hasSelection = rangeStart !== null

  return (
    <div className="flex flex-col gap-3 p-3" onClick={(e) => e.stopPropagation()}>
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7C7D74] hover:bg-[#F4F3EC] transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-bold text-[#414141] select-none">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7C7D74] hover:bg-[#F4F3EC] transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-0">
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="flex h-7 items-center justify-center text-[11px] font-semibold text-[#AFAEA7] select-none"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-7" />
          }

          const date = new Date(viewYear, viewMonth, day)
          date.setHours(0, 0, 0, 0)

          const isStart = rangeStart && isSameDay(date, rangeStart)
          const isEnd = (rangeEnd && isSameDay(date, rangeEnd)) ||
            (previewEnd && isSameDay(date, previewEnd))
          const inRange = isInRange(date, rangeStart, previewEnd)
          const isToday = isSameDay(date, today)
          const isFuture = date.getTime() > today.getTime()

          let cellClasses = 'flex h-7 w-full items-center justify-center text-[12px] font-medium transition-all duration-100 cursor-pointer select-none relative '

          if (isStart || isEnd) {
            cellClasses += 'bg-[#718619] text-white rounded-lg font-bold z-10 '
          } else if (inRange) {
            cellClasses += 'bg-[#E8EDC8] text-[#414141] '
          } else if (isFuture) {
            cellClasses += 'text-[#D4D3CD] cursor-default '
          } else if (isToday) {
            cellClasses += 'text-[#718619] font-bold hover:bg-[#F4F3EC] rounded-lg '
          } else {
            cellClasses += 'text-[#414141] hover:bg-[#F4F3EC] rounded-lg '
          }

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={isFuture}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => {
                if (selectingEnd && !isFuture) setHoverDate(date)
              }}
              onMouseLeave={() => setHoverDate(null)}
              className={cellClasses}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Date range display */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#7C7D74] select-none min-h-[18px]">
        {rangeStart ? (
          <>
            <span className="text-[#414141] font-semibold">{formatShortDate(rangeStart)}</span>
            <span>—</span>
            <span className={rangeEnd ? 'text-[#414141] font-semibold' : 'text-[#AFAEA7]'}>
              {rangeEnd ? formatShortDate(rangeEnd) : 'Select end date'}
            </span>
          </>
        ) : (
          <span className="text-[#AFAEA7]">Select a start date</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-8 rounded-xl border border-[#DCDBD5] bg-white text-[12px] font-semibold text-[#414141] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!hasSelection}
          onClick={handleApply}
          className={`flex-1 h-8 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer ${
            hasSelection
              ? 'bg-[#718619] text-white hover:bg-[#5E7014]'
              : 'bg-[#DCDBD5] text-[#AFAEA7] cursor-not-allowed'
          }`}
        >
          Apply
        </button>
      </div>
    </div>
  )
}
