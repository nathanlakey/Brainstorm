// ── Project ──────────────────────────────────────────────────────
export type Project = {
  id: string
  name: string
  created_at: string
}

// ── Task ─────────────────────────────────────────────────────────
export type TaskStatus = 'Idea' | 'In Progress' | 'Done' | 'Archived'

export type TaskPriority = 'High' | 'Medium' | 'Low'

export type Task = {
  id: string
  project_id: string
  title: string
  notes: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null   // ISO date string YYYY-MM-DD
  created_at: string
}
