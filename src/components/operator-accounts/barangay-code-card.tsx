import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface BarangayCodeCardProps {
  code: string
  name?: string
}

export function BarangayCodeCard({
  code,
  name = 'Barangay 176-E',
}: BarangayCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Code copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Failed to copy code')
    }
  }

  return (
    <article className="flex h-[101px] items-center justify-between rounded-[20px] bg-white p-5 shadow-card transition-shadow">
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-medium leading-[140%] text-[#414141]">
          {name} Code
        </p>
        <p className="text-[29px] font-bold leading-none tracking-wide text-[#414141]">
          {code}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy barangay code"
        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DCDBD5] bg-white px-3.5 text-xs font-semibold text-[#414141] shadow-xs transition-all hover:bg-[#F2F1EB] active:scale-98 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#718619]"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-[#518251]" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-[#7C7D74]" />
            <span>Copy</span>
          </>
        )}
      </button>
    </article>
  )
}
