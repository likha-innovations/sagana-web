import { KpiCards } from './kpi-cards'
import { BarangayCodeCard } from './barangay-code-card'

interface OperatorStatsProps {
  total: number
  active: number
  inactive: number
  barangayCode?: string
  barangayName?: string
  isLoading?: boolean
}

export function OperatorStats({
  total,
  active,
  inactive,
  barangayCode = '67SHVY',
  barangayName = 'Barangay 176-E',
  isLoading = false,
}: OperatorStatsProps) {
  return (
    <section
      aria-label="Operator Accounts Statistics"
      className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 w-full"
    >
      <KpiCards
        total={total}
        active={active}
        inactive={inactive}
        isLoading={isLoading}
      />

      <div className="w-full xl:w-[302px] xl:shrink-0">
        <BarangayCodeCard code={barangayCode} name={barangayName} />
      </div>
    </section>
  )
}
