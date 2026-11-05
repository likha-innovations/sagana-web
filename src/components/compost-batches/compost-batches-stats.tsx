import { Layers, CheckCircle2, Cpu } from 'lucide-react'
import { Skeleton } from '@/ui/skeleton'
import type { BatchStatsData } from '@/api/batch.api'

interface CompostBatchesStatsProps {
  stats: BatchStatsData
  isLoading?: boolean
}

export function CompostBatchesStats({
  stats,
  isLoading = false,
}: CompostBatchesStatsProps) {
  const cards = [
    {
      label: 'All Time Total Produced',
      value: stats.allTimeTotalProduced,
      isKg: true,
      icon: Layers,
    },
    {
      label: 'Total Compost Batches',
      value: stats.totalCompostBatches,
      isKg: false,
      icon: Layers,
    },
    {
      label: 'Finished batches',
      value: stats.finishedBatches,
      isKg: false,
      icon: CheckCircle2,
    },
    {
      label: 'Ongoing Batches',
      value: stats.ongoingBatches,
      isKg: false,
      icon: Cpu,
    },
  ]

  if (isLoading) {
    return (
      <section
        aria-label="Compost Batches Statistics"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex h-[101px] items-center justify-between rounded-[20px] bg-white p-5 shadow-card"
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
      aria-label="Compost Batches Statistics"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full"
    >
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.label}
            className="flex h-[101px] items-center justify-between rounded-[20px] bg-white p-5 shadow-card transition-shadow"
          >
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-medium leading-[140%] text-[#414141]">
                {card.label}
              </p>
              <p className="text-[29px] font-bold leading-none text-[#414141]">
                {card.isKg ? (
                  <span>
                    {String(card.value).replace(' kg', '')}
                    <span className="ml-1 text-sm font-semibold">kg</span>
                  </span>
                ) : (
                  card.value
                )}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#718619] text-white shadow-xs">
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </div>
          </article>
        )
      })}
    </section>
  )
}
