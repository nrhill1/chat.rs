import React from 'react'

export default function Message({text}: {text: string}) {
  return (
    <div className="rounded border-black min-w-2 min-h-2 mb-1">
      <p>{text}</p>
    </div>
  )
}

