'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/utils'
import { localTasks, isUsingLocalStore } from '@/lib/local-store'
import type { Task, TaskPriority } from '@/types'

const priorityDot: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
}

export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (isUsingLocalStore()) {
      const pending = localTasks.list().filter(t => t.status !== 'done').slice(0, 5)
      setTasks(pending)
      return
    }
    fetch('/api/tasks')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setTasks(data.filter((t: Task) => t.status !== 'done').slice(0, 5))
      })
      .catch(() => {})
  }, [])

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
          <div className="space-y-1">
            {tasks.map(task => (
              <Link key={task.id} href="/todo">
                <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                  <div className="h-4 w-4 shrink-0 rounded border-2 border-gray-300 bg-white" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(task.due_date)}</p>
                    )}
                  </div>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
