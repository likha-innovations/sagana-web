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
    <article
      className="flex items-center justify-between rounded-[20px] bg-white p-4 sm:p-5 shadow-card transition-shadow cursor-pointer sm:cursor-default"
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopy() }}
      aria-label={`Copy ${name} code: ${code}`}
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium leading-[140%] text-foreground">
          {name} Code
        </p>
        <p className="text-2xl sm:text-[29px] font-bold leading-none tracking-wide text-foreground">
          {code}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleCopy() }}
        aria-label="Copy barangay code"
        className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:bg-[#F2F1EB] active:scale-98 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-positive" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-text-email" />
            <span>Copy</span>
          </>
        )}
      </button>
    </article>
  )
}
