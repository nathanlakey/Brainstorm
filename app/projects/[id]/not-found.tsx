import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
      <h1 className="text-2xl font-bold text-zinc-100">Project not found</h1>
      <Link
        href="/"
        className="text-sm text-violet-400 transition-colors hover:text-violet-300"
      >
        ← Back to Projects
      </Link>
    </div>
  )
}
