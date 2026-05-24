import { useEffect, useState } from 'react';
import { PlayIcon } from 'lucide-react';

import { AccountFilter } from '@/components/AccountFilter';
import { MediaPreviewModal } from '@/components/MediaPreviewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import { useMedia } from '@/hooks/useMedia';
import type { MediaItem } from '@/types/dashboard';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MediaSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function Media() {
  const { accountId } = useAccountFilter();
  const { media, isLoading, error, refetch } = useMedia(accountId);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    setPreviewMedia(null);
  }, [accountId]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--term-text-faint)] font-mono">
            $ molars ls /media
          </div>
          <h1 className="font-mono text-2xl md:text-[28px] font-semibold tracking-tight lowercase mt-2">
            media<span className="cursor" aria-hidden />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Preview videos available to each account.</p>
        </div>
        <AccountFilter />
      </div>

      {accountId === null ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select an account to view its media.
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-destructive font-medium">{error.message}</p>
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <MediaSkeleton />
            ) : media.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No videos in this account's bucket yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Thumbnail</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead className="w-40 hidden sm:table-cell">Uploaded</TableHead>
                    <TableHead className="w-24 text-center">Posted</TableHead>
                    <TableHead className="w-16 text-center">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {media.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <video
                          src={item.url}
                          preload="metadata"
                          muted
                          className="aspect-[9/16] w-20 bg-muted object-cover border border-border"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <span className="block max-w-md truncate" title={item.name}>
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.posted ? 'default' : 'secondary'}>
                          {item.posted ? 'Posted' : 'Unused'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Preview ${item.name}`}
                          onClick={() => setPreviewMedia(item)}
                        >
                          <PlayIcon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <MediaPreviewModal
        media={previewMedia}
        open={previewMedia !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewMedia(null);
        }}
      />
    </div>
  );
}
