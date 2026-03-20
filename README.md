# Brain Dump 🧠

A personal brainstorming and task tracker. Two-panel layout: projects on the left, tasks on the right. No auth — just you and your ideas.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Supabase · Vercel

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd brainstorm
npm install
```

### 2. Add environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase project → **Settings → API**.

### 3. Create the database tables

In your Supabase project, go to **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.

This creates:
- `projects` — id, name, created_at
- `tasks` — id, project_id (FK → projects), title, notes, status, created_at

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- **Projects** — create and delete projects from the left panel
- **Tasks** — add tasks with a title and optional notes
- **Status cycling** — click a status badge to advance: `Idea → In Progress → Done → Archived`
- **Inline editing** — click any task title to edit it in place; press Enter or click away to save
- **Filter bar** — filter tasks by status (All / Idea / In Progress / Done / Archived)

---

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add the two `NEXT_PUBLIC_` environment variables under **Project Settings → Environment Variables**
4. Deploy — Vercel auto-detects Next.js, no extra config needed
