//* main.rs
#![allow(unused_imports)]
#![allow(unused_variables)]
#![allow(dead_code)]

use std::sync::{Arc, Mutex};

use axum::{http::Method, routing::get};
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
    rooms: Vec<Room>,
}

struct Room {
    id: String,
    name: String,
    users: Vec<String>,
    messages: Arc<Mutex<MessageStore>>,
}

impl Room {
    fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            users: Vec::new(),
            messages: Arc::new(Mutex::new(MessageStore {
                messages: Vec::new(),
            })),
        }
    }
}

#[derive(Debug, serde::Deserialize)]
struct AuthEvent {
    token: String,
}

struct Message {
    user: String,
    message: String,
}

struct MessageStore {
    messages: Vec<Message>,
}

fn on_connect(socket: SocketRef, Data(data): Data<Value>) {
    info!("Socket.IO connected: {:?} {:?}", socket.ns(), socket.id);

    socket.on("clear", |socket: SocketRef| {
        info!("Socket.IO cleared: {:?}", socket.id);
        socket.emit("cleared", "Cleared").ok();
    });

    socket.on("auth", |socket: SocketRef, Data::<AuthEvent>(data)| {
        info!("Socket.IO auth: {:?}", data);
        socket.emit("authed", data.token).ok();
    });

    socket.on_disconnect(|socket: SocketRef, reason: DisconnectReason| async move {
        info!(
            "Socket {} on ns {} disconnected, reason: {:?}",
            socket.id,
            socket.ns(),
            reason
        );
    });

    socket.on("message", |socket: SocketRef, Data::<Value>(data)| {
        info!("Received event: {:?}", data);
        socket.emit("message-back", data).ok();
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

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
