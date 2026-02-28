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
