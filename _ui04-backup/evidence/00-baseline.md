# Baseline (before any UI-04 code), 21 Oct 2026
Branch feature/UI-04-dashboard-kpis-campaign-table = pr-22 (e8d7063) + merge upstream/main (4f71cf8) -> local merge commit 4d85c68 (clean).
Node v24.22.1 (scratch), npm 11.19.1.
- npm ci: PASS
- npm run lint: PASS (0 errors, 2 pre-existing warnings: _orgId unused in campaigns.service.ts:6 and recommendations.service.ts:6)
- npm run type-check: PASS
- npm test: PASS (3 files, 7 tests)
- npm run build: PASS (13 routes)
- node scripts/run-contracts.mjs: PASS 5/5
- bash .github/scripts/check-documentation-governance.sh 4f71cf8 HEAD: FAIL (exit 1) - docs/ui/UI-02-ui-foundation-and-api-client.md (from PR #22) is new at base and uses 16-section headings.
