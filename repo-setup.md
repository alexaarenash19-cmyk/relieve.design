---
doc: repo-setup.md
uso: pasos y comandos exactos para dejar el repo listo para Claude Code. El token lo creas TÚ (nunca lo compartas).
---

# Setup del repo (para el backlog con Claude Code)

## 0. Prerrequisitos
- Node 18+, git, y el **GitHub CLI** (`gh`) instalado: https://cli.github.com/

## 1. Crear el repo y la carpeta docs
```bash
# desde donde guardas tus proyectos
gh auth login                      # inicia sesión en GitHub (una vez)
gh repo create relieve-web --private --clone
cd relieve-web
mkdir docs
# copia dentro de /docs los .md de Drive:
# architecture.md, database.md, api.md, ui-ux.md, backlog.md, decisions.md, claude-code-backlog-prompt.md
```

## 2. Archivo .gitignore (crea este archivo en la raíz)
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

## 3. Archivo .env.example (crea este archivo en la raíz; commitea SOLO el example)
```
# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Supabase
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
# n8n
N8N_WEBHOOK_URL=
# Facturama (CFDI)
FACTURAMA_USER=
FACTURAMA_PASSWORD=
# Email
RESEND_API_KEY=
```
> Tu `.env` real (con los valores) NO se sube: ya está en .gitignore.

## 4. El token de GitHub (esto lo haces TÚ — no lo compartas)
1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access:** solo `relieve-web`.
3. **Permissions:** `Issues` = Read/Write, `Contents` = Read/Write.
4. **Expiration:** 1 mes.
5. Copia el token y expórtalo (no lo pegues en ningún archivo versionado):
```bash
export GH_TOKEN=ghp_tu_token_aqui      # macOS/Linux (sesión actual)
# o agrégalo a tu .env local (que está en .gitignore)
```

## 5. Correr Claude Code
```bash
# en la raíz del repo
claude
```
- Activa **plan mode**: `Shift+Tab` dos veces.
- Pega el prompt de **claude-code-backlog-prompt.md**.
- Aprueba fase por fase: Epics → Issues → Sub-issues → Orden por dependencia.

## 6. Primer commit
```bash
git add docs .gitignore .env.example
git commit -m "Add technical spec docs and backlog"
git push
```
