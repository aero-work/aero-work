use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

use crate::acp::{AcpClient, PermissionRequest, SessionNotification};
use crate::core::terminal::{TerminalManager, TerminalOutput};

pub struct AppState {
    pub client: Arc<RwLock<Option<AcpClient>>>,
    pub notification_tx: mpsc::Sender<SessionNotification>,
    pub notification_rx: Arc<parking_lot::RwLock<Option<mpsc::Receiver<SessionNotification>>>>,
    pub permission_tx: mpsc::Sender<PermissionRequest>,
    pub permission_rx: Arc<parking_lot::RwLock<Option<mpsc::Receiver<PermissionRequest>>>>,
    pub terminal_manager: Arc<TerminalManager>,
    pub terminal_output_rx: Arc<parking_lot::RwLock<Option<mpsc::Receiver<TerminalOutput>>>>,
}

impl AppState {
    pub fn new() -> Self {
        let (notification_tx, notification_rx) = mpsc::channel(100);
        let (permission_tx, permission_rx) = mpsc::channel(100);
        let (terminal_output_tx, terminal_output_rx) = mpsc::channel(100);

        Self {
            client: Arc::new(RwLock::new(None)),
            notification_tx,
            notification_rx: Arc::new(parking_lot::RwLock::new(Some(notification_rx))),
            permission_tx,
            permission_rx: Arc::new(parking_lot::RwLock::new(Some(permission_rx))),
            terminal_manager: Arc::new(TerminalManager::new(terminal_output_tx)),
            terminal_output_rx: Arc::new(parking_lot::RwLock::new(Some(terminal_output_rx))),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
