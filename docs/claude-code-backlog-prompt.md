---
doc: claude-code-backlog-prompt.md
uso: pegar en Claude Code desde la raíz del repo (con GH_TOKEN configurado). Se auto-organiza en fases y pausa para tu aprobación.
estado: EJECUTADO — ver nota abajo
---

# ✅ Ya ejecutado (2026-07-16)

Este prompt ya corrió de punta a punta (Fases 1–4) el 2026-07-16. Resultado:
**16 epics + 68 issues hijos (84 total)** en GitHub Issues, con sub-issues nativos,
`## Blocked-by` por issue, y label `ready` en lo que se puede empezar ya.

👉 Ver: https://github.com/alexaarenash19-cmyk/relieve-web/issues

Este archivo se conserva como referencia del proceso usado (por si se necesita
re-correr para un proyecto nuevo o repetir el patrón). No hace falta volver a
pegar este prompt en este repo — el backlog ya existe.

---

# Prep para Claude Code

## Antes de pegar el prompt
1. Copia toda la carpeta `docs/` de Drive a tu repo, en `/docs`:
   `architecture.md`, `database.md`, `api.md`, `ui-ux.md`, `backlog.md`, `decisions.md`, y este archivo.
2. Crea un **fine-grained PAT** en GitHub (Settings → Developer settings → Personal access tokens), con acceso **solo a este repo**, permisos **Issues + Contents (read/write)**, expiración 1 mes.
3. Exponlo como `GH_TOKEN` (lo toma el `gh` CLI). Guárdalo en `.env`, y agrega `.env` a `.gitignore`. Nunca lo hardcodees.
4. Corre Claude Code en **plan mode** (Shift+Tab dos veces) para que proponga antes de actuar.

## Decisiones cerradas (Claude Code debe respetarlas — ver decisions.md)
- DB: **Supabase** (Postgres + Storage). · Hosting/API: **Vercel** (serverless functions para `/api` y el webhook Stripe). · CFDI: **Facturama** (vía n8n). · Precios: **enteros en centavos MXN**.
- `decisions.md` es **autoritativo**: si algo en otro doc contradice, gana decisions.md.

## PROMPT (pegar tal cual)

Turn my technical spec docs into a structured GitHub backlog. Work in PHASES and STOP for my approval after each — do not create everything at once.

Context:
- Specs live in /docs (architecture.md, database.md, api.md, ui-ux.md). decisions.md is AUTHORITATIVE and overrides conflicts. backlog.md is a proposed breakdown you may use as a starting point but must reconcile with the specs.
- Locked decisions: Supabase (Postgres + Storage); Vercel serverless for /api and the Stripe webhook; Facturama for CFDI via n8n; all prices are integers in MXN cents.
- The repo is connected; use the gh CLI (GH_TOKEN is set). Use `gh api` for anything the CLI doesn't cover, including native sub-issue links.

Phase 1 — Epics: Read every file in /docs. Propose a list of epics (one per major area of work), each with a title, one-line goal, and the spec sections it covers. Show me the list. Create nothing yet. Wait for approval.

Phase 2 — Issues: After I approve, create each epic as an issue labeled `epic`. Then draft the child issues needed to finish each epic and show them grouped by epic. Wait for approval.

Phase 3 — Sub-issues: Create the approved issues. For any issue bigger than ~1 day of work, split it into sub-issues and attach them using GitHub's native parent–child sub-issue relationship (not checkbox task lists).

Phase 4 — Order: Sequence everything by dependency, not document order — Supabase schema and migrations first, then Vercel services and API, then UI (the 3D hero last of the UI, behind a placeholder). Add a `blocked-by:` note in each issue body and apply a `ready` label to anything currently unblocked.

Rules:
- One issue = one shippable unit of work.
- Imperative titles ("Add places table"); bodies include acceptance criteria.
- Prices are integers in MXN cents everywhere.
- Never invent scope that isn't in the specs. If something's missing, ask me.
