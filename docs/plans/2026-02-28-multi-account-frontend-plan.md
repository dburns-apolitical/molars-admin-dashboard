# Multi-Account Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the frontend to support dynamic, DB-managed accounts — replacing all hardcoded account references with API-driven data, adding an Accounts CRUD page, account-scoped content/post creation, and URL-based filtering.

**Architecture:** React context (`AccountsProvider`) provides the accounts list app-wide. A `useAccountFilter()` hook manages `?accountId=N` URL params for filtering. Shared `<AccountFilter />` dropdown is reused across Dashboard and Content pages.

**Tech Stack:** React 19, TypeScript, React Router v7, Tailwind CSS v4, Radix UI (shadcn-style), Lucide icons

**Design Doc:** `docs/plans/2026-02-28-multi-account-frontend-design.md`

---

### Task 1: Add Account type to types

**Files:**
- Modify: `src/types/dashboard.ts`

**Step 1: Add Account and ContentItem types**

Add to `src/types/dashboard.ts`:

```typescript
export interface Account {
  id: number;
  name: string;
  ig_access_token: string;
  ig_user_id: string;
  gcs_bucket_name: string;
}

export interface ContentItem {
  id: number;
  text: string;
  enabled: boolean;
  created_at: string;
  accounts: { id: number; name: string }[];
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: no type errors

---

### Task 2: Create AccountsContext

**Files:**
- Create: `src/contexts/AccountsContext.tsx`

**Step 1: Create the context provider and hook**

Create `src/contexts/AccountsContext.tsx`:

```typescript
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { Account } from '@/types/dashboard';

interface AccountsContextValue {
  accounts: Account[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authClient.getSession();
      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }
      const res = await fetch(`${API_BASE_URL}/api/accounts`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      setAccounts(data.accounts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <AccountsContext.Provider value={{ accounts, isLoading, error, refetch: fetchAccounts }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountsProvider');
  }
  return context;
}
```

**Step 2: Wire into App.tsx**

In `src/App.tsx`, wrap the Routes with `AccountsProvider`. The provider goes inside the `<Routes>` at the `<Layout>` level, since it needs auth context which is only available after sign-in. Modify the Layout route:

```typescript
import { AccountsProvider } from './contexts/AccountsContext';
```

Wrap the protected `<Route element={<Layout />}>` so the provider is inside the layout:

Change in `src/App.tsx`:
```typescript
{/* Protected routes with layout */}
<Route element={<Layout />}>
```
to:
```typescript
{/* Protected routes with layout */}
<Route element={<AccountsProvider><Layout /></AccountsProvider>}>
```

Wait — `<Route element>` only accepts a single element. Instead, create a wrapper component or put the provider inside `Layout.tsx`.

Better approach: Add `AccountsProvider` inside `Layout` component in `src/components/Layout.tsx:95-117`. Wrap the content inside `<SignedIn>`:

In `src/components/Layout.tsx`, add import:
```typescript
import { AccountsProvider } from '@/contexts/AccountsContext';
```

Then wrap the layout content with `<AccountsProvider>`:
```typescript
export function Layout() {
  return (
    <>
      <SignedIn>
        <AccountsProvider>
          <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight">Molars Dashboard</h1>
                <MobileNav />
              </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
              <Outlet />
            </main>
          </div>
        </AccountsProvider>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: no errors

---

### Task 3: Create useAccountFilter hook

**Files:**
- Create: `src/hooks/useAccountFilter.ts`

**Step 1: Create the hook**

Create `src/hooks/useAccountFilter.ts`:

```typescript
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useAccountFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const accountId = searchParams.get('accountId')
    ? Number(searchParams.get('accountId'))
    : null;

  const setAccountId = useCallback(
    (id: number | null) => {
      setSearchParams((prev) => {
        if (id === null) {
          prev.delete('accountId');
        } else {
          prev.set('accountId', String(id));
        }
        return prev;
      });
    },
    [setSearchParams]
  );

  return { accountId, setAccountId };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: no errors

---

### Task 4: Create AccountFilter shared component

**Files:**
- Create: `src/components/AccountFilter.tsx`

**Step 1: Create the component**

Create `src/components/AccountFilter.tsx`:

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccounts } from '@/contexts/AccountsContext';
import { useAccountFilter } from '@/hooks/useAccountFilter';

export function AccountFilter() {
  const { accounts } = useAccounts();
  const { accountId, setAccountId } = useAccountFilter();

  return (
    <Select
      value={accountId !== null ? String(accountId) : 'all'}
      onValueChange={(value) =>
        setAccountId(value === 'all' ? null : Number(value))
      }
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Accounts</SelectItem>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={String(account.id)}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: no errors

---

### Task 5: Update Dashboard to use dynamic accounts

**Files:**
- Modify: `src/pages/home.tsx:1-2,276-309`

**Step 1: Replace hardcoded account dropdown**

In `src/pages/home.tsx`, replace the account state and dropdown:

Remove:
```typescript
import { useState } from 'react';
```
(Keep `useState` only if still needed for other state — in this file it's only used for `accountId`, so remove it.)

Remove the `useState` import and add `useAccountFilter`:
```typescript
import { useAccountFilter } from '@/hooks/useAccountFilter';
```

Replace lines 276-279:
```typescript
export function Home() {
    const [accountId, setAccountId] = useState<string>('all');
    const { data, isLoading, error, refetch } = useStats(
        accountId === 'all' ? null : Number(accountId)
    );
```

With:
```typescript
export function Home() {
    const { accountId, setAccountId } = useAccountFilter();
    const { data, isLoading, error, refetch } = useStats(accountId);
```

Replace the hardcoded Select (lines 300-309):
```typescript
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
```

With:
```typescript
<AccountFilter />
```

Add import:
```typescript
import { AccountFilter } from '@/components/AccountFilter';
```

Remove the `Select`-related imports (`Select, SelectContent, SelectItem, SelectTrigger, SelectValue`) since they're no longer used in this file.

**Step 2: Verify build**

Run: `npm run build`
Expected: no errors


---

### Task 6: Add Accounts nav item and route

**Files:**
- Modify: `src/components/Layout.tsx:6,73-85`
- Modify: `src/App.tsx`
- Create: `src/pages/accounts.tsx` (placeholder)

**Step 1: Create placeholder Accounts page**

Create `src/pages/accounts.tsx`:

```typescript
export function Accounts() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">Manage Instagram accounts.</p>
      </div>
    </div>
  );
}
```

**Step 2: Add route in App.tsx**

In `src/App.tsx`, add import:
```typescript
import { Accounts } from './pages/accounts';
```

Add route after the `/content` route:
```typescript
<Route path="/accounts" element={<Accounts />} />
```

**Step 3: Add nav item in Layout.tsx**

In `src/components/Layout.tsx`, add `UsersIcon` to the lucide imports (line 6):
```typescript
import { MenuIcon, HomeIcon, PenSquareIcon, ListIcon, UsersIcon, SparklesIcon } from 'lucide-react';
```

Add the Accounts nav item after the Content `<SheetClose>` block (after line 72) and before the Evaluations block:

```typescript
<SheetClose asChild>
  <Link
    to="/accounts"
    className={`flex items-center gap-4 rounded-xl px-4 py-5 text-base font-medium transition-colors ${isActive('/accounts')
      ? 'bg-accent text-accent-foreground'
      : 'hover:bg-accent/50'
      }`}
  >
    <UsersIcon className="size-5" />
    Accounts
  </Link>
</SheetClose>
```

**Step 4: Verify build**

Run: `npm run build`
Expected: no errors


---

### Task 7: Build Accounts CRUD page

**Files:**
- Modify: `src/pages/accounts.tsx`

**Step 1: Implement full Accounts page**

Replace `src/pages/accounts.tsx` with the full implementation:

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAccounts } from '@/contexts/AccountsContext';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { Account } from '@/types/dashboard';

async function getAuthHeaders() {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.data.session.token}`,
    'Content-Type': 'application/json',
  };
}

function AccountForm({
  account,
  onSave,
  onCancel,
}: {
  account: Account | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(account?.name ?? '');
  const [igAccessToken, setIgAccessToken] = useState('');
  const [igUserId, setIgUserId] = useState(account?.ig_user_id ?? '');
  const [gcsBucketName, setGcsBucketName] = useState(account?.gcs_bucket_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = account !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const body: Record<string, string> = { name, ig_user_id: igUserId, gcs_bucket_name: gcsBucketName };
      if (igAccessToken) body.ig_access_token = igAccessToken;

      const url = isEdit
        ? `${API_BASE_URL}/api/accounts/${account.id}`
        : `${API_BASE_URL}/api/accounts`;

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save account');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{isEdit ? 'Edit Account' : 'Add Account'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="igAccessToken">
              IG Access Token {isEdit && <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="igAccessToken"
              type="password"
              value={igAccessToken}
              onChange={(e) => setIgAccessToken(e.target.value)}
              required={!isEdit}
              placeholder={isEdit ? '••••••••' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="igUserId">IG User ID</Label>
            <Input id="igUserId" value={igUserId} onChange={(e) => setIgUserId(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gcsBucketName">GCS Bucket Name</Label>
            <Input id="gcsBucketName" value={gcsBucketName} onChange={(e) => setGcsBucketName(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function Accounts() {
  const { accounts, isLoading, refetch } = useAccounts();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/accounts/${deleteTarget.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = () => {
    setShowAddForm(false);
    setEditingAccount(null);
    refetch();
  };

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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage Instagram accounts.</p>
        </div>
        {!showAddForm && !editingAccount && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="size-4" />
            Add Account
          </Button>
        )}
      </div>

      {(showAddForm || editingAccount) && (
        <div className="mb-6">
          <AccountForm
            account={editingAccount}
            onSave={handleSave}
            onCancel={() => {
              setShowAddForm(false);
              setEditingAccount(null);
            }}
          />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No accounts configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">IG User ID</TableHead>
                  <TableHead className="hidden sm:table-cell">GCS Bucket</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {account.ig_user_id}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {account.gcs_bucket_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingAccount(account);
                            setShowAddForm(false);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteTarget(account);
                            setDeleteError(null);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: no errors


---

### Task 8: Update useContent hook for account filtering and assignment

**Files:**
- Modify: `src/hooks/useContent.ts`

**Step 1: Update the hook**

Update `src/hooks/useContent.ts` to:
1. Accept an optional `accountId` parameter
2. Use the `ContentItem` type from `types/dashboard.ts` (which includes `accounts[]`)
3. Pass `accountId` as query param when fetching
4. Accept `accountIds` when adding content

Replace the entire file:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { ContentItem } from '@/types/dashboard';

interface UseContentResult {
  hooks: ContentItem[];
  captions: ContentItem[];
  isLoading: boolean;
  error: Error | null;
  addHook: (text: string, accountIds?: number[]) => Promise<{ success: boolean; error?: string }>;
  addCaption: (text: string, accountIds?: number[]) => Promise<{ success: boolean; error?: string }>;
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

export function useContent(accountId: number | null = null): UseContentResult {
  const [hooks, setHooks] = useState<ContentItem[]>([]);
  const [captions, setCaptions] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ all: 'true' });
      if (accountId !== null) params.set('accountId', String(accountId));
      const qs = params.toString();

      const [hooksRes, captionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hooks?${qs}`, { headers }),
        fetch(`${API_BASE_URL}/api/captions?${qs}`, { headers }),
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
  }, [accountId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addHook = useCallback(async (text: string, accountIds?: number[]) => {
    try {
      const headers = await getAuthHeaders();
      const body: Record<string, unknown> = { text };
      if (accountIds?.length) body.accountIds = accountIds;
      const res = await fetch(`${API_BASE_URL}/api/hooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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

  const addCaption = useCallback(async (text: string, accountIds?: number[]) => {
    try {
      const headers = await getAuthHeaders();
      const body: Record<string, unknown> = { text };
      if (accountIds?.length) body.accountIds = accountIds;
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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
    setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled } : h));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/hooks/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled: !enabled } : h));
      }
    } catch {
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

**Step 2: Verify build**

Run: `npm run build`
Expected: no errors


---

### Task 9: Update Content page with account filter, assignment, and accounts column

**Files:**
- Modify: `src/pages/content.tsx`

**Step 1: Update the Content page**

Major changes:
1. Add `<AccountFilter />` to the page header
2. Pass `accountId` from `useAccountFilter()` to `useContent(accountId)`
3. Update `AddForm` to accept account checkboxes
4. Update `ItemsTable` to show accounts column as badges
5. Remove the local `ContentItem` interface (use the one from types)

Replace `src/pages/content.tsx`:

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';

import { AccountFilter } from '@/components/AccountFilter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAccounts } from '@/contexts/AccountsContext';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import { useContent } from '@/hooks/useContent';
import type { ContentItem } from '@/types/dashboard';

function AddForm({
  placeholder,
  maxLength,
  onAdd,
}: {
  placeholder: string;
  maxLength: number;
  onAdd: (text: string, accountIds?: number[]) => Promise<{ success: boolean; error?: string }>;
}) {
  const { accounts } = useAccounts();
  const [text, setText] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAccount = (id: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsAdding(true);
    setError(null);
    const result = await onAdd(trimmed, selectedAccountIds.length > 0 ? selectedAccountIds : undefined);
    setIsAdding(false);

    if (result.success) {
      setText('');
      setSelectedAccountIds([]);
    } else {
      setError(result.error ?? 'Failed to add');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-4">
      <div className="flex gap-2">
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
      </div>
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-1.5">
              <Checkbox
                id={`account-${account.id}`}
                checked={selectedAccountIds.includes(account.id)}
                onCheckedChange={() => toggleAccount(account.id)}
                disabled={isAdding}
              />
              <Label htmlFor={`account-${account.id}`} className="text-sm font-normal cursor-pointer">
                {account.name}
              </Label>
            </div>
          ))}
        </div>
      )}
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
          <TableHead className="hidden sm:table-cell">Accounts</TableHead>
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
            <TableCell className="hidden sm:table-cell">
              <div className="flex flex-wrap gap-1">
                {item.accounts.length > 0 ? (
                  item.accounts.map((a) => (
                    <Badge key={a.id} variant="outline" className="text-xs">
                      {a.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Unassigned</span>
                )}
              </div>
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
  const { accountId } = useAccountFilter();
  const { hooks, captions, isLoading, error, addHook, addCaption, toggleHook, toggleCaption } =
    useContent(accountId);

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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">Manage hooks and captions used in posts.</p>
        </div>
        <AccountFilter />
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

**Step 2: Verify build**

Run: `npm run build`
Expected: no errors


---

### Task 10: Update Post page with account selector and scoped content

**Files:**
- Modify: `src/pages/post.tsx`

**Step 1: Update the Post page**

Major changes:
1. Replace "post to main account" checkbox with account selector dropdown at top
2. Fetch content scoped to selected account
3. Remove confirmation dialog for main account
4. Form disabled until account is selected

Replace `src/pages/post.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ComboboxInput } from '@/components/ui/combobox-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAccounts } from '@/contexts/AccountsContext';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

interface PostReelResponse {
  success: boolean;
  message?: string;
  postId?: number;
}

export function Post() {
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [hookText, setHookText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [videoTitle, setVideoTitle] = useState('random');
  const [hookSuggestions, setHookSuggestions] = useState<string[]>([]);
  const [captionSuggestions, setCaptionSuggestions] = useState<string[]>([]);
  const [videoOptions, setVideoOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedAccountId) {
      setHookSuggestions([]);
      setCaptionSuggestions([]);
      setVideoOptions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const session = await authClient.getSession();
      const token = session?.data?.session?.token;
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const accountParam = `accountId=${selectedAccountId}`;

      const [captionsRes, hooksRes, videosRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/captions?${accountParam}`, { headers }),
        fetch(`${API_BASE_URL}/api/hooks?${accountParam}`, { headers }),
        fetch(`${API_BASE_URL}/api/videos?${accountParam}`, { headers }),
      ]);

      if (captionsRes.status === 'fulfilled' && captionsRes.value.ok) {
        const data = await captionsRes.value.json();
        setCaptionSuggestions(data.captions.map((c: { text: string }) => c.text));
      }
      if (hooksRes.status === 'fulfilled' && hooksRes.value.ok) {
        const data = await hooksRes.value.json();
        setHookSuggestions(data.hooks.map((h: { text: string }) => h.text));
      }
      if (videosRes.status === 'fulfilled' && videosRes.value.ok) {
        const data = await videosRes.value.json();
        setVideoOptions(data.videos);
      }
    };

    fetchSuggestions();
  }, [selectedAccountId]);

  const submitPost = async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const body: Record<string, unknown> = {
        accountId: Number(selectedAccountId),
        shareToFeed,
      };

      if (caption.trim()) body.caption = caption.trim();
      if (hookText.trim()) body.hookText = hookText.trim();
      if (hashtags.length > 0) body.hashtags = hashtags;
      if (videoTitle !== 'random') body.videoTitle = videoTitle;

      const response = await fetch(`${API_BASE_URL}/api/post-reel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json() as PostReelResponse;

      if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.statusText}`);
      }

      if (data.postId) {
        navigate(`/post/${data.postId}`);
      } else {
        throw new Error('No post ID returned from server');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPost();
  };

  const resetForm = () => {
    setCaption('');
    setHookText('');
    setHashtags([]);
    setVideoTitle('random');
    setShareToFeed(false);
    setStatus('idle');
    setErrorMessage(null);
  };

  const isFormDisabled = !selectedAccountId || status === 'loading';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Post Reel</h1>
        <p className="text-muted-foreground mt-2">
          Create a new reel post. Leave fields empty to use randomly generated content.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>New Reel</CardTitle>
            <CardDescription>
              Configure your reel's caption, hook text, and hashtags
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Account Select */}
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={(value) => {
                  setSelectedAccountId(value);
                  setVideoTitle('random');
                  setCaption('');
                  setHookText('');
                }}
                disabled={status === 'loading'}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose which account to post to. Content and videos will be filtered to this account.
              </p>
            </div>

            {/* Video Select */}
            <div className="space-y-2">
              <Label htmlFor="video">Video</Label>
              <Select
                value={videoTitle}
                onValueChange={setVideoTitle}
                disabled={isFormDisabled}
              >
                <SelectTrigger id="video">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  {videoOptions.map((filename) => (
                    <SelectItem key={filename} value={filename}>
                      {filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a specific video or use a random one.
              </p>
            </div>

            {/* Hook Text Input */}
            <div className="space-y-2">
              <Label htmlFor="hookText" className="mb-5!">Hook Text</Label>
              <ComboboxInput
                value={hookText}
                onValueChange={setHookText}
                options={hookSuggestions}
                placeholder="Hot Mulligan meets The 1975"
                disabled={isFormDisabled}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                The attention-grabbing text overlay. Leave empty for a random hook.
              </p>
            </div>

            {/* Caption Input */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <ComboboxInput
                value={caption}
                onValueChange={setCaption}
                options={captionSuggestions}
                placeholder="Can you name a better emo band?"
                disabled={isFormDisabled}
                maxLength={2200}
              />
              <p className="text-xs text-muted-foreground">
                The post caption. Leave empty for a random caption.
              </p>
            </div>

            {/* Hashtags Input */}
            <div className="space-y-2">
              <Label>Hashtags</Label>
              <TagInput
                value={hashtags}
                onChange={setHashtags}
                maxTags={5}
                placeholder="emo, postemo, poppunk..."
                disabled={isFormDisabled}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for randomly selected hashtags.
              </p>
            </div>

            {/* Post Options */}
            <div className="space-y-4">
              <Label>Post Options</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="shareToFeed"
                  checked={shareToFeed}
                  onCheckedChange={(checked) => setShareToFeed(checked === true)}
                  disabled={isFormDisabled}
                />
                <Label htmlFor="shareToFeed" className="font-normal cursor-pointer">
                  Share to main grid
                </Label>
              </div>
            </div>

            {/* Error Message */}
            {status === 'error' && errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="size-4 shrink-0" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={status === 'loading'}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={isFormDisabled}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send />
                  Post Reel
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: no errors


---

### Task 11: Final build verification

**Step 1: Full build check**

Run: `npm run build`
Expected: clean build, no errors

**Step 2: Lint check**

Run: `npm run lint`
Expected: no errors (warnings acceptable)

