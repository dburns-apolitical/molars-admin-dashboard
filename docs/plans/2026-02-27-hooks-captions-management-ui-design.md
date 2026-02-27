# Hooks & Captions Management UI — Design Document

**Date:** 2026-02-27
**Status:** Approved

## Overview

Single management page at `/content` with tabs for Hooks and Captions. Allows adding new items and toggling enabled/disabled state.

## Route & Navigation

- Route: `/content` in `App.tsx`
- Nav menu entry: "Content" in `Layout.tsx` MobileNav
- "Back to Dashboard" ghost button at top-left (same pattern as post-status page)

## Page Structure (`/src/pages/content.tsx`)

- Tabs component (existing `ui/tabs.tsx`) with two tabs: "Hooks" and "Captions"
- Each tab contains:
  1. **Add form** — inline text input + "Add" button
  2. **Items table** — all items via `?all=true`, columns: Text, Status badge, Toggle switch

## Data Flow

- New hook: `useContent.ts` fetches via `GET /api/hooks?all=true` and `GET /api/captions?all=true`
- Create: `POST /api/hooks` or `POST /api/captions` with `{ text }`
- Toggle: `PATCH /api/hooks/:id` or `PATCH /api/captions/:id` with `{ enabled }`
- Optimistic UI on toggle with rollback on error
- Inline error for duplicate text (409)

## Styling

- Tailwind + shadcn patterns (Card, Badge, Button, Table, Tabs)
- Ghost button for back nav
- Badge for enabled/disabled status
