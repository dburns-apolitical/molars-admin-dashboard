import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DeltaIndicator } from '@/components/DeltaIndicator';
import type { ViewsHistoryData } from '@/types/dashboard';

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}

function formatTooltipDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

interface ViewsChartProps {
    data: ViewsHistoryData | null;
    isLoading: boolean;
    allTimeViews?: number;
}

function fillDateGaps(dailyViews: { day: string; views: number; postCount: number }[]): { day: string; views: number; postCount: number }[] {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 27);

    const dataByDay = new Map(dailyViews.map(d => [d.day, d]));
    const filled: { day: string; views: number; postCount: number }[] = [];

    for (let i = 0; i < 28; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayStr = date.toISOString().split('T')[0];
        const existing = dataByDay.get(dayStr);
        filled.push({ day: dayStr, views: existing?.views ?? 0, postCount: existing?.postCount ?? 0 });
    }

    return filled;
}

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
            <p className="font-medium">{formatTooltipDate(label)}</p>
            <p className="text-muted-foreground">{formatNumber(payload[0].value)} views</p>
            <p className="text-muted-foreground">{data.postCount} {data.postCount === 1 ? 'post' : 'posts'}</p>
        </div>
    );
}

export function ViewsChart({ data, isLoading, allTimeViews }: ViewsChartProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Views Over Last 28 Days</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                    <div className="flex justify-between mt-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.dailyViews.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Views Over Last 28 Days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        Views data will appear after the first sync
                    </div>
                </CardContent>
            </Card>
        );
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 28);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const chartData = fillDateGaps(
        data.dailyViews.filter(d => d.day >= cutoffStr)
    ).map(d => {
        const date = new Date(d.day + 'T00:00:00');
        date.setDate(date.getDate() - 2);
        return { ...d, day: date.toISOString().split('T')[0] };
    });

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardDescription>Views Over Last 28 Days</CardDescription>
                    {allTimeViews != null && (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">All Time</p>
                            <p className="text-lg font-bold tracking-tight">{formatNumber(allTimeViews)}</p>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="day"
                            hide
                        />
                        <YAxis
                            tickFormatter={(v: number) => formatNumber(v)}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="hsl(217, 91%, 60%)"
                            strokeWidth={2}
                            fill="url(#viewsFill)"
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <div className="flex justify-between items-start mt-4 pt-4 border-t">
                    <div>
                        <p className="text-sm text-muted-foreground">Previous 28 days</p>
                        <p className="text-2xl font-bold tracking-tight">
                            {formatNumber(data.previous28DaysTotal)}
                        </p>
                        <span className="text-sm invisible">placeholder</span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Last 28 days</p>
                        <p className="text-2xl font-bold tracking-tight">
                            {formatNumber(data.last28DaysTotal)}
                        </p>
                        <DeltaIndicator delta={data.deltaPercent} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
