import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type KpiCardProps = {
    label: string
    value: string
    unit?: ReactNode
    delta?: string
    deltaTone?: 'good' | 'bad'
    icon: LucideIcon
}

export function KpiCard({
    label,
    value,
    unit,
    icon: Icon,
}: KpiCardProps) {
    return (
        <article className="flex h-[101px] items-center justify-between rounded-[20px] bg-white p-5 shadow-card transition-shadow">
            <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-[12px] font-medium leading-[1.4] text-foreground">
                    {label}
                </p>
                <p className="flex items-center text-foreground">
                    <span className="flex items-baseline gap-1">
                        <span className="text-[29px] font-bold leading-none">{value}</span>
                        {unit && (
                            <span className="text-xs font-medium leading-none">{unit}</span>
                        )}
                    </span>
                </p>
            </div>

            <div className="flex h-11.25 w-11.25 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Icon className="h-5.5 w-5.5" strokeWidth={2} aria-hidden="true" />
            </div>
        </article>
    )
}