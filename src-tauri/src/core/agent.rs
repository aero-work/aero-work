use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tracing::info;

use crate::acp::{
    AcpClient, AcpError, InitializeResponse, NewSessionResponse, PermissionOutcome,
    PermissionRequest, PromptResponse, SessionNotification,
};

pub struct AgentManager {
    client: Arc<RwLock<Option<AcpClient>>>,
}

impl AgentManager {
    pub fn new(client: Arc<RwLock<Option<AcpClient>>>) -> Self {
        Self { client }
    }

    /// Connect is now a no-op - ACP agent is started lazily when creating/resuming sessions
    pub async fn connect(
        &self,
        _notification_tx: mpsc::Sender<SessionNotification>,
        _permission_tx: mpsc::Sender<PermissionRequest>,
    ) -> Result<(), AcpError> {
        // ACP agent is started lazily when needed (create_session/resume_session)
        // See ensure_agent_connected() in websocket.rs
        Ok(())
    }

    pub async fn disconnect(&self) -> Result<(), AcpError> {
        let client = {
            let mut guard = self.client.write().await;
            guard.take()
        };

        if let Some(mut c) = client {
            c.disconnect().await?;
        }
        info!("Disconnected from ACP agent");
        Ok(())
    }

    pub async fn is_connected(&self) -> bool {
        let guard = self.client.read().await;
        guard.as_ref().map(|c| c.is_connected()).unwrap_or(false)
    }

    pub async fn initialize(&self) -> Result<InitializeResponse, AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.initialize().await
    }

    pub async fn create_session(&self, cwd: &str) -> Result<NewSessionResponse, AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.create_session(cwd).await
    }

    /// Resume an existing session
    pub async fn resume_session(
        &self,
        session_id: &str,
        cwd: &str,
    ) -> Result<NewSessionResponse, AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.resume_session(session_id, cwd).await
    }

    /// Fork an existing session
    pub async fn fork_session(
        &self,
        session_id: &str,
        cwd: &str,
    ) -> Result<NewSessionResponse, AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.fork_session(session_id, cwd).await
    }

    pub async fn prompt(&self, session_id: &str, content: &str) -> Result<PromptResponse, AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.prompt(session_id, content).await
    }

    pub async fn cancel(&self, session_id: &str) -> Result<(), AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.cancel(session_id).await
    }

    pub async fn set_session_mode(&self, session_id: &str, mode_id: &str) -> Result<(), AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.set_session_mode(session_id, mode_id).await
    }

    pub async fn respond_permission(
        &self,
        request_id: serde_json::Value,
        outcome: PermissionOutcome,
    ) -> Result<(), AcpError> {
        let guard = self.client.read().await;
        let client = guard.as_ref().ok_or(AcpError::NotConnected)?;
        client.respond_permission(request_id, outcome).await
    }
}
