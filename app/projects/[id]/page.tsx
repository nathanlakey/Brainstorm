import { supabase } from '@/lib/supabase'
import type { Project, Task } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TaskBoard from '@/components/TaskBoard'

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const [projectRes, tasksRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (projectRes.error || !projectRes.data) notFound()

  const project = projectRes.data as Project
  const tasks = (tasksRes.data ?? []) as Task[]

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Back
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="truncate font-semibold text-zinc-100">
            {project.name}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <TaskBoard
          initialTasks={tasks}
          projectId={project.id}
          projectName={project.name}
        />
      </main>
    </div>
  )
}
