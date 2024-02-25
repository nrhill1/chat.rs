"use client";

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Home() {

  const socket = io('ws://0.0.0.0:8080/');


  const [message, setMessage] = useState('');
  const [socketId, setSocketId] = useState('');
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('socket connected!');
    });

    setSocketId(socket.id?.toString() || '');

    socket.on('message-back', (data: any) => {
      console.log('message back: ', data);
      setMessage(data);
    });
  });


  return (
    <div className="grid container p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg items-center space-x-4 mt-2">
      {/* <p>Hello user{socketId}!</p> */}
      <p className="">{message}</p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => socket.send('message', 'Hello')}
      >
        Send
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setMessage('')}
      >
          Clear
      </button>
    </div>
  )

};

