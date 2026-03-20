'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project, Task, TaskStatus, TaskPriority } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'

// ── Status helpers ────────────────────────────────────────────────
const STATUSES: TaskStatus[] = ['Idea', 'In Progress', 'Done', 'Archived']

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  Idea: 'In Progress',
  'In Progress': 'Done',
  Done: 'Archived',
  Archived: 'Idea',
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  Idea: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
  'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
  Done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
  Archived: 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700',
}

// ── Priority helpers ──────────────────────────────────────────────
const PRIORITY_ORDER: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 }

const NEXT_PRIORITY: Record<TaskPriority, TaskPriority> = {
  High: 'Medium',
  Medium: 'Low',
  Low: 'High',
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  High: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
  Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50',
  Low: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
}

// ── Due date helpers ────────────────────────────────────────────
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type DueDateState = 'future' | 'today' | 'overdue'

function getDueDateState(due: string): DueDateState {
  const today = todayISO()
  if (due === today) return 'today'
  return due < today ? 'overdue' : 'future'
}

function formatDueDate(due: string): string {
  // Parse as local date to avoid timezone shifts
  const [y, m, d] = due.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Page ─────────────────────────────────────────────────────────
export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)

  // New project form
  const [newProjectName, setNewProjectName] = useState('')
  const [savingProject, setSavingProject] = useState(false)

  // New task form
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [savingTask, setSavingTask] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)

  // Filter & sort
  const [filter, setFilter] = useState<'All' | TaskStatus>('All')
  const [sortByPriority, setSortByPriority] = useState(false)

  // New task priority
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium')

  // New task due date
  const [newDueDate, setNewDueDate] = useState('')

  // Task expand / edit draft
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({
    title: '',
    notes: '',
    status: 'Idea' as TaskStatus,
    priority: 'Medium' as TaskPriority,
    due_date: '',
  })

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null
  const baseFiltered = filter === 'All' ? tasks : tasks.filter((t) => t.status === filter)
  const filteredTasks = sortByPriority
    ? [...baseFiltered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    : baseFiltered

  // ── Load projects ──────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      setLoadingProjects(true)
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      const list = (data ?? []) as Project[]
      setProjects(list)
      if (list.length > 0) setSelectedId(list[0].id)
      setLoadingProjects(false)
    })()
  }, [])

  // ── Load tasks when project changes ───────────────────────────
  useEffect(() => {
    if (!selectedId) { setTasks([]); return }
    setFilter('All')
    setSortByPriority(false)
    setExpandedTaskId(null)
    ;(async () => {
      setLoadingTasks(true)
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', selectedId)
        .order('created_at', { ascending: false })
      setTasks((data ?? []) as Task[])
      setLoadingTasks(false)
    })()
  }, [selectedId])

  // ── Add project ───────────────────────────────────────────────
  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault()
    const name = newProjectName.trim()
    if (!name) return
    setSavingProject(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ name })
      .select()
      .single()
    if (!error && data) {
      const p = data as Project
      setProjects((prev) => [p, ...prev])
      setSelectedId(p.id)
      setNewProjectName('')
    }
    setSavingProject(false)
  }

  // ── Delete project ────────────────────────────────────────────
  async function handleDeleteProject(id: string) {
    if (!confirm('Delete this project and all its tasks?')) return
    await supabase.from('projects').delete().eq('id', id)
    const remaining = projects.filter((p) => p.id !== id)
    setProjects(remaining)
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? null)
  }

  // ── Add task ─────────────────────────────────────────────────
  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title || !selectedId) return
    setSavingTask(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: selectedId,
        title,
        notes: newNotes.trim() || null,
        status: 'Idea' as TaskStatus,
        priority: newPriority,
        due_date: newDueDate || null,
      })
      .select()
      .single()
    if (!error && data) {
      setTasks((prev) => [data as Task, ...prev])
      setNewTitle('')
      setNewNotes('')
      setNewPriority('Medium')
      setNewDueDate('')
    }
    setSavingTask(false)
  }

  // ── Cycle task status ─────────────────────────────────────────
  async function handleCycleStatus(task: Task) {
    const next = NEXT_STATUS[task.status]
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    )
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
  }

  // ── Cycle task priority ───────────────────────────────────────
  async function handleCyclePriority(task: Task) {
    const next = NEXT_PRIORITY[task.priority]
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, priority: next } : t)),
    )
    await supabase.from('tasks').update({ priority: next }).eq('id', task.id)
  }

  // ── Delete task ───────────────────────────────────────────────
  async function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  // ── Expand / edit task ────────────────────────────────────────
  function handleExpandTask(task: Task) {
    if (expandedTaskId === task.id) { setExpandedTaskId(null); return }
    setExpandedTaskId(task.id)
    setEditDraft({
      title: task.title,
      notes: task.notes ?? '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? '',
    })
  }

  async function handleSaveEdit(taskId: string) {
    const updates = {
      title: editDraft.title.trim(),
      notes: editDraft.notes.trim() || null,
      status: editDraft.status,
      priority: editDraft.priority,
      due_date: editDraft.due_date || null,
    }
    if (!updates.title) return
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    )
    setExpandedTaskId(null)
    await supabase.from('tasks').update(updates).eq('id', taskId)
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-gray-950 md:h-screen md:flex-row md:overflow-hidden">

      {/* Theme toggle */}
      <div className="absolute right-4 top-3.5 z-10">
        <ThemeToggle />
      </div>

      {/* ════════════════════ LEFT PANEL — Projects ════════════════════ */}
      <aside className="flex w-full flex-col border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 md:w-64 md:shrink-0 md:border-b-0 md:border-r md:overflow-hidden lg:w-72">

        {/* Title + add form */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Projects
          </p>
          <form onSubmit={handleAddProject} className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name…"
              disabled={savingProject}
              className="min-w-0 flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-gray-500 dark:focus:border-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={savingProject || !newProjectName.trim()}
              className="shrink-0 rounded bg-gray-900 dark:bg-gray-100 px-3 py-1.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>

        {/* Project list */}
        <ul className="flex-1 overflow-y-auto p-2">
          {loadingProjects ? (
            <li className="px-3 py-2 text-xs text-gray-400">Loading…</li>
          ) : projects.length === 0 ? (
            <li className="px-3 py-2 text-xs text-gray-400">No projects yet.</li>
          ) : (
            projects.map((project) => {
              const isActive = project.id === selectedId
              return (
                <li key={project.id}>
                  <button
                    onClick={() => setSelectedId(project.id)}
                    className={`group flex w-full items-center justify-between rounded px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="truncate text-sm font-medium">
                      {project.name}
                    </span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                      className={`ml-2 shrink-0 rounded p-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 ${
                        isActive
                          ? 'text-gray-500 dark:text-gray-400 hover:text-white dark:hover:text-gray-900'
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                      title="Delete project"
                    >
                      ✕
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </aside>

      {/* ═══════════════════ RIGHT PANEL — Tasks ═══════════════════════ */}
      <main className="flex flex-1 flex-col md:overflow-hidden">
        {selectedProject ? (
          <>
            {/* Project heading */}
            <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 pr-16">
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedProject.name}
              </h1>
              <p className="mt-0.5 text-xs text-gray-400">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Add-task form */}
            <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-6 py-4">
              <form onSubmit={handleAddTask} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title…"
                    disabled={savingTask}
                    className="min-w-0 flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-gray-500 dark:focus:border-gray-400 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={savingTask || !newTitle.trim()}
                    className="shrink-0 rounded bg-gray-900 dark:bg-gray-100 px-3 py-1.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add Task
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs text-gray-500 dark:text-gray-400">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    disabled={savingTask}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:outline-none disabled:opacity-50"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                  <label className="shrink-0 text-xs text-gray-500 dark:text-gray-400">Due</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    disabled={savingTask}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  disabled={savingTask}
                  className="resize-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-gray-500 dark:focus:border-gray-400 focus:outline-none disabled:opacity-50"
                />
              </form>
              {taskError && (
                <p className="mt-2 rounded bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  Error: {taskError}
                </p>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-2">
              <div className="flex flex-wrap gap-1">
                {(['All', ...STATUSES] as ('All' | TaskStatus)[]).map((s) => {
                  const count =
                    s === 'All'
                      ? tasks.length
                      : tasks.filter((t) => t.status === s).length
                  const isActive = filter === s
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {s}
                      <span
                        className={`ml-1 tabular-nums ${
                          isActive ? 'opacity-70' : 'opacity-40'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setSortByPriority((v) => !v)}
                title={sortByPriority ? 'Clear priority sort' : 'Sort by priority (High first)'}
                className={`ml-3 shrink-0 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortByPriority
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                ↑ Priority
              </button>
            </div>

            {/* Task list */}
            <ul className="flex-1 divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto">
              {loadingTasks ? (
                <li className="px-6 py-4 text-sm text-gray-400">Loading tasks…</li>
              ) : filteredTasks.length === 0 ? (
                <li className="px-6 py-6 text-sm text-gray-400">
                  {filter === 'All'
                    ? 'No tasks yet — add one above.'
                    : `No "${filter}" tasks.`}
                </li>
              ) : (
                filteredTasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id
                  const done = task.status === 'Done' || task.status === 'Archived'
                  const dueState = task.due_date ? (done ? 'future' : getDueDateState(task.due_date)) : null
                  return (
                    <li key={task.id} className="divide-y divide-gray-100 dark:divide-gray-800">

                      {/* ── Main row ── */}
                      <div
                        className="group flex cursor-pointer items-start gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return
                          handleExpandTask(task)
                        }}
                      >
                        {/* Text */}
                        <div className="flex-1 min-w-0 pt-px">
                          <p className="text-sm text-gray-900 dark:text-gray-100">{task.title}</p>
                          {task.notes && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{task.notes}</p>
                          )}
                        </div>

                        {/* Due date badge (display only) */}
                        {task.due_date && dueState && (
                          <span
                            className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              dueState === 'overdue'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : dueState === 'today'
                                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {dueState === 'overdue' && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                            )}
                            {dueState === 'today' ? 'Today' : formatDueDate(task.due_date)}
                            {dueState === 'overdue' && ' — overdue'}
                          </span>
                        )}

                        {/* Priority badge — click to cycle */}
                        <button
                          onClick={() => handleCyclePriority(task)}
                          title="Click to change priority"
                          className={`shrink-0 cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${PRIORITY_BADGE[task.priority]}`}
                        >
                          {task.priority}
                        </button>

                        {/* Status badge — click to cycle */}
                        <button
                          onClick={() => handleCycleStatus(task)}
                          title="Click to advance status"
                          className={`shrink-0 cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${STATUS_BADGE[task.status]}`}
                        >
                          {task.status}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                          className="shrink-0 pt-px text-gray-300 dark:text-gray-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                        >
                          ✕
                        </button>

                        {/* Expand chevron */}
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className={`mt-0.5 shrink-0 text-gray-300 dark:text-gray-600 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>

                      {/* ── Edit panel ── */}
                      {isExpanded && (
                        <div className="bg-gray-50 dark:bg-gray-900/60 px-6 py-4">
                          <div className="flex flex-col gap-3">
                            <input
                              type="text"
                              value={editDraft.title}
                              onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Escape') setExpandedTaskId(null) }}
                              autoFocus
                              placeholder="Title"
                              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                            />
                            <textarea
                              value={editDraft.notes}
                              onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                              placeholder="Notes…"
                              rows={3}
                              className="resize-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                            />
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Status</label>
                                <select
                                  value={editDraft.status}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value as TaskStatus }))}
                                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
                                >
                                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Priority</label>
                                <select
                                  value={editDraft.priority}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))}
                                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
                                >
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Due</label>
                                <input
                                  type="date"
                                  value={editDraft.due_date}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, due_date: e.target.value }))}
                                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
                                />
                                {editDraft.due_date && (
                                  <button
                                    onClick={() => setEditDraft((d) => ({ ...d, due_date: '' }))}
                                    title="Clear due date"
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >✕</button>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(task.id)}
                                disabled={!editDraft.title.trim()}
                                className="rounded bg-gray-900 dark:bg-gray-100 px-3 py-1.5 text-xs font-medium text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-white disabled:opacity-40"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setExpandedTaskId(null)}
                                className="rounded border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-gray-400">
              {loadingProjects
                ? 'Loading…'
                : projects.length === 0
                  ? 'Create a project to get started.'
                  : 'Select a project.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
