# UI-04 — CP0 Plan (Dashboard KPI Cards and Campaign Table)

## CP0 decisions (Mohamed, 21 Oct): these override anything below

- **Q1 (a).** Create `feature/UI-04-dashboard-kpis-campaign-table` from `pr-22`, merge `upstream/main`
  into it, and push it to the fork (permission granted for that branch). The session branch is left
  untouched.
- **Q2 (a).** Do not touch #22's UI-02 doc. Before writing the CP1 report, re-fetch `pull/22`. If it
  still has the 16-section UI-02 doc, **stop and tell Mohamed**. If he then says "convert it", make a
  separate commit `docs(ui-02): convert to 17-section template (pending #22)` that keeps his wording
  and changes only the headings and section structure. Either way, the PR description says #22 must
  merge first.
- **Q3 (a).** The default preset is **"Last 90 days of data"**. Thresholds are unchanged.
- **Q4.** After `approved`, try once to get push access to the team repo. If refused, give the compare
  link, title and body, and do not retry.
- **Q5.** Run `git config user.name "Mohamed Hassan"` and
  `git config user.email "mohamedhassan090805@gmail.com"` in the **local** repo config only. Keep the
  Co-Authored-By trailer.
- **Addition 1.** When the previous period has no data, show no per-card text. Instead, show one muted
  line under the KPI row: "No earlier data to compare with for this range."
- **Addition 2.** The campaigns table's default sort is Performance (Weak, Average, Strong, No data),
  then Spend descending. Needs-attention links go to `/campaigns` carrying the same filter params.
- **Addition 3.** Add one extra screenshot: dashboard and campaigns on "Last 30 days of data", showing
  the deltas and Flash Sale Banner flagged Weak.
- **Addition 4.** B3's INT-01 part is **Confirmed (planning chat)** from the INT-01 text PDF: the §2 table
  has "Campaign list — `GET /api/campaigns?organization_id=&date_from=&date_to=` — Org-scoped
  campaign list joined with daily_metrics-derived ratios, computed at read time". No image rendering
  is needed.
- **Addition 5.** The CP1 report includes the documentation-governance script result, run locally on
  the UI-04 branch against `4f71cf8`.
- Everything else is approved as written. Build, verify, then **stop at CP1** (no commit or push before
  `approved`).

Prepared 21 Oct 2026 in the Claude Code cloud session. **No code has been written.** Nothing has been
committed, no branch or remote has been created, and nothing was posted anywhere.

## Context

UI-04 replaces the dashboard's hardcoded KPI cards and the mock campaign table with live data from
API-02. API-02 merged today (`4f71cf8`). However, API-02 has no KPI/summary endpoint and the campaign
list carries no totals. UI-04 therefore has to aggregate per-campaign daily metrics in the browser,
from real API responses only. It builds on Abdulrahman's open PR #22, which supplies the API client,
the same-origin proxy and the real login.

Done means three things (Notion DoD):

1. The agreed KPIs and campaign rows render from real API responses.
2. Filters and status cues work.
3. Weak campaigns are visibly highlighted.

All of this must be verified live against the seeded Nour Fashion data.

**Session constraint.** This session ran CP0 in a read-only planning mode. Because of that:

- This plan sits at the session's plan path. It is copied to `../ui04-work/UI-04-plan.md` right
  after "go".
- The work folder and the Notion extraction are created after "go". At CP0 the zip was read by
  streaming its files to stdout, so nothing was extracted.
- The web gates (`npm ci`, `npm run …`) were not run at CP0, because they would write
  `node_modules` and `.next`.

---

## 1. Baseline

| Item | Value | Evidence |
|---|---|---|
| Fork | `origin` = `https://github.com/mohamedhassan420/Sawakli-AI` | `git remote -v` |
| Fork `main` SHA | `4f71cf8d2b9afda36c64108fe65fc03de7cf3804` | `git rev-parse origin/main` |
| Upstream `main` SHA | `4f71cf8d2b9afda36c64108fe65fc03de7cf3804` (identical to the fork; the fork is **not** behind) | `git ls-remote https://github.com/elfaroukomaradmission-a11y/Sawakli-AI.git` → `refs/heads/main` |
| `main` CI status | **Unverified.** There is no GitHub API access to the team repo: `gh` reports "The token in GH_TOKEN is invalid", the team repo isn't attached with credentials, and the fork has 0 Actions runs. | `gh auth status`; MCP `actions_list` on the fork → `total_count: 0` |
| PR #22 head | `e8d70639b6a0ee57274a7e5318aa91eb37b25668`, last commit 2026-10-02 by AbdulrahmanE8, 4 commits (`ad06224`, `a9f7e1e` [merge], `7ace268`, `e8d7063`) | `git ls-remote … refs/pull/22/head`; `git log 4f71cf8..e8d70639` |
| PR #22 state | **Open per git refs.** `refs/pull/22/merge` exists (`ca44906`), which GitHub keeps for open, mergeable PRs. The API state is unverified (no API access). | `git ls-remote` |
| PR #22 vs `main` | Merges cleanly. The merge base is `e5806de`, and `main` has 0 changes under `apps/web` since then. | `git merge-tree --write-tree 4f71cf8 e8d70639` → clean; `git diff --stat e5806de 4f71cf8 -- apps/web` → empty |
| Contracts gate (on `main`) | **PASS**, 5/5 (db: 1 accepted deviation; ui: no deviations; backend: 7 accepted; ai: 1 accepted; negative suite: 23 cases caught, real files unchanged). Ran on Node 22.22.0 with `PYTHON=python3.12`; CI uses Node 24. | `PYTHON=python3.12 node scripts/run-contracts.mjs` → exit 0 |
| Web gates: lint / type-check / test / build (on `main` and on the #22 merge) | **NOT RUN.** CP0 is read-only in this session, and `npm ci` would write `node_modules`. These run first after "go", before any code change. | — |
| Backend tests | **NOT RUN.** UI-04 changes no backend code. | — |

**Tooling**

| Tool | Status | Notes |
|---|---|---|
| Node | **22.22.0 available**; Node 24 is required by `.nvmrc` and CI | `node-v24.22.1-linux-x64.tar.xz` is reachable on nodejs.org. It will be installed into `../ui04-work/scratch/node24` (no system change). |
| Python 3.12 | **Available** (`/usr/bin/python3.12`) | The default `python3` is 3.13. The backend venv will use 3.12. PyPI is reachable. |
| PostgreSQL | **Available**: PG 16.15 server binaries (`/usr/lib/postgresql/16/bin`) and a `postgres` OS user | A throwaway cluster will run in `../ui04-work/scratch/pg`, port 5441. CI uses `postgres:18` (noted as a difference). **The live E2E steps are therefore runnable here, so screenshots will exist.** |
| Docker | CLI installed, **daemon not running** | Not needed, since local PG is used instead. |
| `gh` | **Unavailable** (invalid token) | PR creation needs the team repo attached with push access, or the compare-link fallback (§10 of the brief). See Q4. |
| Playwright/Chromium | Chromium is at `/opt/pw-browsers` | Playwright goes into scratch only (D12). |
| Git identity | `Claude <noreply@anthropic.com>` | See Q5. |

## 2. Ground truth B1–B15

| # | Status | Evidence / note |
|---|---|---|
| B1 | **Confirmed** | `4f71cf8 Merge pull request #28 from …/API-02` is the `main` HEAD on both remotes. |
| B2 | **Confirmed** | `api/routes/campaigns.py:14-66`: the 3 GETs; list `order_by(Campaign.name)`; metrics `order_by(DailyMetric.date)`; `from`/`to` are required `dt.date` query aliases and inclusive (`>=`, `<=`). |
| B3 | **Confirmed (API-02 part); INT-01 part Unverified** | API-02 doc §2 l.31, l.37; §15 l.392-396; §16 l.401-405. The INT-01 v1.1 PDF is image-only: `pdftotext` yields only page 6, so the §2 endpoint table can't be checked yet. I'll render it as images after "go". |
| B4 | **Confirmed** | `schemas/campaigns.py:8-16`; `schemas/metrics.py:8-41` (`safe_div` → `None` on 0); `db/models/campaign.py:13-22` enums. No currency anywhere. |
| B5 | **Confirmed** | `deps.py:43-57,67-72` (401); `deps.py:77-84` (org mismatch → 404); `campaigns.py:32-33,54-55` (missing/foreign → 404); `campaigns.py:45-46` plus FastAPI parsing (422). |
| B6 | **Confirmed** | PROD-01 PDF §2.1 (6 KPIs, formulas), §2.2 (CPC supporting, derived), §2 banner ("computed at read time, never stored"). |
| B7 | **Confirmed** | Parsed `0009_seed_demo_data.py`: 360 rows, 4 campaigns × 90, dates 2026-05-23 → 2026-08-20, org `550e8400-…440000`, campaign ids `770e…000a`–`000d`. |
| B8 | **Confirmed** | `release-checklist.md:54` (5.1, "no environment guard"); `tests/fixtures/seed.py:27-31` (`demo@nourfashion.example`, `SAWAKLI_DEMO_PASSWORD`), `:85-89` (refuses a blank password). |
| B9 | **Confirmed, with one addition** | See §1. **New finding:** #22's new `docs/ui/UI-02-ui-foundation-and-api-client.md` uses the **16-section legacy** headings, but the file does not exist at base `4f71cf8`. `.github/scripts/check-documentation-governance.sh:86-92` allows the legacy format only for docs that exist at the base, so the **Documentation governance job will FAIL** on #22 today, and on any PR stacked on it. The 17-section requirement landed in `78ac7ad` (16 Oct), after #22's last push (2 Oct). This conclusion comes from reading the script; it has not been executed. → Q2. |
| B10 | **Confirmed** | `lib/api-client.ts` is absent on `main`; `dashboard/page.tsx:20-53` has a hardcoded 4-card `KPI_DATA` (Spend, Clicks, Conversions, CPA, with "EGP"); `campaigns.service.ts:6-10` returns `mockCampaigns`; mock `health_status` is at `mock-data/campaigns.ts`. |
| B11 | **Confirmed, with one more trap** | `validate-ui-types.mjs:25-32` (`[^}]+` breaks on nested `{}`), `:49-55` (accepts `?:`), `:97-130`; `canonical.json` campaigns `computed_fields.health_status: "AI-computed"`. **Extra trap:** `extractUnionValues` (`:34-47`) collects every `'…'` up to the next blank line, so an apostrophe in a comment placed directly under a union would add a bogus enum value. |
| B12 | **Confirmed, with one addition** | `ci.yml`: the Frontend job runs `npm ci`, lint, type-check, **build, then test** (Node 24); Contracts runs `run-contracts.mjs`; Backend fails on skips. **Not in the brief:** a 5th job, `documentation-governance`, runs on PRs (see B9). |
| B13 | **Confirmed** | `apps/web/package.json`: no chart library. `dashboard/page.tsx:122-125` is the placeholder. |
| B14 | **Confirmed, with one difference** | `campaigns.service.ts:15` (`?? mockCampaigns[0]`). The UI-05 card's **authoritative** "Depends On (2026-09)" and Completion Gates are **UI-02, API-02, API-05**. UI-04 appears only in the historical Prerequisites field. The UI-05 DoD ("Campaign page renders time-series performance") confirms the detail view is UI-05's. |
| B15 | **Confirmed (recomputed from the seed SQL)** | **All 90 days:** Summer CPA 23.82 > 22.83 → **Weak**; Winter ROAS 7.24 / CPA 8.61 → **Strong**; Flash Sale CPA 17.41, ROAS 2.16 → **Average**; Evergreen ROAS 0.30 → **Weak**. **Last 30 (2026-07-22 → 08-20):** org CPA 22.20 (×1.25 = 27.75): Summer CPA **27.66** → Average (only 0.09 below the threshold); Flash Sale 35.83 → **Weak**; Evergreen → **Weak**; Winter → Strong. Story mapping: A = Summer, B = Winter, C = Flash Sale (CTR 1.86% → 0.98%), D = Evergreen. → Q3. |

**§7.3 expected numbers, recomputed** (All = Last 90 days of data, because the data spans exactly 90 days):

| Range | Spend | Clicks | Conv. | CTR | CPA | ROAS | CPC |
|---|---|---|---|---|---|---|---|
| All | 35,474.85 | 52,669 | 1,942 | 2.30% | 18.27 | 2.74× | 0.67 |
| Last 30 | 12,453.51 | 16,753 | 561 | 2.08% | 22.20 | 2.33× | 0.74 |
| Last 7 | 2,935.12 | 3,892 | 125 | 2.09% | 23.48 | 2.18× | 0.75 |

The brief's All figures match. For previous periods: Last 30's previous period (06-22 → 07-21) and Last 7's (08-07 → 08-13) both have data, so deltas show. Last 90's previous period has **no data**, so no deltas show.

## 3. Notion cards read (streamed from the zip, not yet extracted)

I read UI-04, UI-02, API-02, UI-03, UI-05, ARCH-06 (card + **decision PDF**), API-05, UI-09, QA-04, PROD-01 (card + PDF) and INT-01 (card + PDF, mostly images).

**UI-04 against brief §1:** Details, Objective, the 3 DoD lines, Depends On, Entry contract, Acceptance, Evidence and Source trace all match verbatim. The card also has:

- Prerequisites = Depends On = UI-02, API-02.
- Status In Progress; Track Frontend; Release Scope Core; 11 h remaining; Due 22 Oct 23:59 GMT+3.
- Internal handoff: "Consume API-02 real fixture Tue 20 Oct."

**Differences and observations:**

1. **There is no "API-02 reviewed fixture" in the repo.** The API-02 card promised "real KPI response fixture by Tue 20 Oct for UI-04", and its objective says "campaign **and KPI** data". `git ls-files | grep -i fixture` shows only backend fixtures. Plan: the live seeded API is the real-data checkpoint, and the component tests use synthetic fixtures that follow the schema exactly.
2. **ARCH-06 (Accepted)** directly governs UI-04 (§3, §4, §5.3, §8 checklist):
   - The page → hook → service → `apiRequest` path is mandatory.
   - Loading / success / empty / error / **refreshing** are all required states.
   - Empty copy should read "No marketing data is available yet. Upload a CSV or connect a provider."
   - **401 handling must be central**: clear the session and redirect to `/login`, "implemented centrally rather than repeated on every page".
   - Mock data must be labeled.

   This changes D11 (see §4).
3. UI-02 is marked Done (24 Aug) and UI-03 Done (1 Oct), but their client and login work (#22) is still unmerged. This is recorded only.
4. The PROD-01 demo flow says "campaign table flags A, B, C, D → open Campaign A". This drives Q3.
5. `docs/AGENTS.md` says to use "Prerequisites" and not to reintroduce "Depends On". Notion calls Depends On authoritative. In practice there's no conflict, because both list UI-02 and API-02. The task doc will use the template's "Prerequisites" heading.

## 4. Decisions D1–D12

| # | Position | Detail / reason |
|---|---|---|
| D1 | **Agree**, but the branch name is open (**Q1**) and so is the governance problem (**Q2**) | Branch from `pr-22`, merge `upstream/main` (expected clean), and target the PR at `main` with "includes #22's 4 commits; merge #22 first". #22's commits and branch are never touched. |
| D2 | **Agree** | Spend, Clicks, Conversions, CTR, CPA, ROAS. CPC appears only in the table. |
| D3 | **Agree** | Use `useQueries`, 1 + N requests. Sum raw facts, then divide. Logic lives in pure, unit-tested `src/features/dashboard/aggregate.ts`, matching the formula in API-02 doc §15. |
| D4 | **Agree on the mechanics; propose a different default (Q3)** | Fetch window: today−365 → today, using the **local** calendar date and string/UTC date arithmetic (no `toISOString()` off-by-one). Presets end at the latest data date. Label: "Data through 20 Aug 2026". **Proposed default: "Last 90 days of data"** instead of Last 30. With Last 30, Campaign A (Summer, the headline "wasting budget" story) shows **Average** (CPA 27.66 against a 27.75 threshold), and the demo would open an unflagged campaign. |
| D5 | **Agree**, thresholds unchanged | A single `PERFORMANCE_RULE` constant (`weakRoasBelow: 1.0`, `weakCpaRatio: 1.25`) carries a PROD-01 citation comment. The baseline ignores the platform/status filters, and No-data campaigns are excluded from it. If the org CPA is null (no conversions in range), the CPA comparisons are skipped. Spend > 0 with 0 conversions is still Weak. Labeled "Performance" and never `health_status`. |
| D6 | **Agree** | URL params: `range`, `platform`, `status`. `useSearchParams` sits inside `<Suspense>`. Table sorting is local state (not in the URL). |
| D7 | **Agree, with one clarification** | Delta colour: Clicks, Conversions, CTR and ROAS up = good; CPA up = bad; **Spend is neutral**, since more spend is neither good nor bad. Deltas appear only when the previous equal-length period has data; otherwise the card says "No prior-period data". |
| D8 | **Agree, with additions** | `Campaign` takes the API-02 shape: `objective`, `budget`, `start_date`, `end_date` and `status` are typed `\| null`, and `organization_id?: string` keeps a no-apostrophe comment. Add `DailyMetric`. Remove `HealthStatus`, the metric fields, **and** the now-dead `CampaignDetails` / `TimeSeriesPoint` (their only consumer, `getCampaignDetails`, goes away under D10). No nested `{}` inside `Campaign`. |
| D9 | **Agree** | Replace #22's notice with: KPIs and the campaign table are live; the Anomalies and Recommendations panels are sample data until the AI endpoints land. Each mock panel also gets its own "Sample data" label. |
| D10 | **Agree; this stays inside UI-05's boundary** | Fetch the real campaign with endpoint 2 for the header (name, platform, status, objective, budget, dates). 404 or 422 shows "Campaign not found" with a back link. **Remove the details KPI row**, because its mock fields no longer exist. The chart and anomalies stay, labeled "Sample content — campaign performance view arrives with UI-05". Anomaly mocks are keyed `camp-00x`, so they won't match real UUIDs and will show none. |
| D11 | **Agree on the states; change where 401 handling lives (per ARCH-06)** | Handle 401 **once**, in `components/providers/query-provider.tsx` via a `QueryCache` `onError` hook: on a 401 `ApiError`, call `clearSession()` and redirect to `/login`. A missing local session on a protected page is handled the same way. This avoids editing #22's `api-client.ts` and covers every query hook, not just UI-04's. Also add ARCH-06's **refreshing** state (data stays visible with a small "Updating data…"). Null ratio → "—" with a tooltip; `en-US`; CTR `2.30%`; ROAS `2.74×`; money with 2 decimals and **no currency** (the hardcoded "EGP" is removed). Retry is offered on 5xx and network errors (ARCH-06 §4). |
| D12 | **Agree** | No new dependencies. Node 24 and Playwright are installed only under `../ui04-work/scratch/`. |

## 5. File-by-file change plan

All paths are under `apps/web/` unless stated. The work happens on the UI-04 branch after merging `upstream/main` into `pr-22`.

**Added**

- `src/features/dashboard/aggregate.ts`: pure functions:
  - `sumFacts`, `deriveRatios` (null-safe), `campaignTotals(rows, range)`, `orgTotals`
  - `latestDataDate`, `resolvePreset(preset, latest)` (inclusive ranges), `previousPeriod(range)`
  - `classifyPerformance(campaign, baseline)` and `PERFORMANCE_RULE`
  - Date helpers on `YYYY-MM-DD` strings via `Date.UTC`
- `src/features/dashboard/types.ts`: `DatePreset`, `DateRange`, `DashboardFilters`, `KpiSummary`, `CampaignPerformance`, `PerformanceFlag` (`weak | average | strong | no_data`).
- `src/features/dashboard/filters.ts`: parse and serialize the URL params with safe defaults (unknown values fall back to the defaults).
- `src/features/dashboard/format.ts`: `en-US` number, percent, ROAS and date formatters.
- `src/features/dashboard/useCampaignPerformance.ts`: composes `useCampaigns` and `useCampaignMetrics` into one state (`loading | empty | no-data-in-window | error | ready`, plus `isRefreshing`) and returns the KPI summary, previous-period summary, rows and flags.
- `src/features/dashboard/components/`: `FilterBar.tsx`, `KpiCards.tsx`, `NeedsAttention.tsx`, `Badges.tsx` (platform/status/performance; the text carries the meaning), `DataState.tsx` (loading skeleton, empty, error with retry).
- `src/hooks/useSession.ts`: a `useSyncExternalStore` wrapper over `getSession()` with a server snapshot of `null`, to avoid hydration mismatches.
- Tests: `tests/dashboard-aggregate.test.ts` (red-first), `tests/dashboard-filters.test.ts`, `tests/campaigns-service.test.ts`, `tests/dashboard-page.test.tsx`, `tests/campaigns-page.test.tsx`, `tests/campaign-detail-page.test.tsx`, `tests/query-provider-401.test.tsx`.
- `docs/ui/UI-04-dashboard-kpis-and-campaign-table.md` (repo root): 17 sections. §5 quotes the 3 DoD lines verbatim; §8 holds the formulas, sum-then-divide, date anchoring and the D5 rule; §15/§16 hold G1–G6.

**Modified**

- `src/types/campaign.ts` and `src/types/index.ts`: per D8.
- `src/services/campaigns.service.ts`: `getCampaigns(orgId, token)`, `getCampaign(orgId, id, token)`, `getCampaignMetrics(orgId, id, from, to, token)` via `apiRequest`, with `encodeURIComponent` on path segments. `getAnomalies` stays, labeled as mock.
- `src/hooks/useCampaigns.ts`: `useCampaigns(orgId)`, `useCampaign(orgId, id)`, `useCampaignMetrics(orgId, ids, window)` (`useQueries`). Keys are `['campaigns', orgId]`, `['campaign', orgId, id]`, `['campaign-metrics', orgId, id, from, to]`. The org id comes only from the session, which comes from `/me`.
- `src/components/providers/query-provider.tsx`: central 401 handling (D11).
- `src/app/(app)/dashboard/page.tsx`: 6 live KPI cards, filter bar, "Data through …", Needs-attention strip, accurate notice; the Anomalies/Recommendations panels stay, labeled as samples; the chart placeholder stays.
- `src/app/(app)/campaigns/page.tsx`:
  - Columns: Campaign, Platform, Status, Spend, Clicks, Conv., CTR, CPC, CPA, ROAS, Performance.
  - Sorting on all columns.
  - Weak rows get `.row-weak`, and the Weak badge carries the meaning.
  - Legend line under the table.
  - Footer: "Showing N of M campaigns".
- `src/app/(app)/campaigns/[id]/page.tsx`: D10.
- `src/styles/pages.css`: a handful of classes (`.filter-bar`, `.row-weak`, `.perf-legend`, `.attention-strip`, `.skeleton`, `.data-through`) using existing tokens.
- `docs/README.md`: link to the UI-04 doc.
- `docs/testing/release-checklist.md`: the "Login (browser)" and "Dashboard" rows, with the verified commit. The login row is worded conditionally on #22 merging.

**Deleted**

- `src/lib/mock-data/campaigns.ts`: no importer remains.

**Untouched**

- #22's `api-client.ts`, the proxy route and `session.ts` (only `clearSession` is imported).
- All backend files, `canonical.json`, `known-deviations.json`, the anomaly/recommendation mocks and services.

## 6. Test plan

**Red-first, step by step**

1. Write `tests/dashboard-aggregate.test.ts` against a stub `aggregate.ts` whose exports throw `not implemented`.
2. Run `npm test`, which must FAIL; capture the output.
3. Implement.
4. Run `npm test` again, which must PASS.

**Aggregation cases (hand-calculable):**

- Sum-then-divide vs averaged daily ratios, with an example where they differ. Day 1: spend 10, conv 1. Day 2: spend 90, conv 9. Both days have CPA 10, so they agree. Change day 2 to spend 90, conv 1: daily CPAs are 10 and 90 (average 50), but the true CPA is 100/2 = **50**. Use instead CTR with impressions 100/clicks 10 and impressions 900/clicks 9: the averaged CTR is 5.5% and the true CTR is **1.9%**.
- Zero denominators → `null`.
- A campaign with no rows → `no_data`.
- An empty org.
- The inclusive boundary day (rows exactly on `from` and on `to` are counted; the day before is not).
- A previous period without data → no delta.
- Every branch of `classifyPerformance`: ROAS < 1; CPA > 1.25× org; 0 conversions with spend; Strong; Average; No data; org CPA null.
- Baseline independence: filtering to Meta does not change any flag.
- The latest-data finder; preset resolution across a month boundary; the local-date "today" helper.

**Other tests**

- **Filters:** parse/serialize round trips; invalid values fall back to the defaults.
- **Service:** exact paths and query strings (`/api/orgs/{org}/campaigns/{id}/metrics?from=…&to=…`) and the Bearer token, with `fetch` stubbed.
- **Components** (Testing Library, mocked service layer, `next/navigation` mocked):
  - Dashboard: loading (no zeros shown), empty (link to `/setup/connector`), no-data-in-window, error with Retry calling refetch, 6 KPI values from the fixture, "Data through" label.
  - Campaigns page: weak row has the badge "Weak" and the `.row-weak` class, legend, platform filter narrows rows, "Showing N of M".
  - Detail page: unknown id → "Campaign not found" and never another campaign's name.
  - 401 → `clearSession` called and redirect to `/login`.

**Gates (§7.1)**

- From `apps/web` on Node 24: `npm ci`, `npm run lint`, `npm run type-check`, `npm test`, `npm run build`.
- From the repo root: `node scripts/run-contracts.mjs`.
- I'll also run `.github/scripts/check-documentation-governance.sh 4f71cf8 HEAD` locally, so the B9 conclusion becomes an executed result.

**Live E2E (§7.2–7.5)**

1. Throwaway PG 16 cluster on `localhost:5441` under `../ui04-work/scratch/pg`. The password is generated into an env var and never echoed.
2. `alembic upgrade head`, then the QA-00 seed with a synthetic `SAWAKLI_DEMO_PASSWORD`.
3. Run uvicorn with a throwaway `JWT_SECRET`, and `next dev` with `API_INTERNAL_URL`.
4. Log in through the browser via scratch Playwright with the bundled Chromium.
5. SQL cross-check of the 6 KPIs for All and Last 30 against the cards (the table in §2 above is the expectation).
6. Screenshots go to `../ui04-work/evidence/`:
   - default dashboard
   - dashboard filtered to Meta
   - campaigns table with weak rows
   - legend
   - empty state (second org)
   - error state (API stopped)
7. Org isolation: register a second org, confirm its dashboard is empty, and confirm a Nour campaign id with its token → 404.
8. Independent review by a fresh subagent, per §7.6.
9. Clean up everything at the end.

## 7. Risks and discrepancies

1. **Documentation governance fails** because of #22's 16-section UI-02 doc (B9). → Q2.
2. **The demo story vs the default range** (D4/B15). Under Last 30, Campaign A isn't flagged, and its margin to the threshold is 0.09. Small data changes flip it. → Q3.
3. **Branch naming conflict.** The brief says `feature/UI-04-dashboard-kpis-campaign-table`; `AGENTS.md` recommends `feature/<task-id>-…`; `CONTRIBUTING.md` lists `feat/…`. Meanwhile this session's harness designates `claude/magical-planck-13swo6` and says not to push elsewhere without explicit permission. → Q1.
4. **No API access to the team repo.** `main` CI is Unverified, and opening the PR and confirming CI need either the team repo attached with push access or the compare-link fallback. → Q4.
5. Node 22 is installed locally while CI uses 24 (mitigated with a scratch Node 24). Local PG is 16 while CI uses 18; the seed was originally verified on PG 16 according to the migration docstring.
6. **INT-01's endpoint table can't be read** (image PDF), so B3's INT-01 claim stays Unverified until I render the pages.
7. **No API-02 fixture exists** (card vs repo). Real data comes from the live seeded API.
8. **1 + N requests and a 365-day window** are a client-side workaround (G1). For the demo, N = 4 (5 requests in total).
9. The validator's union-regex apostrophe trap (B11) is avoided by keeping comments apostrophe-free next to unions.
10. **Hydration.** Existing pages call `getSession()` during render (the server gets `null`). The new pages use `useSession` to avoid mismatches. Old pages are left as they are (out of scope).
11. `docs/AGENTS.md` uses "Prerequisites" and Notion uses "Depends On". Both list the same tasks, so there's no practical conflict.
12. If #22 changes before merge, I'll re-merge in my own merge commit and never edit its commits.

**Contract gaps G1–G6 (to report, not fix):**

- G1–G6 exactly as in brief §8. All are confirmed by the evidence above.
- One addition to G4: `canonical.json` has **no `daily_metrics` entity**, so the frontend `DailyMetric` type isn't validator-mapped either.

## 8. Questions for Mohamed (real decisions only)

**Q1 — Branch name.**

- (a) **Recommended:** create `feature/UI-04-dashboard-kpis-campaign-table` as the brief says, and push it to the fork. The session branch `claude/magical-planck-13swo6` stays untouched.
- (b) Use the session branch `claude/magical-planck-13swo6`.

A "go" without an answer means (a).

**Q2 — The UI-02 doc in #22 fails documentation governance.**

- (a) **Recommended:** leave Abdulrahman's doc alone. You or he converts it to the 17-section format in #22. My PR description will state that the governance failure comes from #22's doc and clears once #22 is fixed and merged.
- (b) I convert the UI-02 doc to 17 sections in my own commit on the UI-04 branch. This touches his file and may conflict with his fix.
- (c) A maintainer applies `documentation-exempt`. Not recommended: it would also skip the check on the UI-04 doc.

**Q3 — Default date preset.**

- (a) **Recommended:** default to "Last 90 days of data". This flags A (Summer) and D (Evergreen) as Weak and B (Winter) as Strong, matching the PROD-01 demo story. No deltas show by default, because there's no earlier data; picking Last 30 or Last 7 shows deltas and flags C (Flash Sale).
- (b) Keep Last 30 as in brief D4. A shows as Average.

The thresholds stay unchanged either way.

**Q4 — GitHub access for the PR and for CI checks on the team repo.** Do you want me, after `approved`, to request push access to `elfaroukomaradmission-a11y/Sawakli-AI` for this session (a one-time approval prompt)? That would let me open the PR, request Abdulrahman's review and read CI results. If not, I'll give you the compare link plus the title and body to paste.

**Q5 — Commit author.** The session's git identity is `Claude <noreply@anthropic.com>`, and each commit gets a `Co-Authored-By` trailer. Should commits instead be authored under your name and email? If so, give the exact `Name <email>` to use.

## Verification summary at CP0

- `node scripts/run-contracts.mjs` on `main`: **PASS** (5/5).
- `npm run lint` / `type-check` / `test` / `build`: **NOT RUN** — CP0 is read-only in this session; they run first after "go".
- Backend tests: **NOT RUN** — no backend changes are planned.
- `main` CI: **NOT RUN** (Unverified) — no GitHub API access to the team repo.
- Documentation governance on #22: **NOT RUN** — failure predicted by reading the script; it will be executed locally after "go".
