"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Message from "./components/Message";
import {IMessage} from "../types";


export default function Home() {

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [currentRoom, setCurrentRoom] = useState<string>("general");
  const [connected, setConnected] = useState<boolean>(false);
  const [user, setUser] = useState<string>('anon');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userTyping, setUserTyping] = useState<string>('');

  const onceRef = useRef(false);
  const typeRef = useRef(false);


  function renderMessages(messages: IMessage[]) {
    return (
      <div className="rounded border-pink min-w-2 min-h-2 mb-1">
        {messages.map((message, index) => (
          <Message key={index} text={message.text} user={message.user} />
        ))}
      </div>
    );
  }

  function handleTyping() {
    socket?.emit("typing", user, currentRoom);
  }

  function handleMessage() {
    socket?.emit("message", message, user, currentRoom);
  }

  useEffect(() => {
    setMessages([]);
    socket?.emit("join", currentRoom);
  }, [currentRoom]);


  useEffect(() => {
    if (onceRef.current) {
      return;
    }

    onceRef.current = true;

    const socket = io("ws://0.0.0.0:5000");
    setSocket(socket);

    socket?.on("connect", () => {
      console.log("Connected to socket server");
      setUser(`anon-${socket.id}`);
      setConnected(true);
      console.log("joining room", currentRoom);

      socket?.emit("join", currentRoom);

      // Send auth token
      socket?.emit('auth', { token: '123' });
      console.log("socket ID: ", socket.id);
      setSocketId(socket.id);
    });

    // Handle returned auth token
    socket?.on('authed', (data: string) => {
      console.log('auth success token: ', data);
    });

    // Handle new user joining
    socket.on("joined", (user: string) => {
      console.log("joined room", user);
    });

    // Handle message back
    socket?.on("message-back", (msg: IMessage) => {
      console.log("Message received", { msg });
      setMessages((messages) => [...messages, msg]);
    });

    // Handle typing event from other users
    socket?.on("typing", (user_typing: string) => {
      console.log(user + " is typing");
      if (user_typing === user || user_typing === 'anon') {
        typeRef.current = false;
        return;
      }
      typeRef.current = true;
      setUserTyping(user_typing);
      setTimeout(() => {
        typeRef.current = false;
        setUserTyping('');
      }, 2000);
    });
  }, [socket]);

  return (
    <div className="bg-white grid container p-6 mx-auto rounded-xl max-w-120 shadow-lg items-center justify-center space-x-4 mt-2 ml-2 mr-2s">
      <p className="text-center">Hello anon-{socketId}!</p>

      <div className="bg-gray-300 container py-2 px-4 max-w-120 rounded-sm text-center mb-2">
        {renderMessages(messages)}
      </div>
      { typeRef.current &&
        <p className="text-center">{userTyping} is typing...</p>
      }
      <input
        className="bg-pink-200 hover:border-rose-700s ease-in-out duration-300 placeholder-pink-600 md:focus:border-white md:placeholder-opacity-50 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded mb-2"
        onChange={(e) =>{setMessage(e.target.value)}}
        onFocus = {(e) => {handleTyping()}}
        placeholder="Type a message"
      >

      </input>
      <button
        className="bg-pink-500 hover:bg-rose-700 transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded mb-4"
        onClick={handleMessage}
      >
        Send
      </button>
      <button
        className="bg-pink-500 hover:bg-rose-700 transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 text-white font-bold py-2 px-4 min-w-24 max-w-48 text-center rounded"
        onClick={() => {
          socket?.emit("clear");
          setMessages([])}}
      >
          Clear
      </button>
    </div>
  )
};

