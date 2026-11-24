import { Cpu, Wifi, WifiOff } from 'lucide-react'
import { Skeleton } from '@/ui/skeleton'

interface MachinesStatsProps {
  registered: number
  online: number
  offline: number
  isLoading?: boolean
}

export function MachinesStats({
  registered,
  online,
  offline,
  isLoading = false,
}: MachinesStatsProps) {
  const cards = [
    {
      label: 'Registered machines',
      value: registered,
      icon: Cpu,
    },
    {
      label: 'Online machines',
      value: online,
      icon: Wifi,
    },
    {
      label: 'Offline machines',
      value: offline,
      icon: WifiOff,
    },
  ]

  if (isLoading) {
    return (
      <section
        aria-label="Machines Statistics"
        className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-[20px] bg-white p-4 sm:p-5 shadow-card"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-7 w-12 rounded" />
            </div>
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label="Machines Statistics"
      className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full"
    >
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.label}
            className="flex items-center justify-between rounded-[20px] bg-white p-4 sm:p-5 shadow-card transition-shadow"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium leading-[140%] text-foreground">
                {card.label}
              </p>
              <p className="text-2xl sm:text-[29px] font-bold leading-none text-foreground">
                {card.value}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </div>
          </article>
        )
      })}
    </section>
  )
}
