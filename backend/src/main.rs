//* main.rs

#![feature(async_closure)]

use std::sync::Arc;

use axum::http::Method;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use socketioxide::{
    extract::{Data, SocketRef, State},
    socket::DisconnectReason,
    SocketIo,
};
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use tracing_subscriber::FmtSubscriber;

#[derive(Debug, Clone)]
struct App {
    rooms: DashMap<String, Room>,
}

impl App {
    pub fn with_names(names: Vec<&'static str>) -> Self {
        let rooms: DashMap<String, Room> = DashMap::new();
        for name in names.into_iter() {
            let room = Room::new();
            rooms.insert(name.to_string(), room);
        }

        App { rooms }
    }
}

type AppState = Arc<App>;

#[derive(Debug, Clone)]
struct Room {
    users: Vec<String>,
    messages: Vec<Message>,
}

impl Room {
    fn new() -> Self {
        Self {
            users: Vec::new(),
            messages: Vec::new(),
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

#[derive(Debug, Deserialize, Serialize, Clone)]
struct Message {
    text: String,
    user: String,
    room: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct Messages {
    messages: Vec<Message>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let room_names: Vec<&'static str> = vec!["general", "random", "rust"];

    let app = App::with_names(room_names);
    let app_state: AppState = Arc::new(app);

    let (socket_layer, io) = SocketIo::builder().with_state(app_state).build_layer();

    let cors = CorsLayer::new()
        // allow `GET` and `POST` when accessing the resource
        .allow_methods([Method::GET, Method::POST])
        // allow requests from any origin
        .allow_origin(Any);

    io.ns("/", on_connect);

    let app = axum::Router::new().layer(socket_layer).layer(cors);

    info!("Starting server");

    let listener = tokio::net::TcpListener::bind("0.0.0.0:5000").await.unwrap();

    axum::serve(listener, app).await.unwrap();

    Ok(())
}

fn on_connect(socket: SocketRef, Data(_data): Data<Value>) {
    info!("Socket.IO connected: {:?} {:?}", socket.ns(), socket.id);
    // Join event
    socket.on(
        "join",
        async move |socket: SocketRef, Data::<String>(room_name), state: State<AppState>| {
            info!("Socket.IO joined: {:?} {:?}", socket.id, room_name);
            let _ = socket.leave_all();
            let _ = socket.join(room_name.clone());

            state
                .clone()
                .rooms
                .get_mut(&room_name)
                .unwrap()
                .users
                .push(socket.id.to_string());

            info!(
                "Room users: {:?}",
                state.rooms.get(&room_name).unwrap().users
            );

            socket
                .within(room_name.clone())
                .emit("joined", socket.id)
                .ok();

            let prev_msgs = state
                .clone()
                .rooms
                .get(&room_name)
                .unwrap()
                .messages
                .clone();

            info!("Previous messages: {:?}", prev_msgs);

            socket
                .emit(
                    "messages",
                    Messages {
                        messages: prev_msgs,
                    },
                )
                .ok();
        },
    );

    // Authentication event
    socket.on("auth", |socket: SocketRef, Data::<AuthEvent>(data)| {
        info!("Socket.IO auth: {:?}", data);
        socket.emit("authed", data.token).ok();
    });

    // Typing event
    socket.on("typing", |socket: SocketRef, Data::<TypingEvent>(data)| {
        info!("Socket.IO typing: {:?}", data.user);
        socket.within(data.room).emit("typing", data.user).ok();
    });

    // Message event
    socket.on(
        "message",
        async move |socket: SocketRef, Data::<Message>(msg), state: State<AppState>| {
            info!("Received event: {:?}", msg);

            let response = Message {
                text: msg.text.clone(),
                user: msg.user.clone(),
                room: msg.room.clone(),
            };

            state
                .rooms
                .get_mut(&msg.room)
                .unwrap()
                .messages
                .push(response.clone());

            socket.within(msg.room).emit("message-back", response).ok();
        },
    );

    socket.on_disconnect(async move |socket: SocketRef, reason: DisconnectReason| {
        info!(
            "Socket {} on ns {} disconnected, reason: {:?}",
            socket.id,
            socket.ns(),
            reason
        );
    });
}
