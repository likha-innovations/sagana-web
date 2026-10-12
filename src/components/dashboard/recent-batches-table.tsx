import { useLayoutEffect, useRef, useState } from 'react'

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
    { label: 'Batch ID', width: 'w-[11%]' },
    { label: 'Account', width: 'w-[19%]' },
    { label: 'Barangay', width: 'w-[19%]' },
    { label: 'Machine', width: 'w-[12%]' },
    { label: 'Feedstock weight', width: 'w-[11%]' },
    { label: 'Days to stabilization', width: 'w-[12%]' },
    { label: 'Completed', width: 'w-[16%]' },
] as const

const ROW_H = 41

export function RecentBatchesTable({ rows, totalThisMonth }: RecentBatchesTableProps) {
    const bodyRef = useRef<HTMLDivElement>(null)
    const headRef = useRef<HTMLTableSectionElement>(null)
    const [visible, setVisible] = useState(rows.length)

    useLayoutEffect(() => {
        setVisible(rows.length)

        const el = bodyRef.current
        if (!el) return

        const update = () => {
            const headH = headRef.current?.offsetHeight ?? 0
            const fit = Math.floor((el.clientHeight - headH + 2) / ROW_H)
            setVisible(Math.max(1, Math.min(rows.length, fit)))
        }

        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [rows.length])

    const visibleRows = rows.slice(0, Math.max(0, visible))

    return (
        <article className="flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-[20px] bg-page p-5 shadow-card">
            <div className="flex shrink-0 items-start justify-between">
                <div className="flex flex-col gap-1.5">
                    <h2 className="text-base font-bold leading-none text-foreground">
                        Recently completed batches
                    </h2>
                    <p className="text-[11px] font-medium leading-[1.4] text-foreground">
                        Latest stabilization completions across pilot sites
                    </p>
                </div>
                <a
                    href="#"
                    className="shrink-0 text-xs font-bold text-primary hover:underline"
                >
                    View all batches →
                </a>
            </div>

            <div
                ref={bodyRef}
                className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
            >
                <table className="w-full table-fixed text-left text-xs">
                    <thead ref={headRef}>
                        <tr className="border-b border-border">
                            {columns.map((col) => (
                                <th
                                    key={col.label}
                                    className={`${col.width} whitespace-nowrap pb-2.5 pr-4 font-bold text-foreground`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.map((r) => (
                            <tr
                                key={r.id}
                                className="border-b border-border last:border-0"
                            >
                                <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                    {r.id}
                                </td>
                                <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                    {r.account}
                                </td>
                                <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                    {r.barangay}
                                </td>
                                <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                    {r.machine}
                                </td>
                                <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                    {r.weight}
                                </td>
                                <td className="whitespace-nowrap py-3 pr-4 font-medium text-foreground">
                                    {r.days}
                                </td>
                                <td className="whitespace-nowrap py-3 font-medium text-foreground">
                                    {r.completed}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="shrink-0 text-[11px] font-medium leading-[1.4] text-foreground">
                Sample data · Showing {visibleRows.length} of {totalThisMonth} batches this
                month
            </p>
        </article>
    )
}