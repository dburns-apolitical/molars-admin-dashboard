import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Account, Credential, Platform } from '@/types/dashboard';

async function getAuthHeaders() {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.data.session.token}`,
    'Content-Type': 'application/json',
  };
}

interface AccountFormData {
  name: string;
  gcs_bucket_name: string;
}

function AccountForm({
  account,
  onSave,
  onCancel,
}: {
  account?: Account;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!account;
  const [formData, setFormData] = useState<AccountFormData>({
    name: account?.name ?? '',
    gcs_bucket_name: account?.gcs_bucket_name ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const body: Record<string, string> = {
        name: formData.name,
        gcs_bucket_name: formData.gcs_bucket_name,
      };

      const url = isEditing
        ? `${API_BASE_URL}/api/accounts/${account.id}`
        : `${API_BASE_URL}/api/accounts`;
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to save account');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = formData.name && formData.gcs_bucket_name;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="section-title">
          {isEditing ? 'Edit Account' : 'Add Account'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              placeholder="Account name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gcs_bucket_name">GCS Bucket Name</Label>
            <Input
              id="gcs_bucket_name"
              value={formData.gcs_bucket_name}
              onChange={(e) => setFormData((d) => ({ ...d, gcs_bucket_name: e.target.value }))}
              placeholder="my-bucket-name"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving || !isValid}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
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
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [expandedAccountId, setExpandedAccountId] = useState<number | null>(null);
  const [addingCredentialForAccountId, setAddingCredentialForAccountId] = useState<number | null>(null);
  const [editingCredentialId, setEditingCredentialId] = useState<number | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null);
  const [credentialFormData, setCredentialFormData] = useState<{
    platform: Platform | '';
    ig_access_token: string;
    ig_user_id: string;
    api_key: string;
    user: string;
    instagram: boolean;
    youtube: boolean;
    tiktok: boolean;
    twitter: boolean;
  }>({ platform: '', ig_access_token: '', ig_user_id: '', api_key: '', user: '', instagram: false, youtube: false, tiktok: false, twitter: false });
  const [isSavingCredential, setIsSavingCredential] = useState(false);
  const [credentialError, setCredentialError] = useState<string | null>(null);

  const handleSave = () => {
    setShowForm(false);
    setEditingAccount(null);
    refetch();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleEdit = (account: Account) => {
    setShowForm(false);
    setEditingAccount(account);
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/accounts/${deletingAccount.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to delete account');
      }

      setDeletingAccount(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetCredentialForm = () => {
    setAddingCredentialForAccountId(null);
    setEditingCredentialId(null);
    setCredentialFormData({ platform: '', ig_access_token: '', ig_user_id: '', api_key: '', user: '', instagram: false, youtube: false, tiktok: false, twitter: false });
    setCredentialError(null);
  };

  const platformLabel = (platform: Platform) => {
    switch (platform) {
      case 'instagram_direct': return 'Instagram Direct';
      case 'upload_post': return 'Upload Post';
      default: return platform;
    }
  };

  const isCredentialFormValid = () => {
    if (!credentialFormData.platform) return false;
    if (credentialFormData.platform === 'instagram_direct') {
      return credentialFormData.ig_access_token && credentialFormData.ig_user_id;
    }
    if (credentialFormData.platform === 'upload_post') {
      return credentialFormData.api_key && credentialFormData.user;
    }
    return false;
  };

  const handleSaveCredential = async (accountId: number, credentialId?: number) => {
    setIsSavingCredential(true);
    setCredentialError(null);

    try {
      const headers = await getAuthHeaders();
      let credentials: Record<string, string>;

      if (credentialFormData.platform === 'instagram_direct') {
        credentials = {
          ig_access_token: credentialFormData.ig_access_token,
          ig_user_id: credentialFormData.ig_user_id,
        };
      } else {
        credentials = {
          api_key: credentialFormData.api_key,
          user: credentialFormData.user,
          instagram: String(credentialFormData.instagram),
          youtube: String(credentialFormData.youtube),
          tiktok: String(credentialFormData.tiktok),
          twitter: String(credentialFormData.twitter),
        };
      }

      if (credentialId) {
        const res = await fetch(`${API_BASE_URL}/api/credentials/${credentialId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ credentials }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? 'Failed to update credential');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/accounts/${accountId}/credentials`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ platform: credentialFormData.platform, credentials }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? 'Failed to add credential');
        }
      }

      resetCredentialForm();
      refetch();
    } catch (err) {
      setCredentialError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSavingCredential(false);
    }
  };

  const handleDeleteCredential = async () => {
    if (!deletingCredential) return;
    setIsDeleting(true);
    setCredentialError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/credentials/${deletingCredential.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to delete credential');
      }

      setDeletingCredential(null);
      refetch();
    } catch (err) {
      setCredentialError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
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

      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--term-text-faint)] font-mono">
            $ molars accounts --status
          </div>
          <h1 className="font-mono text-2xl md:text-[28px] font-semibold tracking-tight lowercase mt-2">
            accounts<span className="cursor" aria-hidden />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage accounts and credentials.</p>
        </div>
        {!showForm && !editingAccount && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 size-4" />
            Add Account
          </Button>
        )}
      </div>

      {showForm && <AccountForm onSave={handleSave} onCancel={handleCancel} />}

      {editingAccount && (
        <AccountForm
          account={editingAccount}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="section-title">accounts <span className="text-[var(--term-text-faint)] normal-case">[{accounts.length}]</span></CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No accounts yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">GCS Bucket</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <React.Fragment key={account.id}>
                    <TableRow>
                      <TableCell className="w-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() =>
                            setExpandedAccountId(
                              expandedAccountId === account.id ? null : account.id
                            )
                          }
                        >
                          {expandedAccountId === account.id ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{account.gcs_bucket_name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteError(null); setDeletingAccount(account); }}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedAccountId === account.id && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30 px-6 py-4">
                          <div className="space-y-3">
                            <p className="section-title">Credentials</p>

                            {(!account.credentials || account.credentials.length === 0) &&
                              addingCredentialForAccountId !== account.id && (
                                <p className="text-sm text-muted-foreground">No credentials configured.</p>
                              )}

                            {account.credentials && account.credentials.map((credential) => (
                              <div key={credential.id}>
                                {editingCredentialId === credential.id ? (
                                  <div className="space-y-3 border bg-background p-3">
                                    {credentialFormData.platform === 'instagram_direct' && (
                                      <>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Access Token</Label>
                                          <Input
                                            type="password"
                                            value={credentialFormData.ig_access_token}
                                            onChange={(e) =>
                                              setCredentialFormData((d) => ({
                                                ...d,
                                                ig_access_token: e.target.value,
                                              }))
                                            }
                                            placeholder="ig_access_token"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">User ID</Label>
                                          <Input
                                            type="text"
                                            value={credentialFormData.ig_user_id}
                                            onChange={(e) =>
                                              setCredentialFormData((d) => ({
                                                ...d,
                                                ig_user_id: e.target.value,
                                              }))
                                            }
                                            placeholder="ig_user_id"
                                          />
                                        </div>
                                      </>
                                    )}
                                    {credentialFormData.platform === 'upload_post' && (
                                      <>
                                        <div className="space-y-1">
                                          <Label className="text-xs">API Key</Label>
                                          <Input
                                            type="password"
                                            value={credentialFormData.api_key}
                                            onChange={(e) =>
                                              setCredentialFormData((d) => ({
                                                ...d,
                                                api_key: e.target.value,
                                              }))
                                            }
                                            placeholder="api_key"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">User</Label>
                                          <Input
                                            type="text"
                                            value={credentialFormData.user}
                                            onChange={(e) =>
                                              setCredentialFormData((d) => ({
                                                ...d,
                                                user: e.target.value,
                                              }))
                                            }
                                            placeholder="user"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Platforms</Label>
                                          <div className="flex flex-wrap gap-4">
                                            {(['instagram', 'youtube', 'tiktok', 'twitter'] as const).map((p) => (
                                              <label key={p} className="flex items-center gap-1.5 text-xs capitalize">
                                                <Checkbox
                                                  checked={credentialFormData[p]}
                                                  onCheckedChange={(checked) =>
                                                    setCredentialFormData((d) => ({ ...d, [p]: !!checked }))
                                                  }
                                                />
                                                {p}
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    {credentialError && (
                                      <p className="text-sm text-destructive">{credentialError}</p>
                                    )}
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        disabled={isSavingCredential || !isCredentialFormValid()}
                                        onClick={() => handleSaveCredential(account.id, credential.id)}
                                      >
                                        {isSavingCredential && (
                                          <Loader2 className="mr-2 size-3 animate-spin" />
                                        )}
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={resetCredentialForm}
                                        disabled={isSavingCredential}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between border bg-background px-3 py-2">
                                    <div className="flex items-center gap-3">
                                      <Badge
                                        variant={
                                          credential.platform === 'instagram_direct'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                      >
                                        {platformLabel(credential.platform)}
                                      </Badge>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {credential.platform === 'instagram_direct'
                                          ? `user_id: ${credential.credentials.ig_user_id ?? '—'}`
                                          : `user: ${credential.credentials.user ?? '—'}`}
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => {
                                          setEditingCredentialId(credential.id);
                                          setAddingCredentialForAccountId(null);
                                          setCredentialError(null);
                                          setCredentialFormData({
                                            platform: credential.platform,
                                            ig_access_token: '',
                                            ig_user_id:
                                              credential.credentials.ig_user_id ?? '',
                                            api_key: '',
                                            user: credential.credentials.user ?? '',
                                            instagram: credential.credentials.instagram === 'true',
                                            youtube: credential.credentials.youtube === 'true',
                                            tiktok: credential.credentials.tiktok === 'true',
                                            twitter: credential.credentials.twitter === 'true',
                                          });
                                        }}
                                      >
                                        <Pencil className="size-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => {
                                          setCredentialError(null);
                                          setDeletingCredential(credential);
                                        }}
                                      >
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {addingCredentialForAccountId === account.id ? (
                              <div className="space-y-3 border bg-background p-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Platform</Label>
                                  <select
                                    className="flex h-9 w-full border border-input bg-[var(--term-bg-elev)] px-3 py-1 font-mono text-[13px] transition-colors focus-visible:outline-none focus-visible:border-primary"
                                    value={credentialFormData.platform}
                                    onChange={(e) =>
                                      setCredentialFormData({
                                        platform: e.target.value as Platform | '',
                                        ig_access_token: '',
                                        ig_user_id: '',
                                        api_key: '',
                                        user: '',
                                        instagram: false,
                                        youtube: false,
                                        tiktok: false,
                                        twitter: false,
                                      })
                                    }
                                  >
                                    <option value="">Select platform...</option>
                                    <option value="instagram_direct">Instagram Direct</option>
                                    <option value="upload_post">Upload Post</option>
                                  </select>
                                </div>

                                {credentialFormData.platform === 'instagram_direct' && (
                                  <>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Access Token</Label>
                                      <Input
                                        type="password"
                                        value={credentialFormData.ig_access_token}
                                        onChange={(e) =>
                                          setCredentialFormData((d) => ({
                                            ...d,
                                            ig_access_token: e.target.value,
                                          }))
                                        }
                                        placeholder="ig_access_token"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">User ID</Label>
                                      <Input
                                        type="text"
                                        value={credentialFormData.ig_user_id}
                                        onChange={(e) =>
                                          setCredentialFormData((d) => ({
                                            ...d,
                                            ig_user_id: e.target.value,
                                          }))
                                        }
                                        placeholder="ig_user_id"
                                      />
                                    </div>
                                  </>
                                )}

                                {credentialFormData.platform === 'upload_post' && (
                                  <>
                                    <div className="space-y-1">
                                      <Label className="text-xs">API Key</Label>
                                      <Input
                                        type="password"
                                        value={credentialFormData.api_key}
                                        onChange={(e) =>
                                          setCredentialFormData((d) => ({
                                            ...d,
                                            api_key: e.target.value,
                                          }))
                                        }
                                        placeholder="api_key"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">User</Label>
                                      <Input
                                        type="text"
                                        value={credentialFormData.user}
                                        onChange={(e) =>
                                          setCredentialFormData((d) => ({
                                            ...d,
                                            user: e.target.value,
                                          }))
                                        }
                                        placeholder="user"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Platforms</Label>
                                      <div className="flex flex-wrap gap-4">
                                        {(['instagram', 'youtube', 'tiktok', 'twitter'] as const).map((p) => (
                                          <label key={p} className="flex items-center gap-1.5 text-xs capitalize">
                                            <Checkbox
                                              checked={credentialFormData[p]}
                                              onCheckedChange={(checked) =>
                                                setCredentialFormData((d) => ({ ...d, [p]: !!checked }))
                                              }
                                            />
                                            {p}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {credentialError && (
                                  <p className="text-sm text-destructive">{credentialError}</p>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    disabled={isSavingCredential || !isCredentialFormValid()}
                                    onClick={() => handleSaveCredential(account.id)}
                                  >
                                    {isSavingCredential && (
                                      <Loader2 className="mr-2 size-3 animate-spin" />
                                    )}
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={resetCredentialForm}
                                    disabled={isSavingCredential}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              editingCredentialId === null && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    resetCredentialForm();
                                    setAddingCredentialForAccountId(account.id);
                                  }}
                                >
                                  <Plus className="mr-1 size-3" />
                                  Add Credential
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAccount(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingAccount?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingCredential}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCredential(null);
            setCredentialError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credential</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this <strong>{deletingCredential ? platformLabel(deletingCredential.platform) : ''}</strong> credential? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {credentialError && (
            <p className="text-sm text-destructive">{credentialError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCredential();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
