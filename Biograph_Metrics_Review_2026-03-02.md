# Biograph — Weekly Metrics Review

**Period:** Feb 23 – Mar 2, 2026 (with 90-day context)
**Prepared:** March 2, 2026
**Source:** [Amplitude — biography-app / default project](https://app.amplitude.com/analytics/biography-app)

---

## Summary

Biograph is in a **pre-launch / instrumentation phase**. Amplitude was set up around February 18 with 3 test users who completed the full product loop (signup → project → recording → export). Since then, activity has dropped to near-zero — 1 returning user the week of Feb 23, and no activity in the current week. The event taxonomy is well-structured and covers the full user journey, which is a strong foundation. The priority now is driving real user traffic and establishing baseline metrics.

---

## Metric Scorecard

| Metric | This Week (Feb 24–Mar 2) | Prior Week (Feb 16–23) | Change | Status |
|---|---|---|---|---|
| **Active Users (daily peak)** | 0 | 3 | -100% | ⚠️ No activity |
| **New Users** | 0 | 3 | -100% | ⚠️ No activity |
| **Total Sessions** | 0 | 1 | -100% | ⚠️ No activity |
| **Total Events** | 0 | 25 | -100% | ⚠️ No activity |
| **Signups** | 0 | 2 | — | ⚠️ No activity |
| **Projects Created** | 0 | 2 | — | ⚠️ No activity |
| **Recordings Completed** | 0 | 2 | — | ⚠️ No activity |
| **Documents Exported** | 0 | 2 | — | ⚠️ No activity |
| **AI Chats Sent** | 0 | 1 | — | ⚠️ No activity |

> **Note:** All prior-week activity (Feb 18) appears to be from initial setup / test users, not organic traffic. Treat these as instrumentation validation, not baseline metrics.

---

## What's Working

**1. Event taxonomy is comprehensive and well-designed.** The 18 tracked events cover the entire user journey from acquisition (Signup Completed, Login) through activation (Project Created, Recording Started) to core engagement (Recording Completed, Transcription Completed, AI Chat Sent, Search Used) and value delivery (Document Exported). This is a solid instrumentation foundation.

**2. The full product loop has been validated end-to-end.** On Feb 18, test users successfully completed: Signup → Project Created → Recording Started → Recording Completed → Transcription Completed → Document Exported. This confirms the analytics pipeline is capturing the critical path correctly.

**3. Monetization events are instrumented.** Checkout Started, Subscription Active, and Upgrade Dialog Shown are all tracked — ready to measure conversion when traffic arrives.

**4. Existing dashboards provide structure.** Three product overview dashboards ("Vue d'ensemble Produit") are already built in Amplitude, giving a head start on monitoring once data flows in.

---

## Areas of Concern

**1. Zero organic users.** No real users have been acquired yet. All activity traces back to what appears to be a setup/testing session on Feb 18. This is expected for pre-launch, but it means there are no baseline metrics to analyze.

**2. No retention signal.** Only 1 user returned (week of Feb 23, with 4 events), and that user did not return again. With so few data points, it's impossible to assess whether the product retains users.

**3. Session tracking may need review.** Despite 3 active users and 25 events on the week of Feb 16, only 1 session was recorded. This could indicate a session definition issue in Amplitude configuration, or it could mean all activity happened in a single session. Worth verifying.

---

## Recommended Actions

### Immediate (This Week)

**1. Validate session tracking configuration.** Check why 3 users and 25 events produced only 1 session. Review the session definition in Amplitude project settings (timeout duration, cross-domain tracking). Misconfigured sessions will distort engagement metrics once real users arrive.

**2. Set up key metric alerts.** Before launch, configure Amplitude alerts for: first organic signup, daily active users crossing thresholds (10, 50, 100), and any funnel drop-off anomalies. You want to know immediately when things start moving.

**3. Define your North Star metric.** Based on the event taxonomy, strong candidates are:
- **Documents Exported per week** (value delivery — users got a finished biography)
- **Recording hours completed per week** (core engagement — users are creating content)

Pick one and build your metrics hierarchy around it.

### Pre-Launch

**4. Build a Signup → Export activation funnel.** The events are already tracked. Create a funnel chart: Signup Completed → Project Created → Recording Started → Recording Completed → Document Exported. This will be your most important diagnostic tool for understanding where users drop off.

**5. Instrument referral / acquisition source.** There's no UTM or referral source tracking visible in the current event properties. Before driving traffic, make sure you can attribute signups to channels (organic, paid, referral, etc.).

**6. Add a "time to value" metric.** Measure the elapsed time from Signup Completed to first Document Exported. This is critical for understanding whether users reach the "aha moment" fast enough.

### Post-Launch

**7. Establish weekly review cadence.** Once you have ≥50 weekly active users, start a weekly metrics review covering: new users, activation rate (signup → first export), weekly engagement (sessions, recordings, AI chats), and retention (week-1, week-4 return rates).

---

## Metrics We Should Be Tracking But Aren't Yet

| Gap | Why It Matters | Suggested Approach |
|---|---|---|
| Acquisition source / UTM | Can't attribute growth to channels | Add UTM params to user properties |
| Time-to-first-export | Measures activation speed | Compute from Signup → Export timestamps |
| Recording duration | Distinguishes quick tests from real usage | Add as event property on Recording Completed |
| Error / failure events | Detect broken flows before users churn | Instrument Recording Failed, Export Failed, etc. |
| User properties (plan, role) | Enables segment analysis (free vs paid, etc.) | Enrich user profiles with plan tier |

---

## Data Quality Notes

- All activity to date appears to be from internal testing (3 users, single day burst on Feb 18)
- No organic or paid user traffic has been observed in the 90-day lookback
- Session count (1) seems low relative to user count (3) — may indicate configuration issue
- Current week (Mar 2) is incomplete (today is Monday), so the 0 reading is expected

---

*Next review recommended: after first week with ≥10 active users, or 1 week post-launch — whichever comes first.*
