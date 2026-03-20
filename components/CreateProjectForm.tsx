'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/app/actions'

export default function CreateProjectForm() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a project name.')
      return
    }

    setError('')
    startTransition(async () => {
      const result = await createProject(trimmed)
      if (result.error) {
        setError(result.error)
      } else {
        setName('')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. App Ideas, Books to Read, Travel Plans…"
        disabled={isPending}
        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? 'Creating…' : 'Create Project'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  )
}
