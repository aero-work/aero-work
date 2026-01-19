#[cfg(not(target_os = "android"))]
use std::sync::Arc;

#[cfg(not(target_os = "android"))]
use tokio::sync::{mpsc, RwLock};

#[cfg(not(target_os = "android"))]
use crate::acp::{AcpClient, PermissionRequest, SessionId, SessionNotification};
#[cfg(not(target_os = "android"))]
use crate::core::session_registry::SessionRegistry;
#[cfg(not(target_os = "android"))]
use crate::core::session_state_manager::SessionStateManager;
#[cfg(not(target_os = "android"))]
use crate::core::terminal::{TerminalManager, TerminalOutput};

/// Notification for session activation changes
#[cfg(not(target_os = "android"))]
#[derive(Debug, Clone)]
pub struct SessionActivated {
    pub session_id: Option<SessionId>,
}

/// Desktop AppState - full featured with agent, terminal, sessions
#[cfg(not(target_os = "android"))]
pub struct AppState {
    pub client: Arc<RwLock<Option<AcpClient>>>,
    pub notification_tx: mpsc::Sender<SessionNotification>,
    pub notification_rx: Arc<parking_lot::RwLock<Option<mpsc::Receiver<SessionNotification>>>>,
    pub permission_tx: mpsc::Sender<PermissionRequest>,
    pub permission_rx: Arc<parking_lot::RwLock<Option<mpsc::Receiver<PermissionRequest>>>>,
    pub terminal_manager: Arc<TerminalManager>,
    pub terminal_output_rx: Arc<parking_lot::RwLock<Option<mpsc::Receiver<TerminalOutput>>>>,
    /// Session registry for managing session metadata across clients
    pub session_registry: Arc<SessionRegistry>,
    /// Session state manager - single source of truth for session data
    pub session_state_manager: Arc<SessionStateManager>,
    /// Current active session ID (shared across all clients)
    pub current_session_id: Arc<parking_lot::RwLock<Option<SessionId>>>,
    /// Channel for session activation notifications
    pub session_activated_tx: mpsc::Sender<SessionActivated>,
    pub session_activated_rx: Arc<parking_lot::RwLock<Option<mpsc::Receiver<SessionActivated>>>>,
    /// Actual WebSocket server port (may differ from configured port if it was occupied)
    pub ws_port: Arc<std::sync::atomic::AtomicU16>,
    /// Current pending permission request (for resending on client reconnect)
    pub pending_permission: Arc<parking_lot::RwLock<Option<PermissionRequest>>>,
}

#[cfg(not(target_os = "android"))]
impl AppState {
    pub fn new() -> Self {
        let (notification_tx, notification_rx) = mpsc::channel(100);
        let (permission_tx, permission_rx) = mpsc::channel(100);
        let (terminal_output_tx, terminal_output_rx) = mpsc::channel(100);
        let (session_activated_tx, session_activated_rx) = mpsc::channel(100);

        Self {
            client: Arc::new(RwLock::new(None)),
            notification_tx,
            notification_rx: Arc::new(parking_lot::RwLock::new(Some(notification_rx))),
            permission_tx,
            permission_rx: Arc::new(parking_lot::RwLock::new(Some(permission_rx))),
            terminal_manager: Arc::new(TerminalManager::new(terminal_output_tx)),
            terminal_output_rx: Arc::new(parking_lot::RwLock::new(Some(terminal_output_rx))),
            session_registry: Arc::new(SessionRegistry::new()),
            session_state_manager: Arc::new(SessionStateManager::new()),
            current_session_id: Arc::new(parking_lot::RwLock::new(None)),
            session_activated_tx,
            session_activated_rx: Arc::new(parking_lot::RwLock::new(Some(session_activated_rx))),
            ws_port: Arc::new(std::sync::atomic::AtomicU16::new(0)),
            pending_permission: Arc::new(parking_lot::RwLock::new(None)),
        }
    }

    /// Set the pending permission request
    pub fn set_pending_permission(&self, request: Option<PermissionRequest>) {
        let mut pending = self.pending_permission.write();
        *pending = request;
    }

    /// Get the pending permission request (clone)
    pub fn get_pending_permission(&self) -> Option<PermissionRequest> {
        self.pending_permission.read().clone()
    }

    /// Set the WebSocket server port
    pub fn set_ws_port(&self, port: u16) {
        self.ws_port.store(port, std::sync::atomic::Ordering::SeqCst);
    }

    /// Get the WebSocket server port
    pub fn get_ws_port(&self) -> u16 {
        self.ws_port.load(std::sync::atomic::Ordering::SeqCst)
    }

    /// Set the current active session and broadcast to all clients
    pub async fn set_current_session(&self, session_id: Option<SessionId>) {
        {
            let mut current = self.current_session_id.write();
            *current = session_id.clone();
        }
        // Broadcast to all connected clients
        let _ = self.session_activated_tx.send(SessionActivated { session_id }).await;
    }

    /// Get the current active session ID
    pub fn get_current_session(&self) -> Option<SessionId> {
        self.current_session_id.read().clone()
    }
}

#[cfg(not(target_os = "android"))]
impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Mobile AppState - minimal, just for WebView container
/// Mobile app connects to desktop server via WebSocket, no local agent
#[cfg(target_os = "android")]
pub struct AppState {
    // Placeholder for any mobile-specific state if needed in the future
    _private: (),
}

#[cfg(target_os = "android")]
impl AppState {
    pub fn new() -> Self {
        Self { _private: () }
    }
}

#[cfg(target_os = "android")]
impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
