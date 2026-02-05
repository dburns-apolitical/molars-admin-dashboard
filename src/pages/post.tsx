import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
    const [caption, setCaption] = useState('');
    const [hookText, setHookText] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [shareToFeed, setShareToFeed] = useState(false);
    const [postToMainAccount, setPostToMainAccount] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const submitPost = async () => {
        setStatus('loading');
        setErrorMessage(null);

        try {
            const session = await authClient.getSession();

            if (!session?.data?.session?.token) {
                throw new Error('Not authenticated. Please log in again.');
            }

            const body: Record<string, unknown> = {};

            if (caption.trim()) {
                body.caption = caption.trim();
            }
            if (hookText.trim()) {
                body.hookText = hookText.trim();
            }
            if (hashtags.length > 0) {
                body.hashtags = hashtags;
            }

            body.shareToFeed = shareToFeed;
            body.accountId = postToMainAccount ? 1 : 2;

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

        if (postToMainAccount) {
            setShowConfirmDialog(true);
            return;
        }

        await submitPost();
    };

    const handleConfirmSubmit = async () => {
        setShowConfirmDialog(false);
        setConfirmText('');
        await submitPost();
    };

    const resetForm = () => {
        setCaption('');
        setHookText('');
        setHashtags([]);
        setShareToFeed(false);
        setPostToMainAccount(false);
        setShowConfirmDialog(false);
        setConfirmText('');
        setStatus('idle');
        setErrorMessage(null);
    };

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

                    <CardContent className="space-y-6">
                        {/* Hook Text Input */}
                        <div className="space-y-2">
                            <Label htmlFor="hookText">Hook Text</Label>
                            <Input
                                id="hookText"
                                value={hookText}
                                onChange={(e) => setHookText(e.target.value)}
                                placeholder="Hot Mulligan meets The 1975"
                                disabled={status === 'loading'}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground">
                                The attention-grabbing text overlay. Leave empty for a random hook.
                            </p>
                        </div>

                        {/* Caption Input */}
                        <div className="space-y-2">
                            <Label htmlFor="caption">Caption</Label>
                            <Textarea
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Can you name a better emo band?"
                                disabled={status === 'loading'}
                                maxLength={2200}
                                rows={4}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>The post caption. Leave empty for a random caption.</span>
                                <span>{caption.length}/2200</span>
                            </div>
                        </div>

                        {/* Hashtags Input */}
                        <div className="space-y-2">
                            <Label>Hashtags</Label>
                            <TagInput
                                value={hashtags}
                                onChange={setHashtags}
                                maxTags={5}
                                placeholder="emo, postemo, poppunk..."
                                disabled={status === 'loading'}
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
                                    disabled={status === 'loading'}
                                />
                                <Label htmlFor="shareToFeed" className="font-normal cursor-pointer">
                                    Share to main grid
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="postToMainAccount"
                                    checked={postToMainAccount}
                                    onCheckedChange={(checked) => setPostToMainAccount(checked === true)}
                                    disabled={status === 'loading'}
                                />
                                <Label htmlFor="postToMainAccount" className="font-normal cursor-pointer">
                                    Post to main account
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
                            disabled={status === 'loading'}
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

            <AlertDialog open={showConfirmDialog} onOpenChange={(open) => {
                setShowConfirmDialog(open);
                if (!open) setConfirmText('');
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Main Account Post</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to post to the <strong>main account</strong>. This action cannot be undone. Type <strong>CONFIRM</strong> below to proceed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type CONFIRM to proceed"
                        autoFocus
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleConfirmSubmit}
                            disabled={confirmText.toLowerCase() !== 'confirm'}
                        >
                            Post to Main Account
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
