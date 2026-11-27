import { Users, UserCheck, UserX } from 'lucide-react'
import { StatsGrid } from '@/components/ui/stats-grid'
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
    <StatsGrid
      ariaLabel="Operator Accounts Statistics"
      columnsClassName="grid-cols-2 xl:grid-cols-4"
      isLoading={isLoading}
      cards={[
        { label: 'Total Operator Accounts', value: total, icon: Users },
        { label: 'Active Accounts', value: active, icon: UserCheck },
        { label: 'Inactive Accounts', value: inactive, icon: UserX },
      ]}
      trailingCard={<BarangayCodeCard code={barangayCode} name={barangayName} />}
    />
  )
}
