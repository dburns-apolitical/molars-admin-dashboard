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

  const selectedAccount = accounts.find((a) => String(a.id) === selectedAccountId);
  const previewHashtags = hashtags.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--term-text-faint)] font-mono">
          $ molars new --interactive
        </div>
        <h1 className="font-mono text-2xl md:text-[28px] font-semibold tracking-tight lowercase mt-2">
          compose<span className="cursor" aria-hidden />
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Create a new reel post. Leave fields empty to use randomly generated content.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="section-title">post.config</CardTitle>
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
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/40">
                <AlertCircle className="size-4 shrink-0" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center border-t border-dashed pt-6 gap-4 flex-wrap">
            <div className="flex items-center gap-2">
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
            </div>
            <span className="text-[11px] text-[var(--term-text-faint)] font-mono">
              <span className="kbd">⌘</span> <span className="kbd">↵</span> to ship
            </span>
          </CardFooter>
        </form>
        </Card>

        {/* Right column — preview + AI suggest */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-dashed">
              <CardTitle className="section-title flex items-center justify-between gap-2">
                <span>preview</span>
                <span className="text-[var(--term-text-faint)] normal-case font-normal">9:16</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="phone">
                <div className="phone-bar">
                  <span>00:14</span>
                  <span>● live</span>
                </div>
                <div className="phone-body">
                  <div className="phone-thumb">
                    {videoTitle === 'random' ? 'video preview' : videoTitle}
                  </div>
                  <div className="p-3">
                    <div className="text-primary text-[12px] font-semibold mb-1.5 leading-snug break-words">
                      {hookText || 'your hook appears here'}
                    </div>
                    <div className="text-muted-foreground text-[10px] leading-relaxed break-words line-clamp-3">
                      {caption || 'caption preview…'}
                    </div>
                    {previewHashtags.length > 0 && (
                      <div className="mt-2">
                        {previewHashtags.map((t, i) => (
                          <span key={i} className="tag-pill" style={{ fontSize: 9 }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {selectedAccount && (
                <div className="text-[10px] text-[var(--term-text-faint)] text-center mt-3 font-mono uppercase tracking-[0.12em]">
                  → [{selectedAccount.name}]
                </div>
              )}
            </CardContent>
          </Card>

          {hookSuggestions.length > 0 && (
            <Card>
              <CardHeader className="border-b border-dashed">
                <CardTitle className="section-title flex items-center justify-between gap-2">
                  <span>ai_suggest</span>
                  <span className="text-[var(--term-text-faint)] normal-case font-normal">hooks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4">
                <div className="text-muted-foreground text-[11px] mb-2.5 font-mono">
                  based on recent top performers:
                </div>
                <div className="flex flex-col gap-1.5">
                  {hookSuggestions.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHookText(s)}
                      disabled={isFormDisabled}
                      className="flex items-center justify-between gap-2 text-left text-[12px] font-mono px-3 py-2 border border-border bg-[var(--term-bg-elev)] hover:border-[var(--term-border-hi)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate flex-1">" {s} "</span>
                      <span className="text-primary text-[10px] shrink-0">use →</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
