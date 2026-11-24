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
      className="grid grid-cols-2 xl:grid-cols-4 gap-4 w-full"
    >
      <KpiCards
        total={total}
        active={active}
        inactive={inactive}
        isLoading={isLoading}
      />

      <BarangayCodeCard code={barangayCode} name={barangayName} />
    </section>
  )
}
