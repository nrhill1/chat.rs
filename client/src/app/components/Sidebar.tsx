import React from 'react'
import { Socket } from 'socket.io-client'

interface SidebarProps {
  user: string | null
  currentRoom: string
  rooms: string[]
  setCurrentRoom: (room: string) => void
  socket: Socket | null
}

function Sidebar({ user, rooms, setCurrentRoom, socket }: SidebarProps) {
  return (
    <div>
      <div className="flex flex-col w-full max-w-[320px] h-20 leading-1.5 p-4 border-gray-200 bg-gray-700 rounded-xl animate-delay-200 mt-6 mb-6 ml-2">
        <p className="text-white">{user}</p>
      </div>
      <div className="flex flex-col w-full max-w-[320px] h-60 leading-1.5 p-4 border-gray-200 bg-gray-700 rounded-xl mt-6 mb-6 ml-2">
        <p className="text-white">Rooms</p>
        {rooms.map((room, index) => (
          <button className="bg-blue-500 hover:bg-indigo-700 transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded my-2 mx-1" key={index} onClick={() => setCurrentRoom(room)}>{room}</button>
        ))}
      </div>
    </div>
  )
}

export default Sidebar