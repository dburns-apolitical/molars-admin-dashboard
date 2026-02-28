# Multi-Account Frontend Design

**Date:** 2026-02-28
**Status:** Approved
**Backend Design:** [2026-02-27-multi-account-configuration-design.md](./2026-02-27-multi-account-configuration-design.md) (assumed)

## Overview

Update the frontend to support dynamic, DB-managed accounts. Replace all hardcoded account references with data from `GET /api/accounts`. Add account CRUD page, per-account content assignment, account-scoped post creation, and URL-based account filtering.

## Approach

Global Account Context (React context + URL params):
- `AccountsProvider` fetches accounts once on app load, provides them app-wide
- `useAccountFilter()` hook reads/writes `?accountId=N` URL param for filtering
- Shared `<AccountFilter />` dropdown component used on Dashboard and Content pages

## Data Layer

### AccountsProvider Context

- Wraps app in `App.tsx` inside auth provider
- Fetches `GET /api/accounts` on mount
- Provides: `accounts[]`, `isLoading`, `error`, `refetch()`
- Single source of truth — no duplicate fetches across pages

### Account Type

```typescript
type Account = {
  id: number
  name: string
  ig_access_token: string  // masked from API
  ig_user_id: string
  gcs_bucket_name: string
}
```

### useAccountFilter Hook

- Reads/writes `?accountId=N` from URL via `useSearchParams`
- Returns `{ accountId: number | null, setAccountId }`
- Used on Dashboard, Content pages

### Updated ContentItem Type

```typescript
type ContentItem = {
  id: number
  text: string
  enabled: boolean
  created_at: string
  accounts: { id: number; name: string }[]
}
```

### API Response Shape (Confirmed)

Captions and hooks responses include `accounts` array on each item:
```json
{
  "success": true,
  "captions": [
    {
      "id": 1,
      "text": "...",
      "enabled": true,
      "created_at": "2026-02-27T12:00:00.000Z",
      "accounts": [
        { "id": 1, "name": "Molars UK (MAIN ACCOUNT)" },
        { "id": 2, "name": "MLRSUK (BACKUP ACCOUNT)" }
      ]
    }
  ]
}
```

`accounts` is always an array (empty `[]` if unassigned). When filtering with `?accountId=N`, only assigned items are returned, but `accounts` still shows all assignments.

## Accounts Management Page

**Route:** `/accounts`

### Account List
- Table: Name, IG User ID, GCS Bucket, Actions (edit/delete)
- IG access token shown masked (`••••••xxxx`)
- "Add Account" button at top

### Add/Edit Account Form
- Fields: Name, IG Access Token, IG User ID, GCS Bucket Name
- On edit, token field shows "Leave blank to keep current" (API masks tokens)
- Validation: all fields required on create, token optional on edit

### Delete Account
- Confirmation dialog
- API returns error if account has posts — display error to user

### API Calls
- `POST /api/accounts` — create
- `PATCH /api/accounts/:id` — update
- `DELETE /api/accounts/:id` — delete
- On mutation, call `refetch()` from accounts context

## Content Page Changes

### Account Filter
- `<AccountFilter />` dropdown in page header
- No filter → show all content
- Account selected → `GET /api/captions?accountId=N`, `GET /api/hooks?accountId=N`

### Add Content Form
- Account multi-select checkboxes below text input (accounts from context)
- Create with `{ text, accountIds: [1, 2] }`
- No accounts selected → content created unassigned

### Items Table
- New "Accounts" column showing assigned accounts as badges/chips
- Enable/disable toggle unchanged

## Post Page Changes

### Account Selector
- Replace "post to main account" checkbox with required account dropdown at top of form
- No default — user must select an account before filling the rest
- Form disabled until account selected

### Account-Scoped Content Loading
- On account selection, fetch filtered content:
  - `GET /api/videos?accountId=N`
  - `GET /api/captions?accountId=N`
  - `GET /api/hooks?accountId=N`
- Re-fetch when account changes

### Removals
- Remove confirmation dialog for "main account" posts (all accounts are equal)
- Remove old `accountId: 1 vs 2` checkbox logic

### Post Submission
- `POST /api/post-reel` with `accountId` from selector (required)
- "Share to feed" toggle unchanged

## Dashboard Changes

- Replace hardcoded account dropdown with `<AccountFilter />` using accounts from context
- "All Accounts" option stays as default
- `useStats(accountId)` already accepts optional `accountId` — wire to URL param
- No other dashboard changes

## Navigation Update

- Add "Accounts" to mobile nav in `Layout.tsx`
- Position: after Content, before Evaluations
- Icon: `Users` from lucide-react
- Route: `/accounts`

## Files to Create/Modify

### New Files
- `src/contexts/AccountsContext.tsx` — provider + hook
- `src/hooks/useAccountFilter.ts` — URL param hook
- `src/components/AccountFilter.tsx` — shared dropdown
- `src/pages/Accounts.tsx` — accounts CRUD page

### Modified Files
- `src/App.tsx` — wrap with AccountsProvider, add /accounts route
- `src/pages/Layout.tsx` — add Accounts nav item
- `src/pages/Home.tsx` — replace hardcoded dropdown with AccountFilter
- `src/pages/Content.tsx` — add account filter, account checkboxes on forms, accounts column
- `src/pages/Post.tsx` — account selector, scoped content loading, remove old logic
- `src/hooks/useContent.ts` — accept accountId param, update types
- `src/types/dashboard.ts` — update ContentItem type
