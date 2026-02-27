# Hooks & Captions Management UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/content` page with tabbed management UI for hooks and captions — add new items and toggle enabled/disabled state.

**Architecture:** Single page component with Tabs for hooks/captions. A custom `useContent` hook fetches data from both endpoints. Each tab shows an inline add form and a table of items with toggle switches.

**Tech Stack:** React 19, React Router v7, Tailwind CSS, Radix UI (Tabs), shadcn components (Card, Badge, Button, Table, Input), native fetch API with Neon Auth.

---

### Task 1: Add Switch UI Component

**Files:**
- Create: `src/components/ui/switch.tsx`

**Step 1: Install radix switch and create component**

Run: `npm install @radix-ui/react-switch` — actually, check if radix-ui package already includes it (it's using the monorepo `radix-ui` import style).

Run: `grep -r "from \"radix-ui\"" src/components/ui/ | head -5` to verify import style.

The project uses `import { ... } from "radix-ui"` (monorepo style), so Switch should be available as `import { Switch as SwitchPrimitive } from "radix-ui"`.

Create `src/components/ui/switch.tsx`:

```tsx
import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background pointer-events-none block size-4 rounded-full ring-0 shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
```

**Step 2: Commit**

```bash
git add src/components/ui/switch.tsx
git commit -m "feat: add Switch UI component"
```

---

### Task 2: Create useContent Hook

**Files:**
- Create: `src/hooks/useContent.ts`

**Step 1: Create the hook**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';

interface ContentItem {
  id: number;
  text: string;
  enabled: boolean;
  created_at: string;
}

interface UseContentResult {
  hooks: ContentItem[];
  captions: ContentItem[];
  isLoading: boolean;
  error: Error | null;
  addHook: (text: string) => Promise<{ success: boolean; error?: string }>;
  addCaption: (text: string) => Promise<{ success: boolean; error?: string }>;
  toggleHook: (id: number, enabled: boolean) => Promise<void>;
  toggleCaption: (id: number, enabled: boolean) => Promise<void>;
}

async function getAuthHeaders() {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.data.session.token}`,
    'Content-Type': 'application/json',
  };
}

export function useContent(): UseContentResult {
  const [hooks, setHooks] = useState<ContentItem[]>([]);
  const [captions, setCaptions] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const [hooksRes, captionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hooks?all=true`, { headers }),
        fetch(`${API_BASE_URL}/api/captions?all=true`, { headers }),
      ]);

      if (!hooksRes.ok || !captionsRes.ok) {
        throw new Error('Failed to fetch content');
      }

      const hooksData = await hooksRes.json();
      const captionsData = await captionsRes.json();
      setHooks(hooksData.hooks);
      setCaptions(captionsData.captions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addHook = useCallback(async (text: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/hooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      setHooks(prev => [data.hook, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to add hook' };
    }
  }, []);

  const addCaption = useCallback(async (text: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      setCaptions(prev => [data.caption, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to add caption' };
    }
  }, []);

  const toggleHook = useCallback(async (id: number, enabled: boolean) => {
    // Optimistic update
    setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled } : h));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/hooks/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        // Rollback
        setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled: !enabled } : h));
      }
    } catch {
      // Rollback
      setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled: !enabled } : h));
    }
  }, []);

  const toggleCaption = useCallback(async (id: number, enabled: boolean) => {
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, enabled } : c));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/captions/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setCaptions(prev => prev.map(c => c.id === id ? { ...c, enabled: !enabled } : c));
      }
    } catch {
      setCaptions(prev => prev.map(c => c.id === id ? { ...c, enabled: !enabled } : c));
    }
  }, []);

  return { hooks, captions, isLoading, error, addHook, addCaption, toggleHook, toggleCaption };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useContent.ts
git commit -m "feat: add useContent hook for hooks/captions management"
```

---

### Task 3: Create Content Management Page

**Files:**
- Create: `src/pages/content.tsx`

**Step 1: Create the page component**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContent } from '@/hooks/useContent';

interface ContentItem {
  id: number;
  text: string;
  enabled: boolean;
  created_at: string;
}

function AddForm({
  placeholder,
  maxLength,
  onAdd,
}: {
  placeholder: string;
  maxLength: number;
  onAdd: (text: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [text, setText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsAdding(true);
    setError(null);
    const result = await onAdd(trimmed);
    setIsAdding(false);

    if (result.success) {
      setText('');
    } else {
      setError(result.error ?? 'Failed to add');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <div className="flex-1 space-y-1">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isAdding}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={isAdding || !text.trim()}>
        {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add
      </Button>
    </form>
  );
}

function ItemsTable({
  items,
  onToggle,
}: {
  items: ContentItem[];
  onToggle: (id: number, enabled: boolean) => Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">No items yet.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Text</TableHead>
          <TableHead className="w-24 text-center">Status</TableHead>
          <TableHead className="w-20 text-center">Enabled</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="max-w-md whitespace-normal break-words">
              {item.text}
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={item.enabled ? 'default' : 'secondary'}>
                {item.enabled ? 'Active' : 'Disabled'}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Switch
                checked={item.enabled}
                onCheckedChange={(checked) => onToggle(item.id, checked)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function Content() {
  const { hooks, captions, isLoading, error, addHook, addCaption, toggleHook, toggleCaption } =
    useContent();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">Manage hooks and captions used in posts.</p>
      </div>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-destructive font-medium">{error.message}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="hooks">
          <TabsList>
            <TabsTrigger value="hooks">Hooks ({hooks.length})</TabsTrigger>
            <TabsTrigger value="captions">Captions ({captions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="hooks">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Hooks</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ContentSkeleton />
                ) : (
                  <>
                    <AddForm
                      placeholder="Enter new hook text..."
                      maxLength={500}
                      onAdd={addHook}
                    />
                    <ItemsTable items={hooks} onToggle={toggleHook} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="captions">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Captions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ContentSkeleton />
                ) : (
                  <>
                    <AddForm
                      placeholder="Enter new caption text..."
                      maxLength={2200}
                      onAdd={addCaption}
                    />
                    <ItemsTable items={captions} onToggle={toggleCaption} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/content.tsx
git commit -m "feat: add Content management page component"
```

---

### Task 4: Add Route and Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

**Step 1: Add route to App.tsx**

Add import at top:
```tsx
import { Content } from './pages/content';
```

Add route after the `/post/:postId` route:
```tsx
<Route path="/content" element={<Content />} />
```

**Step 2: Add nav item to Layout.tsx**

Add `ListIcon` to the lucide-react import:
```tsx
import { MenuIcon, HomeIcon, PenSquareIcon, ListIcon } from 'lucide-react';
```

Add a new `SheetClose` nav link after the Post link (inside the `<nav>` element, before the closing `</nav>`):

```tsx
<SheetClose asChild>
  <Link
    to="/content"
    className={`flex items-center gap-4 rounded-xl px-4 py-5 text-base font-medium transition-colors ${isActive('/content')
      ? 'bg-accent text-accent-foreground'
      : 'hover:bg-accent/50'
      }`}
  >
    <ListIcon className="size-5" />
    Content
  </Link>
</SheetClose>
```

**Step 3: Verify the app compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx
git commit -m "feat: add content route and nav menu entry"
```

---

### Task 5: Verify end-to-end

**Step 1: Run dev server**

Run: `npm run dev`

**Step 2: Manual verification checklist**

- [ ] Navigate to `/content` from nav menu
- [ ] "Back to Dashboard" link works
- [ ] Hooks tab shows items with toggle switches
- [ ] Captions tab shows items with toggle switches
- [ ] Can add a new hook
- [ ] Can add a new caption
- [ ] Toggle switches update immediately (optimistic)
- [ ] Duplicate text shows error message
- [ ] Tab counts update when items are added

**Step 3: Run build to verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds.
