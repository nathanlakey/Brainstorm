'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProject } from '@/app/actions'

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this project and all its tasks?')) return

    startTransition(async () => {
      await deleteProject(projectId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Delete project"
      className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-zinc-600 opacity-0 transition-all hover:bg-red-400/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-30"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}
