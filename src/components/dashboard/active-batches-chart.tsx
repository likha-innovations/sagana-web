    import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export type ActiveBatchPhase = {
    name: string
    value: number
    color: string
}

type ActiveBatchesChartProps = {
    data: ActiveBatchPhase[]
}

export function ActiveBatchesChart({ data }: ActiveBatchesChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0)

    return (
        <article className="flex h-full flex-col gap-4 rounded-[20px] bg-page p-5 shadow-card">
            <div className="flex flex-col gap-1.5">
                <h2 className="text-base font-bold leading-none text-foreground">
                    Active batches by phase
                </h2>
                <p className="text-[11px] font-medium leading-[1.4] text-foreground">
                    {total} active batches across all facilities
                </p>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="relative h-45 w-45 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[{ value: 1 }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={64}
                                outerRadius={90}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                                isAnimationActive={false}
                            >
                                <Cell fill="#F3F3F1" />
                            </Pie>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={64}
                                outerRadius={90}
                                dataKey="value"
                                startAngle={0}
                                endAngle={-270}
                                paddingAngle={0}
                                stroke="none"
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[28px] font-bold leading-none text-foreground">
                            {total}
                        </span>
                        <span className="text-[11px] font-medium leading-[1.4] text-foreground">
                            active batches
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {data.map((d) => (
                    <div key={d.name} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                style={{ backgroundColor: d.color }}
                            />
                            <span className="text-[11px] font-medium leading-[1.4] text-foreground">
                                {d.name}
                            </span>
                        </div>
                        <span className="text-[14px] font-bold leading-none text-foreground">
                            {d.value} batches
                        </span>
                    </div>
                ))}
            </div>
        </article>
    )
}