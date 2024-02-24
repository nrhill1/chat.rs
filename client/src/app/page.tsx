"use client";

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Home() {

  const socket = io('ws://0.0.0.0:8080/');

  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('socket connected!');
    });

    socket.on('message-back', (data: any) => {
      console.log('message back: ', data);
      setMessage(data);
    });
  });


  return (
    <div>
      <h1>Home</h1>
      <p>{message}</p>
      <button onClick={() => socket.send('message', 'Hello')}>Send</button>
    </div>
  )

};

