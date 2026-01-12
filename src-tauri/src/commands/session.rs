use std::sync::Arc;
use tauri::State;
use tracing::{error, info};

use crate::acp::{AcpError, NewSessionResponse, PromptResponse};
use crate::core::{AgentManager, AppState};

#[tauri::command]
pub async fn create_session(
    state: State<'_, Arc<AppState>>,
    cwd: String,
) -> Result<NewSessionResponse, String> {
    info!("Creating new session in {}", cwd);

    let manager = AgentManager::new(state.client.clone());

    let response = manager.create_session(&cwd).await.map_err(|e: AcpError| {
        error!("Failed to create session: {}", e);
        e.to_string()
    })?;

    info!("Created session: {}", response.session_id);
    Ok(response)
}

#[tauri::command]
pub async fn send_prompt(
    state: State<'_, Arc<AppState>>,
    session_id: String,
    content: String,
) -> Result<PromptResponse, String> {
    info!("Sending prompt to session {}", session_id);

    let manager = AgentManager::new(state.client.clone());

    let response = manager.prompt(&session_id, &content).await.map_err(|e: AcpError| {
        error!("Failed to send prompt: {}", e);
        e.to_string()
    })?;

    info!("Prompt completed with stop_reason: {:?}", response.stop_reason);
    Ok(response)
}

#[tauri::command]
pub async fn cancel_session(
    state: State<'_, Arc<AppState>>,
    session_id: String,
) -> Result<(), String> {
    info!("Cancelling session {}", session_id);

    let manager = AgentManager::new(state.client.clone());

    manager.cancel(&session_id).await.map_err(|e: AcpError| {
        error!("Failed to cancel session: {}", e);
        e.to_string()
    })?;

    info!("Session {} cancelled", session_id);
    Ok(())
}

#[tauri::command]
pub async fn set_session_mode(
    state: State<'_, Arc<AppState>>,
    session_id: String,
    mode_id: String,
) -> Result<(), String> {
    info!("Setting session {} mode to {}", session_id, mode_id);

    let manager = AgentManager::new(state.client.clone());

    manager
        .set_session_mode(&session_id, &mode_id)
        .await
        .map_err(|e: AcpError| {
            error!("Failed to set session mode: {}", e);
            e.to_string()
        })?;

    info!("Session {} mode set to {}", session_id, mode_id);
    Ok(())
}
