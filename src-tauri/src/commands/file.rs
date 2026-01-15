use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

/// Expand ~ to home directory
fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(&path[2..]);
        }
    } else if path == "~" {
        if let Some(home) = dirs::home_dir() {
            return home;
        }
    }
    PathBuf::from(path)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_hidden: bool,
    pub size: Option<u64>,
    pub modified: Option<u64>,
}

// Re-export for WebSocket server
pub type DirEntry = FileEntry;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub language: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: Option<u64>,
    pub is_dir: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BinaryFileContent {
    pub path: String,
    pub content: String, // base64 encoded
    pub size: u64,
    pub modified: Option<u64>,
}

fn detect_language(path: &str) -> Option<String> {
    let ext = path.rsplit('.').next()?;
    let lang = match ext.to_lowercase().as_str() {
        "rs" => "rust",
        "ts" | "tsx" => "typescript",
        "js" | "jsx" => "javascript",
        "py" => "python",
        "go" => "go",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "cc" | "cxx" | "hpp" => "cpp",
        "cs" => "csharp",
        "rb" => "ruby",
        "php" => "php",
        "swift" => "swift",
        "kt" | "kts" => "kotlin",
        "scala" => "scala",
        "html" | "htm" => "html",
        "css" | "scss" | "sass" | "less" => "css",
        "json" => "json",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "xml" => "xml",
        "md" | "markdown" => "markdown",
        "sql" => "sql",
        "sh" | "bash" | "zsh" => "shell",
        "dockerfile" => "dockerfile",
        "graphql" | "gql" => "graphql",
        "vue" => "vue",
        "svelte" => "svelte",
        _ => return None,
    };
    Some(lang.to_string())
}

fn is_hidden(name: &str) -> bool {
    name.starts_with('.')
}

fn should_ignore(name: &str) -> bool {
    matches!(
        name,
        "node_modules"
            | "target"
            | "dist"
            | "build"
            | ".git"
            | ".svn"
            | "__pycache__"
            | ".DS_Store"
            | "Thumbs.db"
    )
}

#[command]
pub async fn list_directory(path: String, show_hidden: bool) -> Result<Vec<FileEntry>, String> {
    let dir_path = PathBuf::from(&path);

    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries = Vec::new();

    let read_dir = fs::read_dir(&dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().to_string();

        // Skip ignored directories
        if should_ignore(&name) {
            continue;
        }

        // Skip hidden files unless requested
        let hidden = is_hidden(&name);
        if hidden && !show_hidden {
            continue;
        }

        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let is_dir = metadata.is_dir();
        let size = if is_dir { None } else { Some(metadata.len()) };
        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        entries.push(FileEntry {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir,
            is_hidden: hidden,
            size,
            modified,
        });
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

#[command]
pub async fn read_file(path: String) -> Result<FileContent, String> {
    let file_path = PathBuf::from(&path);

    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }

    // Check file size (limit to 10MB)
    let metadata = fs::metadata(&file_path).map_err(|e| format!("Failed to read metadata: {}", e))?;
    if metadata.len() > 10 * 1024 * 1024 {
        return Err("File is too large (max 10MB)".to_string());
    }

    let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let language = detect_language(&path);

    Ok(FileContent {
        path,
        content,
        language,
    })
}

#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&file_path, &content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[command]
pub async fn create_file(path: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);

    if file_path.exists() {
        return Err(format!("File already exists: {}", path));
    }

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&file_path, "").map_err(|e| format!("Failed to create file: {}", e))?;

    Ok(())
}

#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    let dir_path = PathBuf::from(&path);

    if dir_path.exists() {
        return Err(format!("Directory already exists: {}", path));
    }

    fs::create_dir_all(&dir_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    Ok(())
}

#[command]
pub async fn delete_path(path: String) -> Result<(), String> {
    let target_path = PathBuf::from(&path);

    if !target_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    if target_path.is_dir() {
        fs::remove_dir_all(&target_path).map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&target_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

#[command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    rename_path_impl(&old_path, &new_path).await
}

// Implementation functions for reuse by WebSocket server

pub async fn list_directory_impl(path: &str) -> Result<Vec<FileEntry>, String> {
    let dir_path = PathBuf::from(path);

    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries = Vec::new();

    let read_dir = fs::read_dir(&dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().to_string();

        // Skip ignored directories
        if should_ignore(&name) {
            continue;
        }

        // Skip hidden files by default in impl
        let hidden = is_hidden(&name);

        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let is_dir = metadata.is_dir();
        let size = if is_dir { None } else { Some(metadata.len()) };
        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        entries.push(FileEntry {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir,
            is_hidden: hidden,
            size,
            modified,
        });
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

pub async fn read_file_impl(path: &str) -> Result<String, String> {
    let file_path = expand_tilde(path);

    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }

    // Check file size (limit to 10MB)
    let metadata = fs::metadata(&file_path).map_err(|e| format!("Failed to read metadata: {}", e))?;
    if metadata.len() > 10 * 1024 * 1024 {
        return Err("File is too large (max 10MB)".to_string());
    }

    fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))
}

pub async fn write_file_impl(path: &str, content: &str) -> Result<(), String> {
    let file_path = expand_tilde(path);

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&file_path, content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

// Write binary file from base64 encoded content
pub async fn write_file_binary_impl(path: &str, content: &str) -> Result<(), String> {
    let file_path = PathBuf::from(path);

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    // Decode base64 content
    let bytes = BASE64.decode(content).map_err(|e| format!("Failed to decode base64: {}", e))?;

    fs::write(&file_path, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

pub async fn create_file_impl(path: &str) -> Result<(), String> {
    let file_path = PathBuf::from(path);

    if file_path.exists() {
        return Err(format!("File already exists: {}", path));
    }

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&file_path, "").map_err(|e| format!("Failed to create file: {}", e))?;

    Ok(())
}

pub async fn create_directory_impl(path: &str) -> Result<(), String> {
    let dir_path = PathBuf::from(path);

    if dir_path.exists() {
        return Err(format!("Directory already exists: {}", path));
    }

    fs::create_dir_all(&dir_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    Ok(())
}

pub async fn delete_path_impl(path: &str) -> Result<(), String> {
    let target_path = PathBuf::from(path);

    if !target_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    if target_path.is_dir() {
        fs::remove_dir_all(&target_path).map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&target_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

pub async fn rename_path_impl(old_path: &str, new_path: &str) -> Result<(), String> {
    let old = PathBuf::from(old_path);
    let new = PathBuf::from(new_path);

    if !old.exists() {
        return Err(format!("Path does not exist: {}", old_path));
    }

    if new.exists() {
        return Err(format!("Target path already exists: {}", new_path));
    }

    fs::rename(&old, &new).map_err(|e| format!("Failed to rename: {}", e))?;

    Ok(())
}

// Get file info without reading content
pub async fn get_file_info_impl(path: &str) -> Result<FileInfo, String> {
    let file_path = PathBuf::from(path);

    if !file_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let metadata = fs::metadata(&file_path).map_err(|e| format!("Failed to read metadata: {}", e))?;

    let name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    Ok(FileInfo {
        path: path.to_string(),
        name,
        size: metadata.len(),
        modified,
        is_dir: metadata.is_dir(),
    })
}

// Read file as binary (base64 encoded)
pub async fn read_file_binary_impl(path: &str) -> Result<BinaryFileContent, String> {
    let file_path = PathBuf::from(path);

    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }

    let metadata = fs::metadata(&file_path).map_err(|e| format!("Failed to read metadata: {}", e))?;

    // Limit to 50MB for binary files
    if metadata.len() > 50 * 1024 * 1024 {
        return Err("File is too large (max 50MB)".to_string());
    }

    let bytes = fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;
    let content = BASE64.encode(&bytes);

    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    Ok(BinaryFileContent {
        path: path.to_string(),
        content,
        size: metadata.len(),
        modified,
    })
}
