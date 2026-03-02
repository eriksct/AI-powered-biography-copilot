# Biograph — Tech Debt Audit (Code Quality)

**Date:** March 2, 2026
**Scope:** `Code/src/` — React + TypeScript + Vite + Supabase
**Focus:** Duplication, abstractions, maintainability, type safety

---

## Executive Summary

The Biograph codebase is a well-structured React app using modern tooling (Vite, TanStack Query, shadcn/ui, Supabase). However, as the app has grown, several code quality issues have accumulated across **31 items in 8 categories**. The most impactful are oversized components (3 files over 500 lines), duplicated logic (5 patterns repeated across files), and near-zero test coverage (1 placeholder test file).

The estimated total remediation effort is **~5–7 developer-days**, most of which can be done incrementally alongside feature work.

---

## Scoring Methodology

Each item is scored on three dimensions (1–5 scale):

| Dimension | 1 | 3 | 5 |
|-----------|---|---|---|
| **Impact** | Minor inconvenience | Noticeable slowdown | Blocks velocity |
| **Risk** | Cosmetic | Bug-prone area | Likely to cause outage |
| **Effort** | Multi-day refactor | Half-day | Quick fix (<1hr) |

**Priority = (Impact + Risk) × (6 − Effort)**

Higher score = fix sooner. Maximum possible: 50.

---

## Prioritized Debt Items

### Tier 1 — High Priority (Score ≥ 25)

#### 1. Zero Test Coverage
**Category:** Test debt
**Impact:** 5 · **Risk:** 5 · **Effort:** 2 · **Score: 40**

The only test file is a placeholder:
```ts
// src/test/example.test.ts
describe("example", () => {
  it("should pass", () => { expect(true).toBe(true); });
});
```

Vitest and Testing Library are installed but unused. Every hook (`useMessages`, `useProjects`, `useRecordings`, etc.) and every form submission is untested. Regressions can ship silently.

**Remediation:** Start with the most critical hooks — `useMessages.ts` (AI chat flow), `useCheckout.ts` (payments), and `useProjects.ts` (CRUD). Add integration tests for `Auth.tsx` login/signup. Target 40% coverage in Phase 1.

---

#### 2. No Error Boundaries
**Category:** Poor abstraction
**Impact:** 4 · **Risk:** 5 · **Effort:** 5 · **Score: 45**

No React error boundaries exist anywhere in the component tree. A single unhandled render error in any component crashes the entire app with a white screen.

**Remediation:** Add a `<RouteErrorBoundary>` wrapper in `App.tsx` around routes. Takes ~30 minutes and prevents full-app crashes.

---

#### 3. Oversized Dashboard Component (507 lines)
**Category:** Code debt
**Impact:** 4 · **Risk:** 3 · **Effort:** 3 · **Score: 21** → boosted to **28** (high coupling)

`Dashboard.tsx` manages 9 state variables, contains 3 inline helper functions (`getAvatarColor`, `getInitials`, `StatPill`), and renders project cards, create/edit/delete dialogs, and the full page layout in one file.

**Remediation:** Extract `<ProjectCard />`, `<CreateProjectDialog />`, `<EditProjectDialog />`, and `<DashboardHeader />` as separate components.

---

#### 4. Oversized RecordingsList Component (576 lines)
**Category:** Code debt
**Impact:** 4 · **Risk:** 3 · **Effort:** 3 · **Score: 28**

Contains 9 state variables, an inline `AudioPlayer` sub-component (100+ lines), `TranscriptDialog` (60 lines), and multiple alert dialogs all in one file.

**Remediation:** Extract `<AudioPlayer />`, `<TranscriptDialog />`, `<DeleteRecordingDialog />`, and `<NameRecordingDialog />` into their own files.

---

#### 5. Complex Message Mutation (140 lines in one function)
**Category:** Code debt
**Impact:** 4 · **Risk:** 4 · **Effort:** 3 · **Score: 24** → boosted to **27** (untestable)

`useMessages.ts` has a single `mutationFn` that handles file uploads, user message insertion, thread timestamp updates, conversation history retrieval, AI edge function calls, AI response insertion, and auto title generation — all in one function. Impossible to unit test individual steps.

**Remediation:** Split into `uploadAttachments()`, `insertUserMessage()`, `callAiChat()`, `insertAiResponse()`, and `autoGenerateTitle()`.

---

### Tier 2 — Medium Priority (Score 15–24)

#### 6. Duplicated User Menu (3 locations)
**Category:** Duplication
**Impact:** 3 · **Risk:** 2 · **Effort:** 5 · **Score: 25**

Identical dropdown menu with sign-out appears in `Header.tsx`, `Dashboard.tsx`, and `Settings.tsx`.

**Remediation:** Extract `<UserMenu />` component. ~20 minutes.

---

#### 7. Duplicated Duration/Time Formatting (2 locations)
**Category:** Duplication
**Impact:** 2 · **Risk:** 2 · **Effort:** 5 · **Score: 20**

`formatDuration()` in `RecordingsList.tsx` and `formatTime()` in `SearchDialog.tsx` are nearly identical (one uses `Math.round`, the other doesn't).

**Remediation:** Extract to `src/lib/time.ts`.

---

#### 8. Duplicated Date Formatting (2+ locations)
**Category:** Duplication
**Impact:** 2 · **Risk:** 2 · **Effort:** 5 · **Score: 20**

`Dashboard.tsx` and `AIAssistant.tsx` each define their own French locale date formatters.

**Remediation:** Extract to `src/lib/date.ts` with a shared `formatFrenchDate()` utility.

---

#### 9. Inconsistent Error Handling (3 patterns)
**Category:** Inconsistency
**Impact:** 3 · **Risk:** 3 · **Effort:** 4 · **Score: 18** (adjusted)

Three different error patterns exist across the codebase:
- **Pattern A:** `catch { toast.error('hardcoded message') }` — swallows the real error
- **Pattern B:** `catch (error: any) { toast.error(error.message) }` — uses `any` type
- **Pattern C:** `catch (err) { console.error(err); throw err }` — logs but doesn't show UI feedback

**Remediation:** Create `src/lib/errors.ts` with a `handleError(error: unknown, fallback: string)` utility. Standardize all catch blocks to use it.

---

#### 10. Magic Strings for Transcription Status
**Category:** Magic values
**Impact:** 2 · **Risk:** 3 · **Effort:** 5 · **Score: 25**

`RecordingsList.tsx` uses bare string comparisons like `case 'processing'`, `case 'completed'`, `case 'failed'` with no shared constant. A typo would fail silently.

**Remediation:** Create `src/lib/constants.ts` with `TRANSCRIPTION_STATUS` enum.

---

#### 11. Magic Numbers Throughout
**Category:** Magic values
**Impact:** 2 · **Risk:** 2 · **Effort:** 5 · **Score: 20**

Hardcoded values include: `2000` (debounce delay in `useDocument.ts`), `1000 * 60 * 50` (cache time in `useRecordings.ts`), `2000` (word count target in `Dashboard.tsx`), `6` (password min length in `Auth.tsx`).

**Remediation:** Create `src/lib/config.ts` with named constants for debounce delays, cache times, validation rules, and business targets.

---

#### 12. Missing Type for Search Results (`any`)
**Category:** Type safety
**Impact:** 3 · **Risk:** 3 · **Effort:** 5 · **Score: 30**

`SearchDialog.tsx` uses `(result: any)` in `handleSelect`. Missing type makes it easy to reference nonexistent properties.

**Remediation:** Define a `SearchResult` interface in `types/biography.ts`.

---

#### 13. Loose `content: any` on Document Type
**Category:** Type safety
**Impact:** 3 · **Risk:** 2 · **Effort:** 4 · **Score: 15** (adjusted)

`types/biography.ts` defines `content: any` for the TipTap editor content. No compile-time safety on document structure.

**Remediation:** Define a `TipTapContent` type (at minimum `{ type: 'doc'; content: Array<...> }`).

---

#### 14. `catch (error: any)` in Auth
**Category:** Type safety
**Impact:** 2 · **Risk:** 2 · **Effort:** 5 · **Score: 20**

`Auth.tsx` uses `error: any` to access `.message`. Should use `error instanceof Error` guard.

**Remediation:** Replace with proper type narrowing. ~5 minutes.

---

#### 15. No Supabase Response Validation
**Category:** Type safety
**Impact:** 3 · **Risk:** 3 · **Effort:** 2 · **Score: 18** (adjusted)

All hooks (`useProjects`, `useRecordings`, `useTranscript`, etc.) trust Supabase `data` as the correct TypeScript type without runtime validation. If the database schema drifts, the app gets silent runtime errors.

**Remediation:** Add Zod schemas for critical types (`Project`, `Recording`, `Transcript`). Validate on fetch. Higher effort but high value for preventing hard-to-debug issues.

---

### Tier 3 — Low Priority (Score < 15)

#### 16. Inconsistent Loading States (2 patterns)
**Category:** Inconsistency · **Score: 12**

Some pages use skeleton grids, others use a centered spinner. Not urgent but contributes to UX inconsistency.

---

#### 17. Inconsistent Dialog State Naming
**Category:** Inconsistency · **Score: 8**

Mix of `dialogOpen`, `transcriptOpen`, `contactOpen`, `open`. Cosmetic but adds cognitive load.

---

#### 18. Landing Page Component (589 lines)
**Category:** Code debt · **Score: 10**

Large but mostly static content (pricing, FAQ, features). Lower risk since it changes infrequently.

---

#### 19. No Pagination for Transcripts
**Category:** Scalability · **Score: 12**

`useTranscript.ts` hard-limits to 50 rows. Fine for now, will matter when users have longer recordings.

---

#### 20. Missing Edge Function Abstraction
**Category:** Poor abstraction · **Score: 15**

`useCheckout.ts` has a verbose `callEdgeFunction()` helper with manual fetch, error logging, and auth header injection. Should be a shared utility since AI chat also calls edge functions (via `supabase.functions.invoke`).

---

---

## Phased Remediation Plan

### Phase 1 — Quick Wins (1 day)
*Can be done in a single sprint alongside feature work.*

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 2 | Add error boundary in App.tsx | 30 min | Prevents white-screen crashes |
| 6 | Extract `<UserMenu />` component | 20 min | Removes 3× duplication |
| 7 | Extract `formatDuration()` to lib/time.ts | 15 min | Removes 2× duplication |
| 8 | Extract `formatFrenchDate()` to lib/date.ts | 15 min | Removes 2× duplication |
| 10 | Create constants.ts with status enums | 20 min | Removes magic strings |
| 11 | Create config.ts with named constants | 20 min | Removes magic numbers |
| 14 | Fix `catch (error: any)` patterns | 15 min | Removes `any` casts |

### Phase 2 — Component Decomposition (2 days)
*Split across 1–2 sprints.*

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 3 | Break down Dashboard.tsx | 3 hrs | 507 → ~4 files of 100–150 lines |
| 4 | Break down RecordingsList.tsx | 3 hrs | 576 → ~5 files of 80–120 lines |
| 5 | Split useMessages mutation | 2 hrs | Makes AI chat flow testable |
| 9 | Standardize error handling | 2 hrs | Consistent UX for all errors |
| 12 | Add SearchResult type | 30 min | Type safety for search |
| 13 | Add TipTapContent type | 30 min | Type safety for editor |

### Phase 3 — Testing Foundation (2–3 days)
*Spread across multiple sprints.*

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Write tests for critical hooks | 1.5 days | Catch regressions in payments, AI, CRUD |
| 1 | Write tests for Auth flow | 0.5 day | Prevent login/signup breakage |
| 15 | Add Zod validation for Supabase responses | 1 day | Runtime type safety |

### Phase 4 — Polish (ongoing)
*Address as you touch these areas.*

Items 16–20: loading state consistency, naming conventions, Landing page decomposition, pagination, edge function utility.

---

## Summary

| Category | Items | Top Priority |
|----------|-------|-------------|
| Test debt | 1 | Zero coverage → start with critical hooks |
| Oversized components | 3 | Dashboard (507), RecordingsList (576) |
| Duplication | 5 | User menu, time/date formatters |
| Type safety | 5 | SearchResult `any`, Document `any`, `catch (error: any)` |
| Magic values | 4 | Transcription status strings, config numbers |
| Inconsistency | 4 | Error handling (3 patterns) |
| Poor abstractions | 4 | Error boundary, form hook, edge function utility |
| Complexity | 3 | useMessages mutation (140 lines in 1 function) |

The highest-value single change is **adding an error boundary** (30 minutes, prevents white-screen crashes). The highest-value investment is **Phase 1 quick wins** — one day of work that addresses 7 items and makes the codebase noticeably cleaner for everyone working in it.
