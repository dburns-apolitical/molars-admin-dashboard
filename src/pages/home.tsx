import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { prepareMarkdown } from '@/lib/utils';
import { AccountFilter } from '@/components/AccountFilter';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import { useAccounts } from '@/contexts/AccountsContext';
import { useStats } from '@/hooks/useStats';
import { ViewsChart } from '@/components/ViewsChart';
import { useViewsHistory } from '@/hooks/useViewsHistory';
import { ImpressionsChart } from '@/components/ImpressionsChart';
import { useImpressionsHistory } from '@/hooks/useImpressionsHistory';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import type { PostStatus, PostWithDetails, RankedItem } from '@/types/dashboard';

function formatNumber(num: number): string {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toLocaleString();
}

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getRecencyInfo(date: Date | string): { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string } {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const isToday = posted.toDateString() === now.toDateString();

    let label: string;
    if (diffMins < 1) label = 'Just now';
    else if (diffMins < 60) label = `${diffMins}m ago`;
    else if (diffHours < 24) label = `${diffHours}h ago`;
    else if (diffDays === 1) label = '1d ago';
    else label = `${diffDays}d ago`;

    if (isToday && diffHours < 2) {
        return { label, variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-500 text-white' };
    } else if (isToday) {
        return { label, variant: 'secondary', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    } else {
        return { label, variant: 'destructive', className: '' };
    }
}

function getStatusStyle(status: PostStatus): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string } {
    switch (status) {
        case 'posted':
        case 'success':
            return { variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-500 text-white' };
        case 'pending':
        case 'scheduled':
            return { variant: 'secondary', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' };
        case 'failed':
            return { variant: 'destructive', className: '' };
        default:
            return { variant: 'outline', className: '' };
    }
}

function LeaderboardCard({
    title,
    items,
    valueKey,
    formatValue = (v: number) => formatNumber(v),
    isLoading: loading,
}: {
    title: string;
    items: { name: string;[key: string]: string | number }[];
    valueKey: string;
    formatValue?: (value: number) => string;
    isLoading: boolean;
}) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <Skeleton className="h-1 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item, index) => {
                    const value = Number(item[valueKey]) || 0;
                    const percentage = (value / maxValue) * 100;
                    return (
                        <div key={index} className="space-y-1.5">
                            <div className="flex justify-between text-sm items-center">
                                <span className="flex items-center gap-2.5">
                                    <span className={`tabular-nums text-[11px] ${index === 0 ? 'text-primary' : 'text-[var(--term-text-faint)]'}`}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-medium">{item.name}</span>
                                </span>
                                <span className="tabular-nums text-muted-foreground text-[12px]">
                                    {formatValue(value)}
                                </span>
                            </div>
                            <div className="h-1 w-full bg-border">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
            </CardContent>
        </Card>
    );
}

function MetricsCardSkeleton() {
    return (
        <div className="metric">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-32 mt-3" />
            <Skeleton className="h-3 w-20 mt-3" />
            <Skeleton className="h-[18px] w-full mt-3" />
        </div>
    );
}

function MetricCard({
    label,
    value,
    delta,
    bars = [2, 3, 2, 4, 5, 4, 6],
}: {
    label: string;
    value: number;
    delta?: string;
    bars?: number[];
}) {
    return (
        <div className="metric">
            <div className="metric-label">{label}</div>
            <div className="metric-value">{value.toLocaleString()}</div>
            {delta && <div className="metric-delta up">{delta}</div>}
            <div className="metric-delta-bar">
                {bars.map((b, i) => (
                    <span
                        key={i}
                        className={i === bars.length - 1 ? 'hi' : ''}
                        style={{ height: `${10 + b * 4}px` }}
                    />
                ))}
            </div>
        </div>
    );
}

function PostCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
        </Card>
    );
}

function PostCard({ post, highlight = false }: { post: PostWithDetails; highlight?: boolean }) {
    return (
        <Card className={highlight ? 'border-primary/50 bg-primary/5' : ''}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">
                        {post.video.title}
                        {post.account_name && (
                            <span className="text-muted-foreground font-normal text-sm"> [{post.account_name}]</span>
                        )}
                    </CardTitle>
                    {(() => {
                        const statusStyle = getStatusStyle(post.status);
                        return <Badge variant={statusStyle.variant} className={statusStyle.className}>{post.status}</Badge>;
                    })()}
                </div>
                <CardDescription className="line-clamp-2">{post.hook.text}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{formatDate(post.created_at)}</span>
                        {(() => {
                            const recency = getRecencyInfo(post.created_at);
                            return (
                                <Badge variant={recency.variant} className={`text-xs ${recency.className}`}>
                                    {recency.label}
                                </Badge>
                            );
                        })()}
                    </div>
                    <span className="font-semibold">{formatNumber(post.views ?? 0)} views</span>
                </div>
            </CardContent>
        </Card>
    );
}

function RankedItemsTable({ items, label }: { items: RankedItem[]; label: string }) {
    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No {label.toLowerCase()} data available
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="border-b-2 border-muted">
                    <TableHead className="w-12 text-xs uppercase tracking-wider text-muted-foreground font-semibold">#</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold">Posts</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">Total</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold">Avg</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item, index) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="max-w-[120px] sm:max-w-xs truncate font-medium">{item.text}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.postCount}</TableCell>
                        <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatNumber(item.totalViews)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(item.avgViews)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export function Home() {
    const { accountId } = useAccountFilter();
    const { accounts } = useAccounts();
    const { data, isLoading, error, refetch } = useStats(accountId);
    const { data: viewsHistoryData, isLoading: viewsHistoryLoading } = useViewsHistory(accountId);
    const { data: impressionsHistoryData, isLoading: impressionsHistoryLoading } = useImpressionsHistory(accountId);
    const { recentPosts, isLoading: recentPostsLoading } = useRecentPosts();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-destructive">Error loading dashboard: {error.message}</p>
                <button
                    onClick={refetch}
                    className="px-4 py-2 bg-primary text-primary-foreground font-mono lowercase tracking-wider text-xs hover:bg-[#ffc04a] transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 md:space-y-12">
            {/* Page title */}
            <div className="mb-6 md:mb-8">
                <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--term-text-faint)] font-mono">
                    $ molars --stats --live
                </div>
                <div className="flex items-baseline gap-3.5 mt-2 flex-wrap">
                    <h1 className="font-mono text-2xl md:text-[28px] font-semibold tracking-tight lowercase">
                        dashboard<span className="cursor" aria-hidden />
                    </h1>
                    <span className="text-[var(--term-text-faint)] text-xs">
                        tracking <span className="text-primary tabular-nums">{accounts.length}</span> accounts
                        {data && (
                            <>
                                {' · '}
                                <span className="text-primary tabular-nums">
                                    {data.postCountMetrics.allTime}
                                </span>{' '}
                                posts shipped
                                {' · '}
                                <span className="text-primary tabular-nums">
                                    {formatNumber(data.viewsMetrics.allTime)}
                                </span>{' '}
                                all-time views
                            </>
                        )}
                    </span>
                </div>
            </div>

            {/* Impressions Overview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="section-title">Impressions Overview</h2>
                    <AccountFilter />
                </div>
                <ImpressionsChart
                    data={impressionsHistoryData}
                    isLoading={impressionsHistoryLoading}
                />
            </section>

            {/* Views Overview */}
            <section>
                <h2 className="section-title mb-8">Views Overview</h2>
                <div className="h-5"/>
                <ViewsChart
                    data={viewsHistoryData}
                    isLoading={viewsHistoryLoading}
                    allTimeViews={data?.viewsMetrics.allTime}
                />
            </section>

            {/* Leaderboards */}
            <section>
                <h2 className="section-title mb-5">Leaderboards</h2>
                <div className="h-5"/>
                <div className="grid gap-4 md:grid-cols-2">
                    <LeaderboardCard
                        title="Posts by User"
                        items={data?.userLeaderboard ?? []}
                        valueKey="posts"
                        isLoading={isLoading}
                    />
                    <LeaderboardCard
                        title="Views per Video"
                        items={data?.userViewsPerVideo ?? []}
                        valueKey="viewsPerVideo"
                        isLoading={isLoading}
                    />
                </div>
            </section>

            {/* Recent Posts */}
            <section>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="section-title">Recent Posts</h2>
                    <Link to="/content" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
                        view all →
                    </Link>
                </div>
                {recentPostsLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[var(--term-bg-elev)] border border-border px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentPosts.length > 0 ? (
                    <div className="space-y-2">
                        {recentPosts.map((post, index) => {
                            const statusStyle = getStatusStyle(post.status);
                            const recency = getRecencyInfo(post.created_at);
                            return (
                                <div key={index} className="bg-[var(--term-bg-elev)] border border-border px-3 py-2.5 hover:border-[var(--term-border-hi)] transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span className="text-[var(--term-text-faint)] text-[11px] whitespace-nowrap">[{post.account_name}]</span>
                                            <span className="text-sm truncate">{post.video_title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge variant={statusStyle.variant} className={statusStyle.className}>{post.status}</Badge>
                                            <Badge variant={recency.variant} className={`text-xs ${recency.className}`}>{recency.label}</Badge>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                            No posts yet
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Latest Evaluation */}
            {isLoading ? (
                <section>
                    <h2 className="section-title mb-8">Latest Evaluation</h2>
                    <div className="h-5"/>
                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                </section>
            ) : data?.latestEvaluation ? (
                <section>
                    <h2 className="section-title mb-8">Latest Evaluation</h2>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>
                                {formatDate(data.latestEvaluation.created_at)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <div className="prose prose-sm dark:prose-invert max-w-none max-h-[400px] overflow-hidden">
                                    <Markdown>{prepareMarkdown(data.latestEvaluation.response)}</Markdown>
                                </div>
                                {data.latestEvaluation.response.length > 400 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
                                )}
                            </div>
                            <Link
                                to="/evaluations?open=latest"
                                className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                            >
                                Read more →
                            </Link>
                        </CardContent>
                    </Card>
                </section>
            ) : null}

            {/* Post Count Metrics */}
            <section>
                <h2 className="section-title mb-8">Post Volume</h2>
                <div className="h-5"/>
                <div className="grid gap-4 md:grid-cols-3">
                    {isLoading ? (
                        <>
                            <MetricsCardSkeleton />
                            <MetricsCardSkeleton />
                            <MetricsCardSkeleton />
                        </>
                    ) : (
                        <>
                            <MetricCard
                                label="all_time"
                                value={data?.postCountMetrics.allTime ?? 0}
                                bars={[2, 3, 2, 4, 5, 4, 6]}
                            />
                            <MetricCard
                                label="last_28d"
                                value={data?.postCountMetrics.last28Days ?? 0}
                                bars={[3, 2, 4, 3, 5, 4, 5]}
                            />
                            <MetricCard
                                label="last_7d"
                                value={data?.postCountMetrics.last7Days ?? 0}
                                bars={[1, 2, 1, 3, 2, 3, 4]}
                            />
                        </>
                    )}
                </div>
            </section>

            {/* Top Posts */}
            <section>
                <h2 className="section-title mb-8">Top Performing Posts</h2>
                <div className="h-5"/>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <>
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                        </>
                    ) : data?.topPosts && data.topPosts.length > 0 ? (
                        data.topPosts.map((post) => <PostCard key={post.id} post={post} />)
                    ) : (
                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                                No top posts available
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>

            {/* Rankings Section */}
            <section>
                <h2 className="section-title mb-8">Performance Rankings</h2>
                <div className="h-5"/>
                {isLoading ? (
                    <Card>
                        <CardContent className="p-6">
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <Tabs defaultValue="captions" className="w-full">
                            <div className="border-b bg-muted/30">
                                <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto">
                                    <TabsTrigger
                                        value="captions"
                                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Captions
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="hooks"
                                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Hooks
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="hashtags"
                                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Hashtags
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="videos"
                                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Videos
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <CardContent className="p-0">
                                <TabsContent value="captions" className="mt-0">
                                    <RankedItemsTable items={data?.topCaptions ?? []} label="Caption" />
                                </TabsContent>
                                <TabsContent value="hooks" className="mt-0">
                                    <RankedItemsTable items={data?.topHooks ?? []} label="Hook" />
                                </TabsContent>
                                <TabsContent value="hashtags" className="mt-0">
                                    <RankedItemsTable items={data?.topHashtagCombinations ?? []} label="Hashtag Combo" />
                                </TabsContent>
                                <TabsContent value="videos" className="mt-0">
                                    <RankedItemsTable items={data?.topVideos ?? []} label="Video" />
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                )}
            </section>
        </div>
    );
}
