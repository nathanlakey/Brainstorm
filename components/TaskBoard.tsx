'use client'

import { useState, useTransition, useRef } from 'react'
import type { Task, TaskStatus } from '@/types'
import { createTask, updateTaskStatus, deleteTask } from '@/app/actions'

// ── Constants ─────────────────────────────────────────────────────
const STATUSES: TaskStatus[] = ['Idea', 'In Progress', 'Done', 'Archived']

const STATUS_STYLES: Record<
  TaskStatus,
  { badge: string; dot: string; selectBg: string }
> = {
  Idea: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    selectBg: 'bg-blue-500/10',
  },
  'In Progress': {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    selectBg: 'bg-amber-500/10',
  },
  Done: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
    selectBg: 'bg-emerald-500/10',
  },
  Archived: {
    badge: 'bg-zinc-700/30 text-zinc-500 border-zinc-600/20',
    dot: 'bg-zinc-500',
    selectBg: 'bg-zinc-700/30',
  },
}

// ── Props ─────────────────────────────────────────────────────────
type Props = {
  initialTasks: Task[]
  projectId: string
  projectName: string
}

// ── Component ─────────────────────────────────────────────────────
export default function TaskBoard({
  initialTasks,
  projectId,
  projectName,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<TaskStatus | 'All'>('All')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Create-form state
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [createError, setCreateError] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const filteredTasks =
    filter === 'All' ? tasks : tasks.filter((t) => t.status === filter)

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s).length }),
    {} as Record<TaskStatus, number>,
  )

  // ── Handlers ────────────────────────────────────────────────────

  const openCreateForm = () => {
    setShowCreateForm(true)
    setTimeout(() => titleInputRef.current?.focus(), 50)
  }

  const closeCreateForm = () => {
    setShowCreateForm(false)
    setNewTitle('')
    setNewNotes('')
    setCreateError('')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setCreateError('Title is required.')
      return
    }
    setCreateError('')

    startTransition(async () => {
      const result = await createTask(projectId, newTitle.trim(), newNotes.trim())
      if (result.error) {
        setCreateError(result.error)
      } else if (result.task) {
        setTasks((prev) => [result.task!, ...prev])
        closeCreateForm()
      }
    })
  }

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    )
    startTransition(async () => {
      await updateTaskStatus(taskId, status, projectId)
    })
  }

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    startTransition(async () => {
      await deleteTask(taskId, projectId)
    })
  }

  const toggleNotes = (taskId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-zinc-100">
            {projectName}
          </h1>
          <p className="text-sm text-zinc-500">
            {tasks.length === 0
              ? 'No tasks yet.'
              : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} · ${counts.Done} done`}
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex-shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          + Add Task
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-2xl border border-violet-500/30 bg-zinc-900 p-5"
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            New Task
          </p>
          <div className="space-y-3">
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title…"
              disabled={isPending}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
            />
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)…"
              rows={3}
              disabled={isPending}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
            />
            {createError && (
              <p className="text-xs text-red-400">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending || !newTitle.trim()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? 'Adding…' : 'Add Task'}
              </button>
              <button
                type="button"
                onClick={closeCreateForm}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(['All', ...STATUSES] as (TaskStatus | 'All')[]).map((s) => {
          const isActive = filter === s
          const count = s === 'All' ? tasks.length : counts[s as TaskStatus]
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {s}
              <span
                className={`ml-1.5 text-xs ${isActive ? 'opacity-80' : 'opacity-50'}`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-600">
            {filter === 'All'
              ? 'No tasks yet. Hit "+ Add Task" to get started!'
              : `No "${filter}" tasks.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredTasks.map((task) => {
            const styles = STATUS_STYLES[task.status]
            const notesExpanded = expandedNotes.has(task.id)

            return (
              <li
                key={task.id}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-all duration-150 hover:border-zinc-700"
              >
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${styles.dot}`}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-zinc-100">
                      {task.title}
                    </p>

                    {task.notes && (
                      <div className="mt-1">
                        <button
                          onClick={() => toggleNotes(task.id)}
                          className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
                        >
                          {notesExpanded ? '▲ Hide notes' : '▼ Show notes'}
                        </button>
                        {notesExpanded && (
                          <p className="mt-2 whitespace-pre-wrap border-l-2 border-zinc-700 pl-3 text-xs leading-relaxed text-zinc-400">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(
                          task.id,
                          e.target.value as TaskStatus,
                        )
                      }
                      className={`cursor-pointer appearance-none rounded-full border px-2.5 py-1 text-xs transition-colors ${styles.badge}`}
                      style={{ background: 'transparent' }}
                    >
                      {STATUSES.map((s) => (
                        <option
                          key={s}
                          value={s}
                          className="bg-zinc-900 text-zinc-100"
                        >
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDelete(task.id)}
                      title="Delete task"
                      className="rounded-lg p-1.5 text-zinc-700 opacity-0 transition-all hover:bg-red-400/10 hover:text-red-400 group-hover:opacity-100"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
