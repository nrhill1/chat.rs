"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Message from "./components/Message";

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);  const [message, setMessage] = useState<string>('');
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [currentRoom, setCurrentRoom] = useState<number>(1);
  const [connected, setConnected] = useState<boolean>(false);
  const [name, setName] = useState<string>('anon');
  const [socket, setSocket] = useState<Socket | null>(null);
  const onceRef = useRef(false);


  function renderMessages(messages: string[]) {
    return (
      <div className="rounded border-pink min-w-2 min-h-2 mb-1">
        {messages.map((message, index) => (
          <Message key={index} text={message} />
        ))}
      </div>
    );
  }

  useEffect(() => {
    setMessages([]);
    socket?.emit("join");
  }, [currentRoom]);


  useEffect(() => {
    if (onceRef.current) {
      return;
    }

    onceRef.current = true;

    const socket = io("ws://0.0.0.0:8080");
    setSocket(socket);


    socket?.on("connect", () => {
      console.log("Connected to socket server");
      setName(`anon-${socket.id}`);
      setConnected(true);
      console.log("joining room", currentRoom);

      socket?.emit("join", currentRoom);

      socket?.emit('auth', { token: '123' })
      console.log("socket ID: ", socket.id);
      setSocketId(socket.id);
    });

    socket?.on('authed', (data: string) => {
      console.log('auth success token: ', data);

    });

    socket?.on("message-back", (msg: string) => {
      console.log("Message received", msg);
      setMessages((messages) => [...messages, msg]);
    });

    socket?.on("messages", (msgs: string[]) => {
      console.log("Messages received", msgs);
      let messages = msgs.map((msg) => {
        return msg;
      });
      setMessages(messages);
    });
  }, []);



  return (

      <div className="bg-white grid container p-6 mx-auto rounded-xl max-w-120 shadow-lg items-center justify-center space-x-4 mt-2 ml-2 mr-2s">
        <p>Hello user{socketId}!</p>
        <div className="bg-gray-300 container py-2 px-4 max-w-120 rounded-sm text-center mb-2">{renderMessages(messages)}</div>
        <input
          className="bg-pink-200 hover:border-rose-700s ease-in-out duration-300 placeholder-pink-600 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded mb-2"
          onChange={(e) =>{setMessage(e.target.value)}}
          placeholder="Type a message"
        >


        </input>
        <button
          className="bg-pink-500 hover:bg-rose-700 ease-in-out duration-300 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded mb-2"
          onClick={() => socket?.emit("message", message)}
        >
          Send
        </button>
        <button
          className="bg-pink-500 hover:bg-rose-700 ease-in-out duration-300 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded"
          onClick={() => {
            socket?.emit("clear");
            setMessages([])}}
        >
            Clear
        </button>
      </div>

  )
};

