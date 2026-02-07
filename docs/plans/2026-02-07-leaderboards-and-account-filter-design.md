# Leaderboards & Account Filter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two leaderboard bar-chart cards and an account filter dropdown to the dashboard.

**Architecture:** Extend the existing `DashboardStats` type with leaderboard arrays, add `accountId` param support to the `useStats` hook, and render new UI sections in `home.tsx` using existing shadcn Card and Select components.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Card, Select, Skeleton)

---

### Task 1: Add leaderboard types to DashboardStats

**Files:**
- Modify: `src/types/dashboard.ts:40-48`

**Step 1: Add the new fields to the DashboardStats interface**

In `src/types/dashboard.ts`, add two new fields at the end of the `DashboardStats` interface:

```typescript
export interface DashboardStats {
  topPosts: PostWithDetails[];
  mostRecentPost: PostWithDetails | null;
  viewsMetrics: ViewsMetrics;
  topCaptions: RankedItem[];
  topHooks: RankedItem[];
  topHashtagCombinations: RankedItem[];
  topVideos: RankedItem[];
  userLeaderboard: { name: string; posts: number }[];
  userViewsPerVideo: { name: string; viewsPerVideo: number }[];
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No new errors (existing code doesn't reference the new fields yet, so this should pass cleanly).

**Step 3: Commit**

```bash
git add src/types/dashboard.ts
git commit -m "feat: add leaderboard types to DashboardStats"
```

---

### Task 2: Add accountId parameter to useStats hook

**Files:**
- Modify: `src/hooks/useStats.ts`

**Step 1: Update the hook to accept accountId**

Replace the full contents of `src/hooks/useStats.ts` with:

```typescript
import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { DashboardStats } from '@/types/dashboard';

interface UseStatsResult {
  data: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStats(accountId: number | null = null): UseStatsResult {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const url = accountId
        ? `${API_BASE_URL}/api/stats?accountId=${accountId}`
        : `${API_BASE_URL}/api/stats`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const stats = await response.json() as DashboardStats;
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, isLoading, error, refetch: fetchStats };
}
```

Key changes:
- Added `accountId: number | null = null` parameter
- Wrapped `fetchStats` in `useCallback` with `accountId` dependency
- Conditionally appends `?accountId={id}` to fetch URL
- `useEffect` depends on `fetchStats` (which depends on `accountId`), so changing the filter triggers a refetch

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: Passes — `useStats()` call in `home.tsx` still works because the param defaults to `null`.

**Step 3: Commit**

```bash
git add src/hooks/useStats.ts
git commit -m "feat: add accountId filter param to useStats hook"
```

---

### Task 3: Add account filter dropdown to dashboard

**Files:**
- Modify: `src/pages/home.tsx`

**Step 1: Add imports and state**

Add to the existing imports at the top of `home.tsx`:

```typescript
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
```

In the `Home` component, change:
```typescript
const { data, isLoading, error, refetch } = useStats();
```
to:
```typescript
const [accountId, setAccountId] = useState<string>('all');
const { data, isLoading, error, refetch } = useStats(
    accountId === 'all' ? null : Number(accountId)
);
```

**Step 2: Add the filter dropdown above the first section**

Inside the `return` JSX, at the very top of the `<div className="space-y-10 md:space-y-12">`, before the `{/* Metrics Section */}` comment, add:

```tsx
{/* Account Filter */}
<div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
    <Select value={accountId} onValueChange={setAccountId}>
        <SelectTrigger className="w-[220px]">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="1">Molars UK (Main Account)</SelectItem>
            <SelectItem value="2">MLRS (Backup Account)</SelectItem>
        </SelectContent>
    </Select>
</div>
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Passes.

**Step 4: Commit**

```bash
git add src/pages/home.tsx
git commit -m "feat: add account filter dropdown to dashboard"
```

---

### Task 4: Add leaderboard bar-chart cards

**Files:**
- Modify: `src/pages/home.tsx`

**Step 1: Add the LeaderboardCard component**

Add this component inside `home.tsx`, after the `DeltaIndicator` component (around line 62) and before `MetricsCardSkeleton`:

```tsx
function LeaderboardCard({
    title,
    items,
    valueKey,
    formatValue = (v: number) => formatNumber(v),
    isLoading,
}: {
    title: string;
    items: { name: string; [key: string]: string | number }[];
    valueKey: string;
    formatValue?: (value: number) => string;
    isLoading: boolean;
}) {
    if (isLoading) {
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
                            <Skeleton className="h-2 w-full rounded-full" />
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
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.name}</span>
                                <span className="tabular-nums text-muted-foreground">
                                    {formatValue(value)}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-primary/20">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
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
```

**Step 2: Render the two leaderboard cards**

In the `return` JSX of `Home`, after the Account Filter `<div>` and before the `{/* Metrics Section */}`, add:

```tsx
{/* Leaderboards */}
<section>
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
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Passes.

**Step 4: Commit**

```bash
git add src/pages/home.tsx
git commit -m "feat: add leaderboard bar-chart cards to dashboard"
```

---

## Summary

| Task | File | Change |
|------|------|--------|
| 1 | `src/types/dashboard.ts` | Add `userLeaderboard` and `userViewsPerVideo` to `DashboardStats` |
| 2 | `src/hooks/useStats.ts` | Add `accountId` param, `useCallback`, conditional URL |
| 3 | `src/pages/home.tsx` | Add `accountId` state, Select dropdown |
| 4 | `src/pages/home.tsx` | Add `LeaderboardCard` component, render two cards |
