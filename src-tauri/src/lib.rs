pub mod acp;
pub mod commands;
pub mod core;
#[cfg(feature = "websocket")]
pub mod server;

use std::sync::Arc;
use tauri::{Emitter, Manager};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::commands::{
    cancel_session, connect_agent, create_directory, create_file, create_session, delete_path,
    disconnect_agent, initialize_agent, list_directory, read_file, rename_path, respond_permission,
    send_prompt, set_session_mode, write_file,
    // Terminal commands
    create_terminal, write_terminal, resize_terminal, kill_terminal, list_terminals,
};
use crate::core::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "aero_code=debug,tauri=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let state = Arc::new(AppState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            connect_agent,
            disconnect_agent,
            initialize_agent,
            create_session,
            send_prompt,
            cancel_session,
            set_session_mode,
            respond_permission,
            // File operations
            list_directory,
            read_file,
            write_file,
            create_file,
            create_directory,
            delete_path,
            rename_path,
            // Terminal operations
            create_terminal,
            write_terminal,
            resize_terminal,
            kill_terminal,
            list_terminals,
        ])
        .setup(|app| {
            // Set up terminal output event emitter
            let state = app.state::<Arc<AppState>>();
            let terminal_output_rx = state.terminal_output_rx.clone();
            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let rx = terminal_output_rx.write().take();
                if let Some(mut rx) = rx {
                    while let Some(output) = rx.recv().await {
                        let _ = handle.emit("terminal:output", output);
                    }
                }
            });

            // Start WebSocket server if enabled
            #[cfg(feature = "websocket")]
            {
                let ws_state = app.state::<Arc<AppState>>().inner().clone();
                let port = std::env::var("AERO_WS_PORT")
                    .ok()
                    .and_then(|p| p.parse().ok())
                    .unwrap_or(8765);

                tauri::async_runtime::spawn(async move {
                    let server = server::WebSocketServer::new(ws_state);
                    if let Err(e) = server.start(port).await {
                        tracing::error!("WebSocket server error: {}", e);
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
