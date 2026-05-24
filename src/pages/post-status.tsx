import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostStatus } from '@/hooks/usePostStatus';
import type { PostStatus as PostStatusType } from '@/types/dashboard';

function getStatusConfig(status: PostStatusType) {
  switch (status) {
    case 'success':
    case 'posted':
      return {
        variant: 'default' as const,
        label: status === 'success' ? 'Success' : 'Posted',
        icon: CheckCircle2,
        className: 'bg-emerald-500 hover:bg-emerald-500',
      };
    case 'failed':
      return {
        variant: 'destructive' as const,
        label: 'Failed',
        icon: XCircle,
        className: '',
      };
    case 'pending':
      return {
        variant: 'secondary' as const,
        label: 'Pending',
        icon: Clock,
        className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    default:
      return {
        variant: 'outline' as const,
        label: status,
        icon: Clock,
        className: '',
      };
  }
}

function PostStatusSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PostStatus() {
  const { postId } = useParams<{ postId: string }>();
  const { data, isLoading, error } = usePostStatus(postId);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/post">
              New Post
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <XCircle className="size-12 text-destructive" />
            <p className="text-destructive font-medium">{error.message}</p>
            <Button variant="outline" asChild>
              <Link to="/">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/post">
              New Post
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        <PostStatusSkeleton />
      </div>
    );
  }

  const statusConfig = getStatusConfig(data.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/post">
            New Post
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      {/* Status Header */}
      <div className="mb-8">
        <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--term-text-faint)] font-mono">
          $ molars status {data.id}
        </div>
        <div className="flex items-center gap-3 mt-2 mb-2 flex-wrap">
          <h1 className="font-mono text-2xl md:text-[28px] font-semibold tracking-tight lowercase">
            status<span className="cursor" aria-hidden />
          </h1>
          <Badge variant={statusConfig.variant} className={statusConfig.className}>
            <StatusIcon className="size-3" />
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {data.status === 'pending' && (
            <>
              <Loader2 className="inline-block mr-2 size-4 animate-spin" />
              Your post is being processed. This page will update automatically.
            </>
          )}
          {data.status === 'success' && 'Your post has been published successfully!'}
          {data.status === 'posted' && 'Your post has been published!'}
          {data.status === 'failed' && 'There was an error publishing your post.'}
        </p>
      </div>

      {/* Post Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{data.video.title}</CardTitle>
          <CardDescription>Post ID: {data.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hook Text */}
          <div>
            <h3 className="section-title mb-2">Hook Text</h3>
            <p className="text-foreground">{data.hook.text}</p>
          </div>

          {/* Caption */}
          <div>
            <h3 className="section-title mb-2">Caption</h3>
            <p className="text-foreground whitespace-pre-wrap">{data.caption.text}</p>
          </div>

          {/* Hashtags */}
          {data.hashtags.length > 0 && (
            <div>
              <h3 className="section-title mb-2">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {data.hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{new Date(data.created_at).toLocaleString()}</span>
            </div>
            {data.instagram_post_id && (
              <div className="flex justify-between mt-2">
                <span>Instagram Post ID</span>
                <span className="font-mono text-xs">{data.instagram_post_id}</span>
              </div>
            )}
            {data.views !== null && (
              <div className="flex justify-between mt-2">
                <span>Views</span>
                <span>{data.views.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
