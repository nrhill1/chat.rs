use std::collections::HashSet;

#[allow(dead_code)]
#[allow(unused_imports)]

use axum::{http::Method, routing::get};
use chrono;
use socketioxide::{
    extract::{Data, SocketRef},
    SocketIo,
};
use tower_http::cors::{Any, CorsLayer};
use uuid::{Uuid};


struct AppState {
    room_count: u64,
    active_rooms: Vec<Room>,
}

impl AppState {}

struct Room {
    id: Uuid,
    users: HashSet<u64>,
}

impl Room {}

struct Message {
    room_id: Uuid,
    time: chrono::DateTime<chrono::Utc>,
    user_id: u64,
    txt: String,
}

impl Message {}

struct User {
    id: Uuid
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (layer, io) = SocketIo::new_layer();

    // Register a handler for the default namespace
    io.ns("/", |s: SocketRef| {
        // For each "message" event received, send a "message-back" event with the "Hello World!" event
        s.on("message", |s: SocketRef| {
            s.emit("message-back", "Hello World!").ok();
        });
    });

    let cors = CorsLayer::new()
        // allow `GET` and `POST` when accessing the resource
        .allow_methods([Method::GET, Method::POST])
        // allow requests from any origin
        .allow_origin(Any);

    let app = axum::Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .layer(layer)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

