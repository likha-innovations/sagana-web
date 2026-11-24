export type BatchRow = {
    id: string
    account: string
    barangay: string
    machine: string
    weight: string
    days: string
    completed: string
}

type RecentBatchesTableProps = {
    rows: BatchRow[]
    totalThisMonth: number
}

const columns = [
    { label: 'Batch ID', width: 'w-[19%]', align: 'text-left' },
    { label: 'Account', width: 'w-[18%]', align: 'text-left' },
    { label: 'Barangay', width: 'w-[14%]', align: 'text-left' },
    { label: 'Machine', width: 'w-[18%]', align: 'text-left' },
    { label: 'Feedstock weight', width: 'w-[11%]', align: 'text-left' },
    { label: 'Days to stabilization', width: 'w-[11%]', align: 'text-left' },
    { label: 'Completed', width: 'w-[9%]', align: 'text-right' },
] as const

export function RecentBatchesTable({ rows, totalThisMonth }: RecentBatchesTableProps) {
    return (
        <article className="flex flex-1 flex-col justify-between rounded-[20px] bg-white p-5 shadow-card transition-all overflow-hidden">
            <div className="flex flex-col">
                <div className="flex shrink-0 items-start justify-between pb-3">
                    <div className="flex flex-col gap-1.5">
                        <h2 className="text-base font-bold leading-none text-foreground">
                            Recently completed batches
                        </h2>
                        <p className="text-xs font-medium leading-[1.4] text-foreground">
                            Latest stabilization completions across pilot sites
                        </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-primary select-none cursor-default mt-0.5">
                        View all batches →
                    </span>
                </div>

                <div className="flex flex-col gap-3 sm:hidden">
                    {rows.length === 0 ? (
                        <p className="py-6 text-center text-xs text-text-email">
                            No recently completed batches found.
                        </p>
                    ) : (
                        rows.map((r) => (
                            <div key={r.id} className="rounded-2xl border border-border bg-white p-4">
                                <p className="text-sm font-semibold text-foreground truncate mb-3">{r.id}</p>
                                <div className="flex flex-col gap-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-email">Account</span>
                                        <span className="text-foreground">{r.account}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-email">Barangay</span>
                                        <span className="text-foreground">{r.barangay}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-email">Machine</span>
                                        <span className="text-foreground truncate ml-4 text-right">{r.machine}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-email">Feedstock weight</span>
                                        <span className="text-foreground">{r.weight}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-email">Days to stabilization</span>
                                        <span className="text-foreground">{r.days}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-email">Completed</span>
                                        <span className="text-foreground">{r.completed}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
                    <table className="w-full min-w-212.5 table-fixed text-xs">
                        <thead>
                            <tr className="border-b border-border">
                                {columns.map((col) => (
                                    <th
                                        key={col.label}
                                        className={`${col.width} ${col.align} whitespace-nowrap pb-2.5 ${col.align === 'text-right' ? 'pr-1' : 'pr-4'
                                            } font-bold text-foreground`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-6 text-center text-xs text-muted-foreground"
                                    >
                                        No recently completed batches found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-b border-border last:border-0 hover:bg-[#FAF9F5]/80 transition-colors"
                                    >
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">{r.id}</td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">{r.account}</td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">{r.barangay}</td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">{r.machine}</td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">{r.weight}</td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">{r.days}</td>
                                        <td className="whitespace-nowrap py-3 pr-1 text-right font-medium text-foreground">{r.completed}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-auto pt-4">
                <p className="text-xs font-medium leading-[1.4] text-foreground">
                    Showing {rows.length} of {totalThisMonth || rows.length} batches this month
                </p>
            </div>
        </article>
    )
}
