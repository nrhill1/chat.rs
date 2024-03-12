//* main.rs

#![feature(async_closure)]
#![allow(unused_imports)]
#![allow(unused_variables)]
#![allow(dead_code)]

use std::{
    collections::VecDeque,
    sync::{Arc, Mutex},
};

use axum::{http::Method, routing::get};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use socketioxide::{
    extract::{Data, SocketRef},
    socket::DisconnectReason,
    SocketIo,
};
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use tracing_subscriber::FmtSubscriber;

struct AppState {
    rooms: VecDeque<Room>,
}

struct Room {
    id: u32,
    name: String,
    users: Arc<Mutex<Vec<String>>>,
    messages: Arc<Mutex<VecDeque<Message>>>,
}

impl Room {
    fn new(id: u32, name: String) -> Self {
        Self {
            id,
            name,
            users: Arc::new(Mutex::new(Vec::new())),
            messages: Arc::new(Mutex::new(VecDeque::new())),
        }
    }
}

#[derive(Debug, Deserialize)]
struct AuthEvent {
    token: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct TypingEvent {
    user: String,
    room: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Message {
    text: String,
    user: String,
    room: String,
}

fn on_connect(socket: SocketRef, Data(data): Data<Value>) {
    info!("Socket.IO connected: {:?} {:?}", socket.ns(), socket.id);

    let room = Room::new(1, String::from("general"));

    socket.on(
        "join",
        async move |socket: SocketRef, Data::<String>(room_name)| {
            info!("Socket.IO joined: {:?} {:?}", socket.id, room_name);
            let _ = socket.leave_all();
            let _ = socket.join(room_name.clone());
            room.users
                .clone()
                .lock()
                .unwrap()
                .push(socket.id.to_string());
            info!("Users in room: {:?}", room.users.clone().lock().unwrap());
            socket.within(room.name).emit("joined", socket.id).ok();
        },
    );

    socket.on("clear", |socket: SocketRef| {
        info!("Socket.IO cleared: {:?}", socket.id);
        socket.emit("cleared", "Cleared").ok();
    });

    socket.on("auth", |socket: SocketRef, Data::<AuthEvent>(data)| {
        info!("Socket.IO auth: {:?}", data);
        socket.emit("authed", data.token).ok();
    });

    socket.on("typing", |socket: SocketRef, Data::<TypingEvent>(data)| {
        info!("Socket.IO typing: {:?}", data.user);
        socket.within(data.room).emit("typing", data.user).ok();
    });

    socket.on("message", |socket: SocketRef, Data::<Message>(msg)| {
        info!("Received event: {:?}", msg);
        let response = Message {
            text: msg.text.clone(),
            user: msg.user.clone(),
            room: msg.room.clone(),
        };
        socket.within(msg.room).emit("message-back", response).ok();
    });

    socket.on_disconnect(|socket: SocketRef, reason: DisconnectReason| async move {
        info!(
            "Socket {} on ns {} disconnected, reason: {:?}",
            socket.id,
            socket.ns(),
            reason
        );
    });
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let (layer, io) = SocketIo::new_layer();

    let cors = CorsLayer::new()
        // allow `GET` and `POST` when accessing the resource
        .allow_methods([Method::GET, Method::POST])
        // allow requests from any origin
        .allow_origin(Any);

    io.ns("/", on_connect);

    let app = axum::Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .layer(layer)
        .layer(cors);

    info!("Starting server");

    let listener = tokio::net::TcpListener::bind("0.0.0.0:5000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
