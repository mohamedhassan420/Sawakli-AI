# UI-04 work-folder backup (not for merge)

Backup of `../ui04-work/` taken 21 Oct 2026 before CP1, because the cloud container can be reclaimed.
Contents: the CP0 plan, `evidence/` (screenshots, SQL cross-check, test and gate logs), dev-server
logs, the Playwright E2E script and the independent reviewer's probe files.

Deliberately excluded: `scratch/secrets/` (throwaway generated passwords and JWT secret), Node 24 and
Python venv binaries, the throwaway PostgreSQL data directory, `node_modules`, and `notion-export/`
(the team's Notion zip; re-extract it from the original upload).
