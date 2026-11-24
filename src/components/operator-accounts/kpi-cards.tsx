import { Users, UserCheck, UserX } from 'lucide-react'
import { Skeleton } from '@/ui/skeleton'

interface KpiCardsProps {
  total: number
  active: number
  inactive: number
  isLoading?: boolean
}

export function KpiCards({
  total,
  active,
  inactive,
  isLoading = false,
}: KpiCardsProps) {
  const cards = [
    {
      label: 'Total Operator Accounts',
      value: total,
      icon: Users,
    },
    {
      label: 'Active Accounts',
      value: active,
      icon: UserCheck,
    },
    {
      label: 'Inactive Accounts',
      value: inactive,
      icon: UserX,
    },
  ]

  if (isLoading) {
    return (
      <>
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
      </>
    )
  }

  return (
    <>
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
    </>
  )
}
