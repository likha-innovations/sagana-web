import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export type UserStatusSegment = {
    name: string
    value: number
    color: string
}

type UserStatusChartProps = {
    data: UserStatusSegment[]
}

export function UserStatusChart({ data }: UserStatusChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const [hasAnimated, setHasAnimated] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasAnimated(true)
        }, 2500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <article className="flex h-full flex-col gap-4 rounded-[20px] bg-white p-5 shadow-card">
            <div className="flex flex-col gap-1.5">
                <h2 className="text-base font-bold leading-none text-foreground">
                    Operator accounts
                </h2>
                <p className="text-[12px] font-medium leading-[1.4] text-foreground">
                    {total} total operator accounts
                </p>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="relative h-[180px] w-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={0}
                                stroke="none"
                                isAnimationActive={!hasAnimated}
                                animationBegin={120}
                                animationDuration={1300}
                                animationEasing="ease-in-out"
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[29px] font-bold leading-none text-foreground">
                            {total}
                        </span>
                        <span className="text-[12px] font-medium leading-[1.4] text-foreground">
                            accounts
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-start justify-between">
                {data.map((d) => (
                    <div key={d.name} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                style={{ backgroundColor: d.color }}
                            />
                            <span className="text-[12px] font-medium leading-[1.4] text-foreground">
                                {d.name}
                            </span>
                        </div>
                        <span className="text-[15px] font-bold leading-none text-foreground">
                            {d.value} accounts
                        </span>
                    </div>
                ))}
            </div>
        </article>
    )
}
