//! Model Provider Configuration
//!
//! Manages model provider settings stored in ~/.config/aerowork/models.json
//! and generates environment variables for the ACP agent process.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tracing::{info, warn};

use super::config::config_dir;

const CONFIG_FILE: &str = "models.json";

/// Main configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    pub active_provider: String,
    pub providers: Providers,
    #[serde(default)]
    pub custom_providers: Vec<CustomProvider>,
}

/// Built-in providers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Providers {
    pub default: DefaultProvider,
    pub anthropic: AnthropicProvider,
    pub bedrock: BedrockProvider,
    pub bigmodel: BigModelProvider,
    pub minimax: MiniMaxProvider,
    pub moonshot: MoonshotProvider,
}

/// Default provider - no additional environment variables
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefaultProvider {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub enabled: bool,
}

/// Anthropic provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnthropicProvider {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub enabled: bool,
    pub model: String,
    pub opus_model: String,
    pub sonnet_model: String,
    pub haiku_model: String,
    pub subagent_model: String,
    #[serde(default)]
    pub api_key: String,
    #[serde(default)]
    pub auth_token: String,
    #[serde(default)]
    pub base_url: String,
}

/// Amazon Bedrock provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BedrockProvider {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub enabled: bool,
    #[serde(default)]
    pub bearer_token: String,
    #[serde(default)]
    pub region: String,
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub opus_model: String,
    #[serde(default)]
    pub sonnet_model: String,
    #[serde(default)]
    pub haiku_model: String,
}

/// BigModel (Zhipu) provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BigModelProvider {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub enabled: bool,
    #[serde(default)]
    pub auth_token: String,
}

/// MiniMax provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MiniMaxProvider {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub enabled: bool,
    #[serde(default)]
    pub auth_token: String,
    #[serde(default)]
    pub model: String,
}

/// Moonshot AI (Kimi) provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoonshotProvider {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub enabled: bool,
    #[serde(default)]
    pub auth_token: String,
    #[serde(default)]
    pub model: String,
}

/// Custom provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomProvider {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub opus_model: String,
    #[serde(default)]
    pub sonnet_model: String,
    #[serde(default)]
    pub haiku_model: String,
    #[serde(default)]
    pub subagent_model: String,
    #[serde(default)]
    pub api_key: String,
    #[serde(default)]
    pub auth_token: String,
    #[serde(default)]
    pub base_url: String,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            active_provider: "default".to_string(),
            providers: Providers {
                default: DefaultProvider {
                    provider_type: "default".to_string(),
                    enabled: true,
                },
                anthropic: AnthropicProvider {
                    provider_type: "anthropic".to_string(),
                    enabled: true,
                    model: "claude-sonnet-4-5".to_string(),
                    opus_model: "claude-opus-4-5".to_string(),
                    sonnet_model: "claude-sonnet-4-5".to_string(),
                    haiku_model: "claude-haiku-4-5".to_string(),
                    subagent_model: "claude-sonnet-4-5".to_string(),
                    api_key: String::new(),
                    auth_token: String::new(),
                    base_url: String::new(),
                },
                bedrock: BedrockProvider {
                    provider_type: "bedrock".to_string(),
                    enabled: true,
                    bearer_token: String::new(),
                    region: "us-east-1".to_string(),
                    model: "global.anthropic.claude-sonnet-4-5-20250929-v1:0".to_string(),
                    opus_model: "global.anthropic.claude-opus-4-5-20251101-v1:0".to_string(),
                    sonnet_model: "global.anthropic.claude-sonnet-4-5-20250929-v1:0".to_string(),
                    haiku_model: "global.anthropic.claude-haiku-4-5-20251001-v1:0".to_string(),
                },
                bigmodel: BigModelProvider {
                    provider_type: "bigmodel".to_string(),
                    enabled: true,
                    auth_token: String::new(),
                },
                minimax: MiniMaxProvider {
                    provider_type: "minimax".to_string(),
                    enabled: true,
                    auth_token: String::new(),
                    model: "MiniMax-M2.1".to_string(),
                },
                moonshot: MoonshotProvider {
                    provider_type: "moonshot".to_string(),
                    enabled: true,
                    auth_token: String::new(),
                    model: "kimi-k2-thinking-turbo".to_string(),
                },
            },
            custom_providers: vec![],
        }
    }
}

impl ModelConfig {
    /// Get the config file path
    pub fn config_path() -> PathBuf {
        config_dir().join(CONFIG_FILE)
    }

    /// Load config from file, creating default if not exists
    pub fn load() -> Result<Self, String> {
        let path = Self::config_path();

        if !path.exists() {
            info!("Model config not found, creating default at {:?}", path);
            let config = Self::default();
            config.save()?;
            return Ok(config);
        }

        let content = std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read model config: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse model config: {}", e))
    }

    /// Save config to file
    pub fn save(&self) -> Result<(), String> {
        let path = Self::config_path();

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }

        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize model config: {}", e))?;

        std::fs::write(&path, content)
            .map_err(|e| format!("Failed to write model config: {}", e))?;

        info!("Saved model config to {:?}", path);
        Ok(())
    }

    /// Generate environment variables for the active provider
    pub fn get_env_vars(&self) -> HashMap<String, String> {
        let mut env = HashMap::new();

        // Always add these for all providers
        env.insert("API_TIMEOUT_MS".to_string(), "3000000".to_string());
        env.insert(
            "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC".to_string(),
            "1".to_string(),
        );

        // Add provider-specific env vars
        match self.active_provider.as_str() {
            "default" => {
                // No additional env vars
            }
            "anthropic" => {
                let p = &self.providers.anthropic;
                if !p.model.is_empty() {
                    env.insert("ANTHROPIC_MODEL".to_string(), p.model.clone());
                }
                if !p.opus_model.is_empty() {
                    env.insert("ANTHROPIC_DEFAULT_OPUS_MODEL".to_string(), p.opus_model.clone());
                }
                if !p.sonnet_model.is_empty() {
                    env.insert("ANTHROPIC_DEFAULT_SONNET_MODEL".to_string(), p.sonnet_model.clone());
                }
                if !p.haiku_model.is_empty() {
                    env.insert("ANTHROPIC_DEFAULT_HAIKU_MODEL".to_string(), p.haiku_model.clone());
                }
                if !p.subagent_model.is_empty() {
                    env.insert("CLAUDE_CODE_SUBAGENT_MODEL".to_string(), p.subagent_model.clone());
                }
                if !p.api_key.is_empty() {
                    env.insert("ANTHROPIC_API_KEY".to_string(), p.api_key.clone());
                }
                if !p.auth_token.is_empty() {
                    env.insert("ANTHROPIC_AUTH_TOKEN".to_string(), p.auth_token.clone());
                }
                if !p.base_url.is_empty() {
                    env.insert("ANTHROPIC_BASE_URL".to_string(), p.base_url.clone());
                }
            }
            "bedrock" => {
                let p = &self.providers.bedrock;
                env.insert("CLAUDE_CODE_USE_BEDROCK".to_string(), "1".to_string());
                if !p.bearer_token.is_empty() {
                    env.insert("AWS_BEARER_TOKEN_BEDROCK".to_string(), p.bearer_token.clone());
                }
                if !p.region.is_empty() {
                    env.insert("AWS_DEFAULT_REGION".to_string(), p.region.clone());
                    env.insert("AWS_REGION".to_string(), p.region.clone());
                }
                if !p.model.is_empty() {
                    env.insert("ANTHROPIC_MODEL".to_string(), p.model.clone());
                }
                if !p.opus_model.is_empty() {
                    env.insert("ANTHROPIC_DEFAULT_OPUS_MODEL".to_string(), p.opus_model.clone());
                }
                if !p.sonnet_model.is_empty() {
                    env.insert("ANTHROPIC_DEFAULT_SONNET_MODEL".to_string(), p.sonnet_model.clone());
                }
                if !p.haiku_model.is_empty() {
                    env.insert("ANTHROPIC_DEFAULT_HAIKU_MODEL".to_string(), p.haiku_model.clone());
                }
            }
            "bigmodel" => {
                let p = &self.providers.bigmodel;
                env.insert(
                    "ANTHROPIC_BASE_URL".to_string(),
                    "https://open.bigmodel.cn/api/anthropic".to_string(),
                );
                if !p.auth_token.is_empty() {
                    env.insert("ANTHROPIC_AUTH_TOKEN".to_string(), p.auth_token.clone());
                }
            }
            "minimax" => {
                let p = &self.providers.minimax;
                env.insert(
                    "ANTHROPIC_BASE_URL".to_string(),
                    "https://api.minimax.io/anthropic".to_string(),
                );
                let model = if p.model.is_empty() {
                    "MiniMax-M2.1".to_string()
                } else {
                    p.model.clone()
                };
                env.insert("ANTHROPIC_MODEL".to_string(), model.clone());
                env.insert("ANTHROPIC_SMALL_FAST_MODEL".to_string(), model.clone());
                env.insert("ANTHROPIC_DEFAULT_SONNET_MODEL".to_string(), model.clone());
                env.insert("ANTHROPIC_DEFAULT_OPUS_MODEL".to_string(), model.clone());
                env.insert("ANTHROPIC_DEFAULT_HAIKU_MODEL".to_string(), model.clone());
                env.insert("CLAUDE_CODE_SUBAGENT_MODEL".to_string(), model);
                if !p.auth_token.is_empty() {
                    env.insert("ANTHROPIC_AUTH_TOKEN".to_string(), p.auth_token.clone());
                }
            }
            "moonshot" => {
                let p = &self.providers.moonshot;
                env.insert(
                    "ANTHROPIC_BASE_URL".to_string(),
                    "https://api.moonshot.ai/anthropic".to_string(),
                );
                let model = if p.model.is_empty() {
                    "kimi-k2-thinking-turbo".to_string()
                } else {
                    p.model.clone()
                };
                env.insert("ANTHROPIC_MODEL".to_string(), model.clone());
                env.insert("ANTHROPIC_DEFAULT_OPUS_MODEL".to_string(), model.clone());
                env.insert("ANTHROPIC_DEFAULT_SONNET_MODEL".to_string(), model.clone());
                env.insert("ANTHROPIC_DEFAULT_HAIKU_MODEL".to_string(), model.clone());
                env.insert("CLAUDE_CODE_SUBAGENT_MODEL".to_string(), model);
                if !p.auth_token.is_empty() {
                    env.insert("ANTHROPIC_AUTH_TOKEN".to_string(), p.auth_token.clone());
                }
            }
            custom_id => {
                // Look for custom provider
                if let Some(p) = self.custom_providers.iter().find(|p| p.id == custom_id) {
                    if !p.model.is_empty() {
                        env.insert("ANTHROPIC_MODEL".to_string(), p.model.clone());
                    }
                    if !p.opus_model.is_empty() {
                        env.insert("ANTHROPIC_DEFAULT_OPUS_MODEL".to_string(), p.opus_model.clone());
                    }
                    if !p.sonnet_model.is_empty() {
                        env.insert("ANTHROPIC_DEFAULT_SONNET_MODEL".to_string(), p.sonnet_model.clone());
                    }
                    if !p.haiku_model.is_empty() {
                        env.insert("ANTHROPIC_DEFAULT_HAIKU_MODEL".to_string(), p.haiku_model.clone());
                    }
                    if !p.subagent_model.is_empty() {
                        env.insert("CLAUDE_CODE_SUBAGENT_MODEL".to_string(), p.subagent_model.clone());
                    }
                    if !p.api_key.is_empty() {
                        env.insert("ANTHROPIC_API_KEY".to_string(), p.api_key.clone());
                    }
                    if !p.auth_token.is_empty() {
                        env.insert("ANTHROPIC_AUTH_TOKEN".to_string(), p.auth_token.clone());
                    }
                    if !p.base_url.is_empty() {
                        env.insert("ANTHROPIC_BASE_URL".to_string(), p.base_url.clone());
                    }
                } else {
                    warn!("Unknown provider: {}, using default", custom_id);
                }
            }
        }

        env
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = ModelConfig::default();
        assert_eq!(config.active_provider, "default");
        assert!(config.providers.default.enabled);
    }

    #[test]
    fn test_env_vars_default() {
        let config = ModelConfig::default();
        let env = config.get_env_vars();
        assert_eq!(env.get("API_TIMEOUT_MS"), Some(&"3000000".to_string()));
        assert_eq!(
            env.get("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"),
            Some(&"1".to_string())
        );
        // Default provider should not add extra vars
        assert!(env.get("ANTHROPIC_MODEL").is_none());
    }

    #[test]
    fn test_env_vars_anthropic() {
        let mut config = ModelConfig::default();
        config.active_provider = "anthropic".to_string();
        config.providers.anthropic.model = "claude-opus-4-5".to_string();
        config.providers.anthropic.api_key = "test-key".to_string();

        let env = config.get_env_vars();
        assert_eq!(env.get("ANTHROPIC_MODEL"), Some(&"claude-opus-4-5".to_string()));
        assert_eq!(env.get("ANTHROPIC_API_KEY"), Some(&"test-key".to_string()));
    }

    #[test]
    fn test_env_vars_bedrock() {
        let mut config = ModelConfig::default();
        config.active_provider = "bedrock".to_string();
        config.providers.bedrock.region = "us-west-2".to_string();

        let env = config.get_env_vars();
        assert_eq!(env.get("CLAUDE_CODE_USE_BEDROCK"), Some(&"1".to_string()));
        assert_eq!(env.get("AWS_DEFAULT_REGION"), Some(&"us-west-2".to_string()));
        assert_eq!(env.get("AWS_REGION"), Some(&"us-west-2".to_string()));
    }

    #[test]
    fn test_env_vars_minimax() {
        let mut config = ModelConfig::default();
        config.active_provider = "minimax".to_string();

        let env = config.get_env_vars();
        assert_eq!(
            env.get("ANTHROPIC_BASE_URL"),
            Some(&"https://api.minimax.io/anthropic".to_string())
        );
        assert_eq!(env.get("ANTHROPIC_MODEL"), Some(&"MiniMax-M2.1".to_string()));
    }
}
