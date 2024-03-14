import React from 'react'

export default function Message({text, user}: {text: string, user: string}) {
  return (
    <div className="flex flex-col w-full max-w-[320px] h-20 leading-1.5 p-4 border-gray-200 bg-white rounded-e-xl rounded-es-xl dark:bg-gray-700 animate-jump-in animate-delay-200 animate-once mt-6 mb-6">
      <p className="text-white">{text}</p>
      <p className="text-white">{user}</p>
    </div>
  )
}

