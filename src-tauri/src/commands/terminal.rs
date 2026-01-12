use std::sync::Arc;
use tauri::{command, State};

use crate::core::{AppState, TerminalInfo};

#[command]
pub fn create_terminal(
    state: State<'_, Arc<AppState>>,
    working_dir: String,
    cols: u16,
    rows: u16,
) -> Result<String, String> {
    state.terminal_manager.create_terminal(working_dir, cols, rows)
}

#[command]
pub fn write_terminal(
    state: State<'_, Arc<AppState>>,
    terminal_id: String,
    data: String,
) -> Result<(), String> {
    state.terminal_manager.write_to_terminal(&terminal_id, &data)
}

#[command]
pub fn resize_terminal(
    state: State<'_, Arc<AppState>>,
    terminal_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state.terminal_manager.resize_terminal(&terminal_id, cols, rows)
}

#[command]
pub fn kill_terminal(
    state: State<'_, Arc<AppState>>,
    terminal_id: String,
) -> Result<(), String> {
    state.terminal_manager.kill_terminal(&terminal_id)
}

#[command]
pub fn list_terminals(
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<TerminalInfo>, String> {
    Ok(state.terminal_manager.list_terminals())
}
