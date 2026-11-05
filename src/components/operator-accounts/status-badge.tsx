interface StatusBadgeProps {
  status: 'active' | 'suspended' | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isSuspended = status.toLowerCase() === 'suspended'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none ${
        isSuspended
          ? 'bg-[#FFEAEB] text-[#D92D20]'
          : 'bg-[#E4F4D6] text-[#3D7826]'
      }`}
    >
      {isSuspended ? 'Suspended' : 'Active'}
    </span>
  )
}
