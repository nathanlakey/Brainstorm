'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus } from '@/types'

// ── Projects ─────────────────────────────────────────────────────

export async function createProject(
  name: string,
): Promise<{ error?: string }> {
  if (!name.trim()) return { error: 'Project name cannot be empty.' }

  const { error } = await supabase
    .from('projects')
    .insert({ name: name.trim() })

  if (error) return { error: error.message }

  revalidatePath('/')
  return {}
}

export async function deleteProject(
  id: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/')
  return {}
}

// ── Tasks ────────────────────────────────────────────────────────

export async function createTask(
  projectId: string,
  title: string,
  notes: string,
): Promise<{ task?: Task; error?: string }> {
  if (!title.trim()) return { error: 'Task title cannot be empty.' }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title: title.trim(),
      notes: notes.trim() || null,
      status: 'Idea',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return { task: data as Task }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  projectId: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return {}
}

export async function deleteTask(
  taskId: string,
  projectId: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return {}
}
