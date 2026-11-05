import type { Machine } from '@/api/machine.api'

interface MachinesHeaderProps {
  filteredMachines?: Machine[]
}

export function MachinesHeader({ filteredMachines: _ }: MachinesHeaderProps = {}) {
  return (
    <header className="flex h-auto min-h-[39px] flex-wrap items-center justify-between gap-4">
      <h1 className="text-[29px] font-semibold leading-[140%] text-[#414141]">
        Machines
      </h1>
    </header>
  )
}

