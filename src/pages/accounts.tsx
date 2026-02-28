import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

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

interface AccountFormData {
  name: string;
  ig_access_token: string;
  ig_user_id: string;
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
    ig_access_token: '',
    ig_user_id: account?.ig_user_id ?? '',
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
        ig_user_id: formData.ig_user_id,
        gcs_bucket_name: formData.gcs_bucket_name,
      };
      if (formData.ig_access_token) {
        body.ig_access_token = formData.ig_access_token;
      }

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

  const isValid = isEditing
    ? formData.name && formData.ig_user_id && formData.gcs_bucket_name
    : formData.name && formData.ig_access_token && formData.ig_user_id && formData.gcs_bucket_name;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
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
            <Label htmlFor="ig_access_token">IG Access Token</Label>
            <Input
              id="ig_access_token"
              type="password"
              value={formData.ig_access_token}
              onChange={(e) => setFormData((d) => ({ ...d, ig_access_token: e.target.value }))}
              placeholder={isEditing ? '••••••••' : 'Enter access token'}
              required={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ig_user_id">IG User ID</Label>
            <Input
              id="ig_user_id"
              value={formData.ig_user_id}
              onChange={(e) => setFormData((d) => ({ ...d, ig_user_id: e.target.value }))}
              placeholder="Instagram user ID"
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

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage Instagram accounts.</p>
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
          <CardTitle className="text-lg">Accounts ({accounts.length})</CardTitle>
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
                    <TableCell className="hidden sm:table-cell">{account.ig_user_id}</TableCell>
                    <TableCell className="hidden sm:table-cell">{account.gcs_bucket_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(account)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingAccount(account);
                          }}
                        >
                          <Trash2 className="size-4" />
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
    </div>
  );
}
