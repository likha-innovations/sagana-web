import type { LucideIcon } from 'lucide-react'

export type AlertItem = {
    icon: LucideIcon
    title: string
    description: string
    time: string
}

type NeedsAttentionProps = {
    alerts: AlertItem[]
}

export function NeedsAttention({ alerts }: NeedsAttentionProps) {
    return (
        <article className="flex h-full flex-col gap-4 rounded-[20px] bg-page p-5 shadow-card">
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                    <h2 className="text-base font-bold leading-none text-foreground">
                        Needs attention
                    </h2>
                    <p className="text-[11px] font-medium leading-[1.4] text-foreground">
                        Review operator and machine exceptions
                    </p>
                </div>
                <span className="inline-flex items-center rounded-full border border- bg-[#F5F5F3] px-2.5 py-1.5 text-[11px] font-bold leading-snug text-[#566811]">
                    {alerts.length} items
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {alerts.map((a) => {
                    const Icon = a.icon
                    return (
                        <div
                            key={a.title}
                            className="flex items-center gap-3 rounded-[14px] bg-[#F5F5F3] p-3"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-white">
                                <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <p className="text-[13px] font-bold leading-4.5 text-foreground">
                                    {a.title}
                                </p>
                                <p className="truncate text-[11px] font-medium leading-[1.4] text-foreground">
                                    {a.description}
                                </p>
                            </div>

                            <span className="shrink-0 text-[11px] font-medium leading-snug text-foreground">
                                {a.time}
                            </span>
                        </div>
                    )
                })}
            </div>

            <a
                href="#"
                className="text-xs font-bold text-primary hover:underline"
            >
                View system health →
            </a>
        </article>
    )
}