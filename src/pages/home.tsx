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
import { useStats } from '@/hooks/useStats';
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

function getStatusVariant(status: PostStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'posted':
            return 'default';
        case 'scheduled':
            return 'secondary';
        case 'failed':
            return 'destructive';
        default:
            return 'outline';
    }
}

function DeltaIndicator({ delta }: { delta: number | null }) {
    if (delta === null) return <span className="text-muted-foreground text-sm">N/A</span>;

    const isPositive = delta >= 0;
    return (
        <span className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
        </span>
    );
}

function MetricsCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-16" />
            </CardContent>
        </Card>
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
                    <CardTitle className="text-base line-clamp-1">{post.video.title}</CardTitle>
                    <Badge variant={getStatusVariant(post.status)}>{post.status}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{post.hook.text}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(post.created_at)}</span>
                    <span className="font-semibold">{formatNumber(post.views ?? 0)} views</span>
                </div>
                {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {post.hashtags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                                #{tag}
                            </Badge>
                        ))}
                        {post.hashtags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{post.hashtags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
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
    const { data, isLoading, error, refetch } = useStats();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-destructive">Error loading dashboard: {error.message}</p>
                <button
                    onClick={refetch}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 md:space-y-12">
            {/* Metrics Section */}
            <section>
                <h2 className="text-lg font-semibold m-5">Views Overview</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {isLoading ? (
                        <>
                            <MetricsCardSkeleton />
                            <MetricsCardSkeleton />
                            <MetricsCardSkeleton />
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>All Time Views</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {formatNumber(data?.viewsMetrics.allTime ?? 0)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Last 28 Days</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {formatNumber(data?.viewsMetrics.last28Days ?? 0)}
                                    </div>
                                    <div className="mt-1">
                                        <DeltaIndicator delta={data?.viewsMetrics.deltaPercent ?? null} />
                                        <span className="text-muted-foreground text-sm ml-1">vs previous 28 days</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Previous 28 Days</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {formatNumber(data?.viewsMetrics.previous28Days ?? 0)}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </section>

            {/* Most Recent Post */}
            <section>
                <h2 className="text-lg font-semibold mb-5">Most Recent Post</h2>
                {isLoading ? (
                    <PostCardSkeleton />
                ) : data?.mostRecentPost ? (
                    <PostCard post={data.mostRecentPost} highlight />
                ) : (
                    <Card>
                        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                            No posts yet
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Top Posts */}
            <section>
                <h2 className="text-lg font-semibold mb-5">Top Performing Posts</h2>
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
                <h2 className="text-lg font-semibold mb-5">Performance Rankings</h2>
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
