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
        <article className="flex flex-1 flex-col justify-between rounded-[20px] bg-white p-5 shadow-card transition-all">
            <div className="flex flex-col">
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between pb-3">
                    <div className="flex flex-col gap-1.5">
                        <h2 className="text-base font-bold leading-none text-foreground">
                            Recently completed batches
                        </h2>
                        <p className="text-[12px] font-medium leading-[1.4] text-foreground">
                            Latest stabilization completions across pilot sites
                        </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-primary select-none cursor-default">
                        View all batches →
                    </span>
                </div>

                {/* Responsive Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[850px] table-fixed text-xs">
                        <thead>
                            <tr className="border-b border-border">
                                {columns.map((col) => (
                                    <th
                                        key={col.label}
                                        className={`${col.width} ${col.align} whitespace-nowrap pb-2.5 ${
                                            col.align === 'text-right' ? 'pr-1' : 'pr-4'
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
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">
                                            {r.id}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">
                                            {r.account}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">
                                            {r.barangay}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground truncate">
                                            {r.machine}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                            {r.weight}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                            {r.days}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pr-1 text-right font-medium text-foreground">
                                            {r.completed}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4">
                <p className="text-[12px] font-medium leading-[1.4] text-foreground">
                    Showing {rows.length} of {totalThisMonth || rows.length} batches this month
                </p>
            </div>
        </article>
    )
}