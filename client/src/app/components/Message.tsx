import React from 'react'

export default function Message({text, user}: {text: string, user: string}) {
  return (
    <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-white rounded-e-xl rounded-es-xl dark:bg-gray-700 mb-1">
      <p className="text-white">{text}</p>
      <p className="text-white">{user}</p>
    </div>
  )
}

