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
