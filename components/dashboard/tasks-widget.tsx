import Link from 'next/link'
import { ArrowRight, CheckSquare, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Task, TaskPriority } from '@/types'

const priorityDot: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
}

const priorityLabel: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

async function fetchTasks(): Promise<Task[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(5)
    if (error) return []
    return (data ?? []) as Task[]
  } catch {
    return []
  }
}

export default async function TasksWidget() {
  const tasks = await fetchTasks()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Tasks</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/todo" className="text-xs text-blue-600 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="rounded-full bg-green-50 p-3">
              <CheckSquare className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">All caught up!</p>
              <p className="text-xs text-gray-500 mt-1">No pending tasks</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/todo">Add a task</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="h-4 w-4 shrink-0 rounded border-2 border-gray-300 bg-white" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(task.due_date)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`}
                    title={priorityLabel[task.priority]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
