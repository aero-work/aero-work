pub mod config;
pub mod state;

pub use config::{Config, ConfigManager, config_dir, data_dir, cache_dir};
pub use state::AppState;

// Desktop-only: session_state depends on acp types
#[cfg(not(target_os = "android"))]
pub mod session_state;
#[cfg(not(target_os = "android"))]
pub use session_state::{ChatItem, Message, MessageRole, SessionState, SessionStateUpdate};

// Desktop-only modules (require pty, websocket server, etc.)
#[cfg(not(target_os = "android"))]
pub mod agent;
#[cfg(not(target_os = "android"))]
pub mod model_config;
#[cfg(not(target_os = "android"))]
pub mod plugins;
#[cfg(not(target_os = "android"))]
pub mod session_registry;
#[cfg(not(target_os = "android"))]
pub mod session_state_manager;
#[cfg(not(target_os = "android"))]
pub mod terminal;

#[cfg(not(target_os = "android"))]
pub use agent::AgentManager;
#[cfg(not(target_os = "android"))]
pub use model_config::ModelConfig;
#[cfg(not(target_os = "android"))]
pub use plugins::{
    AddMarketplaceRequest, InstallPluginRequest, InstallPluginResponse,
    ListPluginsResponse, MarketplaceResponse, PluginManager, UninstallPluginResponse,
};
#[cfg(not(target_os = "android"))]
pub use session_registry::{ListSessionsResponse, SessionInfo, SessionRegistry, SessionStatus};
#[cfg(not(target_os = "android"))]
pub use session_state_manager::{ClientId, SessionStateManager, SharedSessionStateManager};
#[cfg(not(target_os = "android"))]
pub use state::SessionActivated;
#[cfg(not(target_os = "android"))]
pub use terminal::{TerminalInfo, TerminalManager, TerminalOutput};
