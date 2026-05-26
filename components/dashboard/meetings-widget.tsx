'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { localMeetings } from '@/lib/local-store'
import type { Meeting } from '@/types'

export function MeetingsWidget() {
  const [meetings, setMeetings] = useState<Meeting[]>([])

  useEffect(() => {
    setMeetings(localMeetings.upcoming().slice(0, 4))
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Upcoming Meetings</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/meetings" className="text-xs text-blue-600 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="rounded-full bg-blue-50 p-3">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">No upcoming meetings</p>
              <p className="text-xs text-gray-500 mt-1">Schedule a meeting to see it here</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/meetings">Schedule meeting</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.map(m => {
              const isToday = m.date === new Date().toISOString().split('T')[0]
              return (
                <Link key={m.id} href="/meetings">
                  <div className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`mt-0.5 rounded-lg p-1.5 shrink-0 ${isToday ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Calendar className={`h-3.5 w-3.5 ${isToday ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {isToday ? 'Today' : formatDate(m.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' '}· {m.start_time}–{m.end_time}
                      </p>
                      {m.client && (
                        <p className="text-xs text-gray-400 truncate">{m.client.name}</p>
                      )}
                    </div>
                    {isToday && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Today</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
