import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MediaItem } from '@/types/dashboard';

interface MediaPreviewModalProps {
  media: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function MediaPreviewModal({ media, open, onOpenChange }: MediaPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {media && (
          <>
            <DialogHeader>
              <DialogTitle className="break-all font-mono text-sm">{media.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <span>{formatDate(media.createdAt)}</span>
                <Badge variant={media.posted ? 'default' : 'secondary'}>
                  {media.posted ? 'Posted' : 'Unused'}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <video
              key={media.url}
              src={media.url}
              controls
              playsInline
              className="w-full rounded aspect-[9/16] bg-black object-contain"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
