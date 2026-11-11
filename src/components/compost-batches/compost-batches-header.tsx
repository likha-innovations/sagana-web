import type { CompostBatch } from '@/types/batch'

interface CompostBatchesHeaderProps {
  filteredBatches?: CompostBatch[]
}

export function CompostBatchesHeader({ filteredBatches: _ }: CompostBatchesHeaderProps = {}) {
  return (
    <header className="flex h-auto min-h-[39px] flex-wrap items-center justify-between gap-4">
      <h1 className="text-[29px] font-semibold leading-[140%] text-[#414141]">
        Compost Batches
      </h1>
    </header>
  )
}

