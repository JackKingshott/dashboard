'use client'

import { useEffect, useState } from 'react'

export function Greeting() {
  const [text, setText] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setText('Good morning')
    else if (h < 17) setText('Good afternoon')
    else setText('Good evening')
  }, [])

  if (!text) return null

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{text}, Jack 👋</h2>
      <p className="text-sm text-gray-500 mt-0.5">Here's what's happening at Scale Storm today.</p>
    </div>
  )
}
