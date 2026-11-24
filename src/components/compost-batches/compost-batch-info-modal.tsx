import { useMemo } from 'react'
import { X } from 'lucide-react'
import {
  type CompostBatch,
  type BatchTemperatureReading,
  getDaysComposting,
  formatBatchDate,
} from '@/types/batch'
import { useBatchTemperature } from '@/hooks/use-batches'

interface CompostBatchInfoModalProps {
  isOpen: boolean
  batch: CompostBatch | null
  onClose: () => void
}

interface TempPoint {
  day: number
  temperature: number
}

function extractTemperaturePoints(
  batch: CompostBatch | null,
  remoteReadings?: BatchTemperatureReading[] | null
): TempPoint[] {
  if (!batch) return []

  const candidate: unknown[] =
    remoteReadings && remoteReadings.length > 0
      ? remoteReadings
      : batch.temperatureLogs && batch.temperatureLogs.length > 0
        ? batch.temperatureLogs
        : (batch as { temperatureReadings?: unknown[] }).temperatureReadings ||
        (batch as { temperatures?: unknown[] }).temperatures ||
        []

  if (!Array.isArray(candidate) || candidate.length === 0) return []

  const startMs = new Date(batch.startDate).getTime()
  const points: TempPoint[] = []

  for (let i = 0; i < candidate.length; i++) {
    const item = candidate[i]
    if (typeof item === 'number') {
      points.push({ day: i, temperature: item })
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      const tempVal =
        typeof obj.temperature === 'number'
          ? obj.temperature
          : typeof obj.temp === 'number'
            ? obj.temp
            : null

      if (tempVal === null) continue

      let dayVal = i
      if (typeof obj.day === 'number') {
        dayVal = obj.day
      } else if (typeof obj.timestamp === 'string' && !isNaN(startMs)) {
        const tMs = new Date(obj.timestamp).getTime()
        if (!isNaN(tMs)) {
          dayVal = Math.max(0, Math.round((tMs - startMs) / (1000 * 60 * 60 * 24)))
        }
      }

      points.push({ day: dayVal, temperature: tempVal })
    }
  }

  return points.sort((a, b) => a.day - b.day)
}

export function CompostBatchInfoModal({
  isOpen,
  batch,
  onClose,
}: CompostBatchInfoModalProps) {
  const { data: remoteReadings } = useBatchTemperature(batch?.id)

  const days = useMemo(() => {
    if (!batch) return 22
    const d = getDaysComposting(batch)
    return d > 0 ? d : 22
  }, [batch])

  const startDateFormatted = useMemo(() => {
    if (!batch?.startDate) return '—'
    return formatBatchDate(batch.startDate)
  }, [batch])

  const endDateFormatted = useMemo(() => {
    if (!batch) return 'In progress'
    if (batch.completionDate) return formatBatchDate(batch.completionDate)
    return 'In progress'
  }, [batch])

  const targetEndDateFormatted = useMemo(() => {
    if (!batch) return '—'
    if (batch.completionDate) return formatBatchDate(batch.completionDate)
    if (!batch.startDate) return '—'
    const start = new Date(batch.startDate)
    if (isNaN(start.getTime())) return '—'
    const target = new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
    return formatBatchDate(target.toISOString())
  }, [batch, days])

  const tempPoints = useMemo(() => {
    return extractTemperaturePoints(batch, remoteReadings)
  }, [batch, remoteReadings])

  const { linePath, areaPath, hasData } = useMemo(() => {
    if (tempPoints.length < 2) {
      return { linePath: '', areaPath: '', hasData: false }
    }

    const maxDays = Math.max(days, 1)
    const screenPoints = tempPoints.map((p) => {
      const clampedDay = Math.max(0, Math.min(maxDays, p.day))
      const x = 25 + (clampedDay / maxDays) * 625
      const clampedTemp = Math.max(20, Math.min(80, p.temperature))

      const y = 121 - ((clampedTemp - 20) / 60) * 105
      return { x, y }
    })

    let line = `M ${screenPoints[0].x.toFixed(1)} ${screenPoints[0].y.toFixed(1)}`
    for (let i = 0; i < screenPoints.length - 1; i++) {
      const p0 = screenPoints[Math.max(0, i - 1)]
      const p1 = screenPoints[i]
      const p2 = screenPoints[i + 1]
      const p3 = screenPoints[Math.min(screenPoints.length - 1, i + 2)]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      line += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }

    const first = screenPoints[0]
    const last = screenPoints[screenPoints.length - 1]
    const area = `${line} L ${last.x.toFixed(1)} 121 L ${first.x.toFixed(1)} 121 Z`

    return { linePath: line, areaPath: area, hasData: true }
  }, [tempPoints, days])

  if (!isOpen || !batch) return null

  const machineName = batch.machineName || 'Composter 01'
  const initialWeight =
    batch.totalWeight && batch.totalWeight > 0
      ? `${batch.totalWeight} kg`
      : 'Not recorded (kg)'
  const finalWeight =
    batch.finalWeight && batch.finalWeight > 0
      ? `${batch.finalWeight} kg`
      : 'Pending (kg)'


  const xTicks = (() => {
    const maxDay = Math.max(days, 1)
    const candidates = [0, 5, 10, 15].filter(t => t < maxDay)
    if (!candidates.includes(maxDay)) candidates.push(maxDay)
    return candidates.map(t => ({
      day: t,
      x: 25 + (t / maxDay) * 625,
      anchor: (t === 0 ? 'start' : t === maxDay ? 'end' : 'middle') as 'start' | 'middle' | 'end',
    }))
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-196.5 max-h-[90vh] overflow-y-auto rounded-[22px] sm:rounded-[28px] bg-[#F8F7F2] shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            Compost Batch Information
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5 stroke-[2.2]" />
          </button>
        </div>

        <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-6 sm:pb-8 space-y-4.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Batch ID
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {batch.batchCode}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Composting duration
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {days} days
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Machine used
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {machineName}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Initial feedstock weight
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {initialWeight}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Final batch weight
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {finalWeight}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Started on
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {startDateFormatted}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Ended on
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {endDateFormatted}
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-border bg-transparent p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground">
                Temperature over time
              </h3>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-4 rounded-full bg-[#8146AC]" />
                <span className="text-xs font-medium text-foreground">
                  Temperature
                </span>
              </div>
            </div>

            <div className="text-[10px] text-text-email">
              Temperature (°C)
            </div>

            <div className="w-full overflow-x-auto">
              <div className="min-w-105">
                <svg
                  viewBox="0 0 650 170"
                  className="w-full h-auto overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8146AC" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#8146AC" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  <text x="0" y="20" fill="#7C7D74" fontSize="10">80</text>
                  <line x1="25" y1="16" x2="650" y2="16" stroke="#E3E2DC" strokeWidth="1" />

                  <text x="0" y="55" fill="#7C7D74" fontSize="10">60</text>
                  <line x1="25" y1="51" x2="650" y2="51" stroke="#E3E2DC" strokeWidth="1" />

                  <text x="0" y="90" fill="#7C7D74" fontSize="10">40</text>
                  <line x1="25" y1="86" x2="650" y2="86" stroke="#E3E2DC" strokeWidth="1" />

                  <text x="0" y="125" fill="#7C7D74" fontSize="10">20</text>
                  <line x1="25" y1="121" x2="650" y2="121" stroke="#E3E2DC" strokeWidth="1" />

                  {hasData && (
                    <>
                      <path d={areaPath} fill="url(#tempGradient)" />
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#8146AC"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {xTicks.map(tick => (
                    <text key={tick.day} x={tick.x} y="142" fill="#7C7D74" fontSize="10" textAnchor={tick.anchor}>
                      Day {tick.day}
                    </text>
                  ))}

                  <text x="25" y="162" fill="#7C7D74" fontSize="10" textAnchor="start">
                    {startDateFormatted}
                  </text>
                  <text x="650" y="162" fill="#7C7D74" fontSize="10" textAnchor="end">
                    {targetEndDateFormatted}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
