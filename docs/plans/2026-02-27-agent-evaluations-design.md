# Agent Evaluations Feature Design

## Overview

Display AI agent evaluations of dashboard stats. Homepage shows the latest evaluation truncated to 400 chars with a "read more" link. A new Evaluations page lists all evaluations in accordions with rendered markdown content.

## Data Layer

### Types (`src/types/dashboard.ts`)

New `Evaluation` type:

```typescript
interface Evaluation {
  id: number;
  response: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  triggered_by: string;
  created_at: string;
}
```

Add `latestEvaluation: Evaluation | null` to `DashboardStats`.

### Hooks

- **`useStats`** — no logic changes, just type update for `latestEvaluation`
- **New `useEvaluations`** — `GET /api/evaluations?limit=50`, same auth pattern as `useStats`

## Homepage Changes (`src/pages/home.tsx`)

- New Card section above Views Overview
- Shows `response` truncated to 400 chars (plain text of markdown source)
- "Read more" link → `/evaluations?open=latest`
- Shows formatted `created_at` date
- Skeleton loader while loading; hidden if `latestEvaluation` is null

## Evaluations Page (`src/pages/evaluations.tsx`)

- Route: `/evaluations`
- Radix Accordion list of evaluations
- Trigger: formatted date, model badge, triggered_by badge
- Content: full markdown rendered via `react-markdown`
- `?open=latest` query param opens first accordion on mount
- Loading skeletons, breadcrumb navigation

## Navigation (`src/components/Layout.tsx`)

- Add "Evaluations" link to mobile nav Sheet
- Lucide icon (SparklesIcon or similar)

## New Components

- `src/components/ui/accordion.tsx` — Radix UI Accordion wrapper

## Dependencies

- `@radix-ui/react-accordion`
- `react-markdown`
