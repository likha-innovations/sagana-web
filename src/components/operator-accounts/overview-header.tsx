import type { OperatorAccount } from '@/api/operator.api'

interface OverviewHeaderProps {
  filteredAccounts?: OperatorAccount[]
}

export function OverviewHeader({ filteredAccounts: _ }: OverviewHeaderProps = {}) {
  return (
    <header className="flex h-auto min-h-[39px] flex-wrap items-center justify-between gap-4">
      <h1 className="text-[29px] font-semibold leading-[140%] text-[#414141]">
        Operator Accounts
      </h1>
    </header>
  )
}

