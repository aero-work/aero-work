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

/// Embedded web assets (compiled into binary)
#[cfg(all(feature = "websocket", not(target_os = "android")))]
#[derive(rust_embed::RustEmbed)]
#[folder = "../dist"]
struct WebAssets;

/// Headless mode - WebSocket server + Web client server (embedded), no GUI
#[cfg(all(feature = "websocket", not(target_os = "android")))]
pub fn run_headless() {
    use tokio::runtime::Runtime;
    use axum::{Router, routing::get};

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "aero_work=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let rt = Runtime::new().expect("Failed to create tokio runtime");
    rt.block_on(async {
        // Parse ports from args or env
        let ws_port: u16 = parse_arg_or_env("--ws-port", "AERO_WS_PORT", 9527);
        let web_port: u16 = parse_arg_or_env("--web-port", "AERO_WEB_PORT", 9521);

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
        let actual_ws_port = match ws_server.start(ws_port).await {
            Ok(port) => port,
            Err(e) => {
                eprintln!("Failed to start WebSocket server: {}", e);
                std::process::exit(1);
            }
        };

        // Start Web client server with embedded assets
        let app = Router::new()
            .route("/", get(serve_index))
            .route("/*path", get(serve_embedded_file));

        let (listener, actual_web_port) = match find_available_port(web_port).await {
            Ok(result) => result,
            Err(e) => {
                eprintln!("Failed to bind web server: {}", e);
                std::process::exit(1);
            }
        };

        tokio::spawn(async move {
            axum::serve(listener, app).await.ok();
        });

        // Print startup info
        println!();
        println!("╔════════════════════════════════════════════════════════╗");
        println!("║           Aero Work - Headless Mode                    ║");
        println!("╠════════════════════════════════════════════════════════╣");
        println!("║  Web Client:       http://0.0.0.0:{:<5}               ║", actual_web_port);
        println!("║  WebSocket Server: ws://0.0.0.0:{:<5}/ws              ║", actual_ws_port);
        println!("║                                                        ║");
        println!("║  Open the Web Client URL in your browser to start.    ║");
        println!("║                                                        ║");
        println!("║  Press Ctrl+C to stop                                  ║");
        println!("╚════════════════════════════════════════════════════════╝");
        println!();

        // Keep running until interrupted
        tokio::signal::ctrl_c().await.ok();
        println!("\nShutting down...");
    });
}

/// Serve index.html for root path
#[cfg(all(feature = "websocket", not(target_os = "android")))]
async fn serve_index() -> impl axum::response::IntoResponse {
    serve_file("index.html")
}

/// Serve embedded file or fallback to index.html for SPA routing
#[cfg(all(feature = "websocket", not(target_os = "android")))]
async fn serve_embedded_file(
    axum::extract::Path(path): axum::extract::Path<String>,
) -> impl axum::response::IntoResponse {
    // Try to serve the requested file
    let response = serve_file(&path);

    // If file not found and it's not a file with extension, serve index.html (SPA fallback)
    if response.status() == axum::http::StatusCode::NOT_FOUND && !path.contains('.') {
        return serve_file("index.html");
    }

    response
}

/// Serve a file from embedded assets
#[cfg(all(feature = "websocket", not(target_os = "android")))]
fn serve_file(path: &str) -> axum::response::Response {
    use axum::http::{header, StatusCode};
    use axum::response::IntoResponse;

    match WebAssets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            (
                StatusCode::OK,
                [(header::CONTENT_TYPE, mime.as_ref())],
                content.data.into_owned(),
            )
                .into_response()
        }
        None => (StatusCode::NOT_FOUND, "Not Found").into_response(),
    }
}

/// Parse command line argument or environment variable
#[cfg(all(feature = "websocket", not(target_os = "android")))]
fn parse_arg_or_env(arg_name: &str, env_name: &str, default: u16) -> u16 {
    std::env::args()
        .skip_while(|arg| arg != arg_name)
        .nth(1)
        .and_then(|p| p.parse().ok())
        .or_else(|| std::env::var(env_name).ok().and_then(|p| p.parse().ok()))
        .unwrap_or(default)
}

/// Find an available port, starting with preferred port and trying alternatives if occupied
#[cfg(all(feature = "websocket", not(target_os = "android")))]
async fn find_available_port(preferred_port: u16) -> Result<(tokio::net::TcpListener, u16), std::io::Error> {
    use std::net::SocketAddr;

    // Try the preferred port first
    let addr = SocketAddr::from(([0, 0, 0, 0], preferred_port));
    match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => return Ok((listener, preferred_port)),
        Err(e) => {
            tracing::warn!("Port {} is occupied: {}, trying alternative ports...", preferred_port, e);
        }
    }

    // Try a range of alternative ports
    for port in preferred_port.saturating_add(1)..=preferred_port.saturating_add(100) {
        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
            tracing::info!("Found available port: {}", port);
            return Ok((listener, port));
        }
    }

    // Let the OS choose an available port
    let addr = SocketAddr::from(([0, 0, 0, 0], 0));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let actual_port = listener.local_addr()?.port();
    tracing::info!("OS assigned port: {}", actual_port);
    Ok((listener, actual_port))
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
