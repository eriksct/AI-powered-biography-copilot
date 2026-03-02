# Biograph — Reprioritized Roadmap

**Date:** March 2, 2026
**Trigger:** Pre-launch state reassessment — zero organic users, codebase built, instrumentation validated
**Format:** Now / Next / Later

---

## Context: What Changed

The original PRD (Feb 14, 2026) laid out a 4-phase plan across 12+ months. Two weeks later, here's what we know:

- **The codebase is built.** Landing page, auth, dashboard, project management, recording, AI assistant, text editor, search, and upgrade dialog are all implemented.
- **Amplitude is instrumented.** 18 events cover the full journey from signup to export. Three dashboards exist.
- **Zero organic users.** All activity (3 users, Feb 18) was internal testing. No real traffic has arrived.
- **Pricing strategy is defined** but not yet validated with real users (€69/mo Professional, Forever Free tier).
- **Session tracking may be misconfigured** (3 users, 25 events, but only 1 session recorded).

The original roadmap assumed a linear build-then-launch sequence. The reality is that the core product is largely built, but no one is using it. **The #1 risk is not a missing feature — it's a missing audience.**

---

## Reprioritization Summary

| Change | Original Phase | New Phase | Rationale |
|---|---|---|---|
| Launch prep & go-to-market | Not explicitly planned | **NOW (top priority)** | Product is built but has zero users |
| Export (DOCX/PDF) | Phase 3 (months 7-12) | **NOW (pull forward)** | Core value delivery — users need output |
| Session tracking fix | Not planned | **NOW (urgent)** | Misconfigured sessions will distort all engagement data |
| Acquisition source tracking | Not planned | **NOW (urgent)** | Can't attribute growth without UTM/referral tracking |
| AI interview questions | Phase 2 (months 4-6) | **NEXT** | Nice-to-have, not needed for first 50 users |
| Theme extraction | Phase 2 (months 4-6) | **NEXT** | Requires multi-session usage patterns to be valuable |
| Mobile app | Phase 3 (months 7-12) | **LATER (no change)** | Expensive, validate web first |
| Family collaboration | Phase 3 (months 7-12) | **LATER (no change)** | Solo writer workflow must work first |
| Multi-subject bios | Phase 4 (year 2+) | **LATER (no change)** | Scale feature, not launch feature |

---

## NOW — Launch & First 50 Users (March–April 2026)

**Goal:** Get 50 real users through the full product loop and establish baseline metrics.

### 1. Fix instrumentation gaps ⚠️ BLOCKED

**Status:** Not Started
**Owner:** Engineering
**Effort:** 2-3 days
**Dependencies:** None

What needs to happen:

- Validate session tracking configuration in Amplitude (3 users + 25 events = 1 session looks wrong)
- Add UTM / acquisition source tracking to user properties
- Add recording duration as an event property on Recording Completed
- Instrument error events (Recording Failed, Export Failed, Transcription Failed)
- Add user properties for plan tier (free/paid)
- Set up Amplitude alerts for first organic signup, 10/50/100 DAU thresholds

**Why now:** Every day of real traffic without proper instrumentation is data you can't get back.

---

### 2. Pull forward: Export to DOCX/PDF ⚠️ HIGH PRIORITY

**Status:** Not Started
**Owner:** Engineering
**Effort:** 1-2 weeks
**Dependencies:** None

The original roadmap placed export in Phase 3 (months 7-12). This is a mistake for one reason: **export is how users get value.** A biography that lives only inside the platform is not a biography. Users need to hand a finished document to their subject or their subject's family.

Without export, the product loop is incomplete: Record → Transcribe → Write → ???

Minimum viable export:

- DOCX export with basic formatting (headings, paragraphs, bold/italic)
- PDF export (can be generated from DOCX)
- Clean title page with project name, subject name, date

This is the difference between "a writing tool" and "a tool that produces biographies."

---

### 3. Launch prep & go-to-market 🎯 TOP PRIORITY

**Status:** Not Started
**Owner:** Product + Marketing
**Effort:** 2-3 weeks
**Dependencies:** Export feature, instrumentation fixes

What needs to happen:

- **Landing page polish:** ROI calculator, pricing tiers (Forever Free + €59 early-bird), comparison with alternatives, clear CTA
- **Onboarding flow:** First-run experience that gets a new user from signup to "record a test interview" in under 5 minutes
- **Activation funnel in Amplitude:** Signup → Project Created → Recording Started → Recording Completed → Document Exported
- **Define North Star metric:** Recommend "Documents Exported per week" — it's the clearest signal of value delivery
- **Early adopter recruitment:** Identify 20-30 professional biographers through LinkedIn, biographer associations, genealogy communities
- **Content:** 2-3 pieces showing the problem (how long biographies take today) and the solution

**Success criteria:** 50 signups within 4 weeks of launch, 10+ complete the full product loop.

---

### 4. MVP polish based on internal testing

**Status:** In Progress (partially built)
**Owner:** Engineering
**Effort:** 1-2 weeks
**Dependencies:** None

Items from the original MVP scope that need verification:

- Audio recording reliability (auto-save on browser crash)
- Transcription accuracy on elderly voices (test with real samples)
- Search across transcripts returning results in <1 second
- Timeline drag-and-drop working smoothly
- AI rephrasing preserving subject's voice (not generic)
- Undo/revision history functional

**Approach:** Run 5 internal end-to-end tests simulating a real biography project. Document bugs and fix before launch.

---

## NEXT — Activation & Retention (May–July 2026)

**Goal:** Improve activation rate to 60%+ and establish week-4 retention baseline.

These items unlock only after we have real user data telling us where people struggle.

### 5. Signup-to-Export funnel optimization

**Status:** Pending data
**Owner:** Product
**Effort:** Ongoing
**Dependencies:** 50+ active users

Analyze where users drop off in the funnel. Common hypotheses to test:

- Do users fail at recording? (microphone permissions, audio quality)
- Do users abandon after transcription? (accuracy issues, unclear next step)
- Do users start writing but never export? (editor friction, don't know how to use AI tools)

This is the single most important workstream once traffic arrives.

---

### 6. AI-generated interview questions

**Status:** Not Started (originally Phase 2)
**Owner:** Engineering
**Effort:** 2-3 weeks
**Dependencies:** User feedback confirming demand

Still valuable, but not launch-critical. Most biographers already know what questions to ask. This becomes important when we see users doing 3+ sessions per project and need help going deeper.

---

### 7. Theme & keyword extraction

**Status:** Not Started (originally Phase 2)
**Owner:** Engineering
**Effort:** 3-4 weeks
**Dependencies:** Users with multi-session projects

Requires users to have enough content for themes to be meaningful. Revisit when 20+ projects have 3+ recording sessions each.

---

### 8. Entity tracking (people & places)

**Status:** Not Started (originally Phase 2)
**Owner:** Engineering
**Effort:** 2-3 weeks
**Dependencies:** Theme extraction

Useful for longer projects. Can be built alongside or after theme extraction.

---

### 9. Pricing validation

**Status:** Strategy defined, not validated
**Owner:** Product
**Effort:** Ongoing
**Dependencies:** 50+ signups

Track: free-to-paid conversion rate, time to conversion, churn rate, feedback on pricing. If conversion <15%, the Forever Free tier may be too generous. If churn >7%, investigate.

---

## LATER — Deepen & Expand (August 2026+)

These items are unchanged from the original roadmap. They should not be touched until the core loop is proven with paying users.

### 10. Subject review workflow
Let subjects review specific sections. Requires trust in the core writing experience first.

### 11. Family contributor accounts
Add stories, photos, context from family members. Requires collaboration infrastructure.

### 12. Mobile app (iOS/Android)
Offline recording, simplified interface. Expensive to build. Only justified when web validates the core concept.

### 13. Style consistency AI
Learns writer's voice over time. Needs 10,000+ words of training data per user — a later-stage feature.

### 14. Photo integration
Add photos to timeline. Nice-to-have, significant storage implications.

### 15. Multi-subject biographies
Couples, families, multiple generations. Different workflow entirely. Year 2+ at earliest.

### 16. Multilingual support
Spanish, Mandarin based on market research. Only after English market is validated.

---

## Risks & Dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| Transcription accuracy on elderly voices | Users lose trust → churn | Test with 5+ real elderly voice samples before launch; have fallback to multiple providers |
| No organic acquisition channel | Zero growth after launch | Recruit 20-30 early adopters manually; don't rely on organic discovery |
| AI suggestions feel generic | Low AI feature engagement (<70% target) | Collect early user feedback; tune prompts for biography-specific voice preservation |
| Export quality too basic | Users export but aren't satisfied with output | Start with clean DOCX; iterate based on feedback |
| Pricing too high for semi-pros | Low conversion from free tier | Monitor conversion; keep €59 early-bird as long as needed |

---

## Capacity Note

This reprioritized roadmap front-loads launch and go-to-market work. If the team is primarily engineering, the launch prep (item 3) will need product/marketing effort that may not exist yet. If it's a solo founder or very small team, consider:

- Cutting the NEXT phase to just funnel optimization (item 5) and pricing validation (item 9)
- Deferring all AI intelligence features (items 6-8) until after 100 paying users
- Spending 50%+ of time on acquisition in the first 8 weeks post-launch

The biggest risk to this roadmap is building more features instead of finding users.

---

*Next update: After first week with ≥10 active users, or 4 weeks post-launch — whichever comes first.*
