import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DeltaIndicator } from '@/components/DeltaIndicator';
import type { ImpressionsHistoryData } from '@/types/dashboard';

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}

function formatTooltipDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const PLATFORM_COLORS = {
    tiktok:    'var(--term-accent)',
    instagram: '#ff5cf2',
    youtube:   '#ff6b6b',
    twitter:   '#74c0fc',
} as const;

interface ImpressionsChartProps {
    data: ImpressionsHistoryData | null;
    isLoading: boolean;
}

function fillDateGaps(
    dailyImpressions: { day: string; instagram: number; youtube: number; tiktok: number; twitter: number }[]
): { day: string; instagram: number; youtube: number; tiktok: number; twitter: number }[] {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 27);

    const dataByDay = new Map(dailyImpressions.map(d => [d.day, d]));
    const filled: { day: string; instagram: number; youtube: number; tiktok: number; twitter: number }[] = [];

    for (let i = 0; i < 28; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayStr = date.toISOString().split('T')[0];
        const existing = dataByDay.get(dayStr);
        filled.push({
            day:       dayStr,
            instagram: existing?.instagram ?? 0,
            youtube:   existing?.youtube   ?? 0,
            tiktok:    existing?.tiktok    ?? 0,
            twitter:   existing?.twitter   ?? 0,
        });
    }

    return filled;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const total = (payload as { value: number }[]).reduce((sum, p) => sum + p.value, 0);
    return (
        <div className="border border-primary bg-[var(--term-bg-elev)] px-3 py-2 font-mono text-[11px] min-w-[160px]">
            <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--term-text-faint)]">
                {formatTooltipDate(label as string)}
            </p>
            <p className="text-primary tabular-nums text-sm font-semibold mt-0.5 mb-1.5">
                {formatNumber(total)}
            </p>
            {(payload as { name: string; value: number; color: string }[]).slice().reverse().map(p =>
                p.value > 0 ? (
                    <div key={p.name} className="flex items-center justify-between gap-2 py-px">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block size-2" style={{ background: p.color }} />
                            <span className="text-muted-foreground lowercase">{p.name}</span>
                        </span>
                        <span className="tabular-nums">{formatNumber(p.value)}</span>
                    </div>
                ) : null
            )}
        </div>
    );
}

export function ImpressionsChart({ data, isLoading }: ImpressionsChartProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Impressions Over Last 28 Days</CardDescription>
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

    if (!data || data.dailyImpressions.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Impressions Over Last 28 Days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        Impressions data will appear after the first sync
                    </div>
                </CardContent>
            </Card>
        );
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 28);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const chartData = fillDateGaps(
        data.dailyImpressions.filter(d => d.day >= cutoffStr)
    );

    const platformTotals = {
        tiktok:    chartData.reduce((s, d) => s + d.tiktok,    0),
        instagram: chartData.reduce((s, d) => s + d.instagram, 0),
        youtube:   chartData.reduce((s, d) => s + d.youtube,   0),
        twitter:   chartData.reduce((s, d) => s + d.twitter,   0),
    };
    const platformOrder: Array<keyof typeof platformTotals> = ['tiktok', 'instagram', 'youtube', 'twitter'];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Impressions Over Last 28 Days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="chart-legend">
                    <div className="chart-legend-item">
                        <span className="chart-legend-dot" />
                        impressions · last 28d · by platform
                    </div>
                    {platformOrder.map((k) => (
                        <div key={k} className="chart-legend-item">
                            <span
                                className="chart-legend-dot"
                                style={{ background: PLATFORM_COLORS[k] }}
                            />
                            {k}{' '}
                            <span className="text-[var(--term-text-faint)] tabular-nums">
                                {formatNumber(platformTotals[k])}
                            </span>
                        </div>
                    ))}
                </div>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis dataKey="day" hide />
                        <YAxis
                            tickFormatter={(v: number) => formatNumber(v)}
                            tick={{ fontSize: 10, fontFamily: 'var(--mono)', fill: 'var(--term-text-faint)' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--term-accent-fade)' }} />
                        <Bar dataKey="tiktok"    stackId="a" fill={PLATFORM_COLORS.tiktok}    name="tiktok" />
                        <Bar dataKey="instagram" stackId="a" fill={PLATFORM_COLORS.instagram} name="instagram" />
                        <Bar dataKey="youtube"   stackId="a" fill={PLATFORM_COLORS.youtube}   name="youtube" />
                        <Bar dataKey="twitter"   stackId="a" fill={PLATFORM_COLORS.twitter}   name="twitter" />
                    </BarChart>
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
