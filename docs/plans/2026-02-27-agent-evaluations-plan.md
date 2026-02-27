# Agent Evaluations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display AI agent evaluations on the homepage (truncated) and on a dedicated Evaluations page (full accordion list with rendered markdown).

**Architecture:** Add `Evaluation` type and `latestEvaluation` to stats types. New `useEvaluations` hook for the evaluations endpoint. Accordion UI component wrapping Radix primitives (already in `radix-ui` package). New Evaluations page with react-markdown rendering. Homepage gets a new card section above Views Overview.

**Tech Stack:** React, TypeScript, Radix UI Accordion (from `radix-ui`), react-markdown, React Router (useSearchParams), Tailwind CSS

---

### Task 1: Install react-markdown

**Files:**
- Modify: `package.json`

**Step 1: Install dependency**

Run: `npm install react-markdown`

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-markdown dependency"
```

---

### Task 2: Add Evaluation type and update DashboardStats

**Files:**
- Modify: `src/types/dashboard.ts`

**Step 1: Add Evaluation interface and update DashboardStats**

Add after the `PostCountMetrics` interface (after line 46):

```typescript
export interface Evaluation {
  id: number;
  response: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  triggered_by: string;
  created_at: string;
}
```

Add to `DashboardStats` interface (after line 58, before the closing `}`):

```typescript
  latestEvaluation: Evaluation | null;
```

**Step 2: Commit**

```bash
git add src/types/dashboard.ts
git commit -m "feat: add Evaluation type and latestEvaluation to DashboardStats"
```

---

### Task 3: Create Accordion UI component

**Files:**
- Create: `src/components/ui/accordion.tsx`

**Step 1: Create the accordion component**

Follow the same pattern as `src/components/ui/tabs.tsx` — import from `"radix-ui"`, wrap with `cn()`, add `data-slot` attributes.

```tsx
import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("w-full", className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

**Step 2: Add accordion animation keyframes**

Check `src/index.css` for the `@theme` block. Add these keyframes inside the `@theme` block:

```css
--animate-accordion-down: accordion-down 0.2s ease-out;
--animate-accordion-up: accordion-up 0.2s ease-out;
```

And add after the `@theme` block:

```css
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

**Step 3: Commit**

```bash
git add src/components/ui/accordion.tsx src/index.css
git commit -m "feat: add Accordion UI component with animations"
```

---

### Task 4: Create useEvaluations hook

**Files:**
- Create: `src/hooks/useEvaluations.ts`

**Step 1: Create the hook**

Follow the exact same pattern as `src/hooks/useStats.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { Evaluation } from '@/types/dashboard';

interface UseEvaluationsResult {
  data: Evaluation[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEvaluations(limit: number = 50): UseEvaluationsResult {
  const [data, setData] = useState<Evaluation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/evaluations?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch evaluations: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.evaluations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  return { data, isLoading, error, refetch: fetchEvaluations };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useEvaluations.ts
git commit -m "feat: add useEvaluations hook"
```

---

### Task 5: Create Evaluations page

**Files:**
- Create: `src/pages/evaluations.tsx`

**Step 1: Create the evaluations page**

```tsx
import { useSearchParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useEvaluations } from '@/hooks/useEvaluations';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Evaluations() {
  const [searchParams] = useSearchParams();
  const openLatest = searchParams.get('open') === 'latest';
  const { data, isLoading, error, refetch } = useEvaluations();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Error loading evaluations: {error.message}</p>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Evaluations</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 border-b last:border-b-0 pb-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              defaultValue={openLatest ? `eval-${data[0].id}` : undefined}
            >
              {data.map((evaluation) => (
                <AccordionItem key={evaluation.id} value={`eval-${evaluation.id}`}>
                  <AccordionTrigger>
                    <div className="flex flex-wrap items-center gap-2 pr-4">
                      <span className="font-medium">{formatDate(evaluation.created_at)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {evaluation.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {evaluation.triggered_by}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown>{evaluation.response}</Markdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No evaluations available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/evaluations.tsx
git commit -m "feat: add Evaluations page with accordion and markdown rendering"
```

---

### Task 6: Add route and navigation link

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

**Step 1: Add the route in App.tsx**

Add import at the top (after line 5):

```typescript
import { Evaluations } from './pages/evaluations';
```

Add route inside the layout Route group (after line 21, after the `/content` route):

```tsx
        <Route path="/evaluations" element={<Evaluations />} />
```

**Step 2: Add navigation link in Layout.tsx**

Add `SparklesIcon` to the lucide-react import on line 6:

```typescript
import { MenuIcon, HomeIcon, PenSquareIcon, ListIcon, SparklesIcon } from 'lucide-react';
```

Add a new nav link after the Content `SheetClose` block (after line 73, before `</nav>`):

```tsx
          <SheetClose asChild>
            <Link
              to="/evaluations"
              className={`flex items-center gap-4 rounded-xl px-4 py-5 text-base font-medium transition-colors ${isActive('/evaluations')
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
                }`}
            >
              <SparklesIcon className="size-5" />
              Evaluations
            </Link>
          </SheetClose>
```

**Step 3: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx
git commit -m "feat: add evaluations route and navigation link"
```

---

### Task 7: Add latest evaluation section to homepage

**Files:**
- Modify: `src/pages/home.tsx`

**Step 1: Add Link import**

The file already imports from `react-router-dom` indirectly via components, but check if `Link` is imported. If not, add:

```typescript
import { Link } from 'react-router-dom';
```

**Step 2: Add the evaluation section**

Add a new section between the Leaderboards section (ends ~line 326) and the Views Overview section (starts ~line 328). Insert after the closing `</section>` of Leaderboards and before `{/* Metrics Section */}`:

```tsx
            {/* Latest Evaluation */}
            {isLoading ? (
                <section>
                    <h2 className="text-lg font-semibold mb-5">Latest Evaluation</h2>
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
                    <h2 className="text-lg font-semibold mb-5">Latest Evaluation</h2>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>
                                {formatDate(data.latestEvaluation.created_at)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground/90 whitespace-pre-line">
                                {data.latestEvaluation.response.length > 400
                                    ? `${data.latestEvaluation.response.slice(0, 400)}...`
                                    : data.latestEvaluation.response}
                            </p>
                            {data.latestEvaluation.response.length > 400 && (
                                <Link
                                    to="/evaluations?open=latest"
                                    className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                                >
                                    Read more →
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </section>
            ) : null}
```

**Step 3: Add Link import if not present**

At the top of `src/pages/home.tsx`, add `Link` import. Currently no router imports exist in this file, so add:

```typescript
import { Link } from 'react-router-dom';
```

**Step 4: Commit**

```bash
git add src/pages/home.tsx
git commit -m "feat: add latest evaluation section to homepage"
```

---

### Task 8: Verify and test

**Step 1: Run the dev server**

Run: `npm run dev`

**Step 2: Verify manually**

- Homepage: Latest Evaluation card appears above Views Overview
- Latest Evaluation: text is truncated at 400 chars with "Read more →" link
- "Read more →" navigates to `/evaluations?open=latest`
- Evaluations page: accordion list shows all evaluations
- Most recent accordion is open by default when arriving via "Read more" link
- Accordion triggers show date, model badge, triggered_by badge
- Opening an accordion renders markdown content properly
- Navigation: "Evaluations" link appears in mobile menu with sparkles icon
- Empty state: if no evaluations, homepage section is hidden, evaluations page shows empty message

**Step 3: Fix any TypeScript errors**

Run: `npx tsc --noEmit`

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address any TypeScript or runtime issues"
```
