// Desktop-only modules
#[cfg(not(target_os = "android"))]
pub mod acp;
#[cfg(not(target_os = "android"))]
pub mod commands;
#[cfg(all(feature = "websocket", not(target_os = "android")))]
pub mod server;

pub mod core;

use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

/// Check if running in headless environment (no display available)
#[cfg(not(target_os = "android"))]
pub fn is_headless() -> bool {
    // Check for --headless flag
    if std::env::args().any(|arg| arg == "--headless") {
        return true;
    }

    // On Linux, check DISPLAY and WAYLAND_DISPLAY
    #[cfg(target_os = "linux")]
    {
        let has_display = std::env::var("DISPLAY").is_ok() || std::env::var("WAYLAND_DISPLAY").is_ok();
        if !has_display {
            return true;
        }
    }

    false
}

use crate::core::AppState;

/// Headless mode - WebSocket server only, no GUI
#[cfg(all(feature = "websocket", not(target_os = "android")))]
pub fn run_headless() {
    use tokio::runtime::Runtime;

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "aero_work=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let rt = Runtime::new().expect("Failed to create tokio runtime");
    rt.block_on(async {
        // Parse port from args or env
        let port: u16 = std::env::args()
            .skip_while(|arg| arg != "--port")
            .nth(1)
            .and_then(|p| p.parse().ok())
            .or_else(|| std::env::var("AERO_WS_PORT").ok().and_then(|p| p.parse().ok()))
            .unwrap_or(9527);

        // Create app state
        let state = Arc::new(AppState::new());

        // Drain notification channels (forwarded via WebSocket broadcast)
        let notification_rx = state.notification_rx.write().take();
        if let Some(mut rx) = notification_rx {
            tokio::spawn(async move {
                while rx.recv().await.is_some() {}
            });
        }

        let permission_rx = state.permission_rx.write().take();
        if let Some(mut rx) = permission_rx {
            tokio::spawn(async move {
                while rx.recv().await.is_some() {}
            });
        }

        let terminal_rx = state.terminal_output_rx.write().take();
        if let Some(mut rx) = terminal_rx {
            tokio::spawn(async move {
                while rx.recv().await.is_some() {}
            });
        }

        // Start WebSocket server
        let ws_server = server::WebSocketServer::new(state);
        match ws_server.start(port).await {
            Ok(actual_port) => {
                // Print startup info in a clear format
                println!();
                println!("╔════════════════════════════════════════════════════╗");
                println!("║       Aero Work - Headless Mode                    ║");
                println!("╠════════════════════════════════════════════════════╣");
                println!("║  WebSocket Server: ws://0.0.0.0:{:<5}/ws           ║", actual_port);
                println!("║                                                    ║");
                println!("║  Connect from browser or mobile app using the      ║");
                println!("║  WebSocket URL above.                              ║");
                println!("║                                                    ║");
                println!("║  Press Ctrl+C to stop                              ║");
                println!("╚════════════════════════════════════════════════════╝");
                println!();

                // Keep running until interrupted
                tokio::signal::ctrl_c().await.ok();
                println!("\nShutting down...");
            }
            Err(e) => {
                eprintln!("Failed to start WebSocket server: {}", e);
                std::process::exit(1);
            }
        }
    });
}

/// Desktop entry point - full featured with agent, terminal, WebSocket server
#[cfg(not(target_os = "android"))]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::Manager;
    use crate::commands::{
        cancel_session, connect_agent, create_directory, create_file, create_session, delete_path,
        disconnect_agent, initialize_agent, list_directory, read_file, rename_path, respond_permission,
        send_prompt, set_session_mode, write_file,
        resume_session, fork_session, list_sessions, get_session_info,
        create_terminal, write_terminal, resize_terminal, kill_terminal, list_terminals,
    };

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "aero_work=debug,tauri=info".into()),
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
            // Session management
            resume_session,
            fork_session,
            list_sessions,
            get_session_info,
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
            // Start WebSocket server if enabled
            #[cfg(feature = "websocket")]
            {
                let ws_state = app.state::<Arc<AppState>>().inner().clone();
                let preferred_port = std::env::var("AERO_WS_PORT")
                    .ok()
                    .and_then(|p| p.parse().ok())
                    .unwrap_or(9527);

                tauri::async_runtime::spawn(async move {
                    let server = server::WebSocketServer::new(ws_state.clone());
                    match server.start(preferred_port).await {
                        Ok(actual_port) => {
                            ws_state.set_ws_port(actual_port);
                            tracing::info!("WebSocket server started on port {}", actual_port);
                        }
                        Err(e) => {
                            tracing::error!("WebSocket server error: {}", e);
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Mobile entry point - WebView only, connects to desktop server
#[cfg(target_os = "android")]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "aero_work=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let state = Arc::new(AppState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
