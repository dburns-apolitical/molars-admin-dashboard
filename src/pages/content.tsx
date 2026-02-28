import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Pencil } from 'lucide-react';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  onToggleAccount,
}: {
  items: ContentItem[];
  onToggle: (id: number, enabled: boolean) => Promise<void>;
  onToggleAccount: (itemId: number, accountId: number, assigned: boolean) => Promise<void>;
}) {
  const { accounts } = useAccounts();

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
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex flex-wrap gap-1 items-center cursor-pointer hover:opacity-80 transition-opacity">
                    {item.accounts.length > 0 ? (
                      item.accounts.map((a) => (
                        <Badge key={a.id} variant="outline" className="text-xs">
                          {a.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                    <Pencil className="size-3 text-muted-foreground ml-1" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Assign to accounts</p>
                    {accounts.map((account) => {
                      const assigned = item.accounts.some(a => a.id === account.id);
                      return (
                        <div key={account.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`item-${item.id}-account-${account.id}`}
                            checked={assigned}
                            onCheckedChange={() => onToggleAccount(item.id, account.id, assigned)}
                          />
                          <Label
                            htmlFor={`item-${item.id}-account-${account.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {account.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
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
  const { hooks, captions, isLoading, error, addHook, addCaption, toggleHook, toggleCaption, toggleItemAccount } =
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
                    <ItemsTable
                      items={hooks}
                      onToggle={toggleHook}
                      onToggleAccount={(itemId, acctId, assigned) => toggleItemAccount('hooks', itemId, acctId, assigned)}
                    />
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
                    <ItemsTable
                      items={captions}
                      onToggle={toggleCaption}
                      onToggleAccount={(itemId, acctId, assigned) => toggleItemAccount('captions', itemId, acctId, assigned)}
                    />
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
