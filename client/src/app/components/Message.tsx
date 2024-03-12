import React from 'react'

export default function Message({text, user}: {text: string, user: string}) {
  return (
    <div className="rounded">
      <p>{text}</p>
      <p>{user}</p>
    </div>
  )
}

