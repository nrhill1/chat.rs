"use client";

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';


export default function ChatRoom() {
  const socket: Socket = io('ws://0.0.0.0:8080/');

  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [socketId, setSocketId] = useState<string>('');
  let user = 1;


  function renderMessages(messages: string[]) {
    return (
      <div className="rounded border-white min-w-2 min-h-2 mb-1">
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    );
  }


  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('socket connected!');
      socket.emit('auth', { token: '123' });
    });

    socket.on('auth', () => {
      console.log('authenticated!');
    });

    setSocketId(socket.id?.toString() || '');

    socket.on('message-back', (data: any) => {
      console.log('message back: ', data);
      setTimeout(() => {
        setMessages((messages) => [...messages, data]);
      }, 1000);
    });
  });


  return (
    <div className="bg-white grid container p-6 mx-auto rounded-xl max-w-120 shadow-lg items-center justify-center space-x-4 mt-2 ml-2 mr-2s">
      {/* <p>Hello user{socketId}!</p> */}
      <div className="bg-gray-300 container py-2 px-4 max-w-120 rounded-sm text-center mb-2">{renderMessages(messages)}</div>
      <input
        className="bg-pink-200 hover:border-rose-700s ease-in-out duration-300 placeholder-pink-600 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded mb-2"
        onChange={(e) =>{setMessage(e.target.value)}}
        placeholder="Type a message"
      >

      </input>
      <button
        className="bg-pink-500 hover:bg-rose-700 ease-in-out duration-300 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded mb-2"
        onClick={() => socket.send(message)}
      >
        Send
      </button>
      <button
        className="bg-pink-500 hover:bg-rose-700 ease-in-out duration-300 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded"
        onClick={() => setMessages([])}
      >
          Clear
      </button>
    </div>
  )
}