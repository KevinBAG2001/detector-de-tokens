use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, RunEvent,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenBreakdown {
    pub prompt: u64,
    pub output: u64,
    pub cached: u64,
    pub thinking: u64,
    pub total_accumulated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaSnapshot {
    pub estado: String,
    pub reset_at: Option<String>,
    pub source_file: Option<String>,
    pub detected_at: Option<String>,
}

impl Default for QuotaSnapshot {
    fn default() -> Self {
        Self {
            estado: "desconocido".to_string(),
            reset_at: None,
            source_file: None,
            detected_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AntigravitySnapshot {
    pub source: String,
    pub available: bool,
    pub session_id: Option<String>,
    pub tokens: TokenBreakdown,
    #[serde(default)]
    pub quota: QuotaSnapshot,
    pub message: Option<String>,
}

const SNAPSHOT_SCRIPT: &str = "dist/cli/snapshot.js";

/// Rust `canonicalize()` en Windows devuelve rutas `\\?\` que Node 22+ rompe (EISDIR en `C:\`).
fn normalize_path_for_subprocess(path: PathBuf) -> PathBuf {
    let text = path.to_string_lossy();
    #[cfg(windows)]
    {
        const VERBATIM: &str = r"\\?\";
        if let Some(rest) = text.strip_prefix(VERBATIM) {
            const UNC: &str = "UNC\\";
            if let Some(unc) = rest.strip_prefix(UNC) {
                return PathBuf::from(format!(r"\\{unc}"));
            }
            return PathBuf::from(rest);
        }
    }
    path
}

fn workspace_root() -> PathBuf {
    let manifest_relative = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let resolved = manifest_relative
        .canonicalize()
        .unwrap_or(manifest_relative);
    normalize_path_for_subprocess(resolved)
}

fn local_ingest_package_dir() -> PathBuf {
    normalize_path_for_subprocess(workspace_root().join("packages/local-ingest"))
}

#[cfg(windows)]
fn is_bare_windows_drive(segment: &str) -> bool {
    let trimmed = segment.trim();
    let bytes = trimmed.as_bytes();
    if bytes.len() == 2 && bytes[1] == b':' && bytes[0].is_ascii_alphabetic() {
        return true;
    }
    let no_trailing = trimmed.trim_end_matches('\\').trim_end_matches('/');
    let bytes = no_trailing.as_bytes();
    bytes.len() == 2 && bytes[1] == b':' && bytes[0].is_ascii_alphabetic()
}

#[cfg(windows)]
fn sanitize_windows_path_list(raw: &str) -> String {
    raw.split(';')
        .filter_map(|segment| {
            let trimmed = segment.trim();
            if trimmed.is_empty() || is_bare_windows_drive(trimmed) {
                return None;
            }
            Some(trimmed.trim_start_matches(r"\\?\"))
        })
        .collect::<Vec<_>>()
        .join(";")
}

fn sanitize_env_value(key: &str, value: String) -> String {
    #[cfg(windows)]
    {
        if key.eq_ignore_ascii_case("PATH") {
            return sanitize_windows_path_list(&value);
        }
        if value.contains(r"\\?\") {
            return value.replace(r"\\?\", "");
        }
    }
    value
}

fn apply_snapshot_child_env(command: &mut Command) {
    for (key, value) in std::env::vars() {
        if matches!(key.as_str(), "NODE_PATH" | "NODE_OPTIONS") {
            continue;
        }
        command.env(&key, sanitize_env_value(&key, value));
    }
    ensure_windows_appdata_for_child(command);
}

/// Node en Windows usa APPDATA para rutas por defecto; el env saneado puede dejarla vacía.
#[cfg(windows)]
fn ensure_windows_appdata_for_child(command: &mut Command) {
    let needs_fallback = match std::env::var("APPDATA") {
        Ok(value) => value.trim().is_empty(),
        Err(_) => true,
    };

    if !needs_fallback {
        return;
    }

    if let Ok(userprofile) = std::env::var("USERPROFILE") {
        let trimmed = userprofile.trim();
        if !trimmed.is_empty() {
            let roaming = PathBuf::from(trimmed)
                .join("AppData")
                .join("Roaming");
            command.env("APPDATA", normalize_path_for_subprocess(roaming));
        }
    }
}

#[cfg(not(windows))]
fn ensure_windows_appdata_for_child(_command: &mut Command) {}

fn resolve_node_program() -> String {
    #[cfg(windows)]
    {
        for key in ["ProgramFiles", "ProgramFiles(x86)"] {
            if let Ok(base) = std::env::var(key) {
                let candidate = PathBuf::from(base).join("nodejs").join("node.exe");
                if candidate.is_file() {
                    return candidate.to_string_lossy().into_owned();
                }
            }
        }
    }
    "node".to_string()
}

fn spawn_snapshot_cli_node(node: &str, package_dir: &Path) -> std::io::Result<std::process::Output> {
    let mut command = Command::new(node);
    // Ruta relativa + cwd normalizado: evita prefijo `\\?\` en argv (bug Node 22+/26 en Windows).
    command
        .arg(SNAPSHOT_SCRIPT)
        .current_dir(package_dir);
    apply_snapshot_child_env(&mut command);
    command.output()
}

fn spawn_snapshot_cli_pnpm(package_dir: &Path) -> std::io::Result<std::process::Output> {
    let pnpm = if cfg!(windows) { "pnpm.cmd" } else { "pnpm" };
    let mut command = Command::new(pnpm);
    command
        .args(["run", "snapshot", "--silent"])
        .current_dir(package_dir);
    apply_snapshot_child_env(&mut command);
    command.output()
}

fn node_snapshot_needs_pnpm_fallback(stdout: &[u8], stderr: &[u8]) -> bool {
    if !stdout.is_empty() {
        return false;
    }
    let err = String::from_utf8_lossy(stderr);
    err.contains("EISDIR")
        || err.contains("Module._findPath")
        || err.contains("realpathSync")
}

fn run_snapshot_cli(package_dir: &Path) -> Result<std::process::Output, String> {
    let node = resolve_node_program();
    let output = spawn_snapshot_cli_node(&node, package_dir)
        .map_err(|e| format!("No se pudo ejecutar Node para leer tokens ({node}): {e}"))?;

    if node_snapshot_needs_pnpm_fallback(&output.stdout, &output.stderr) {
        eprintln!("[hotbar] Reintentando ingesta vía pnpm run snapshot (resolución de módulos Node en Windows)");
        return spawn_snapshot_cli_pnpm(package_dir).map_err(|e| {
            format!(
                "Falló Node y pnpm run snapshot: {e} — stderr Node: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            )
        });
    }

    Ok(output)
}

fn parse_snapshot_stdout(stdout: &[u8], stderr: &[u8]) -> Result<AntigravitySnapshot, String> {
    let stdout_text = String::from_utf8_lossy(stdout);
    let text = stdout_text.trim();
    if text.is_empty() {
        let stderr_text = String::from_utf8_lossy(stderr).trim().to_string();
        if stderr_text.contains("EISDIR") {
            return Err(format!(
                "No se pudo ejecutar el CLI de ingesta (rutas Windows/Node). Detalle: {stderr_text}"
            ));
        }
        return Err(format!("Salida vacía del CLI de ingesta: {stderr_text}"));
    }

    serde_json::from_str(text).map_err(|e| {
        format!(
            "JSON inválido del CLI: {e} — stderr: {}",
            String::from_utf8_lossy(stderr).trim()
        )
    })
}

/// Invoca el CLI de `@antigravity/local-ingest` (Node) para leer logs locales sin servidor HTTP.
#[tauri::command]
fn fetch_antigravity_snapshot() -> Result<AntigravitySnapshot, String> {
    let package_dir = local_ingest_package_dir();
    let script = package_dir.join(SNAPSHOT_SCRIPT);
    if !script.is_file() {
        return Err(format!(
            "CLI de ingesta no compilado. Ejecute: pnpm --filter @antigravity/local-ingest build (ruta esperada: {})",
            script.display()
        ));
    }

    let output = run_snapshot_cli(&package_dir)?;

    // El CLI sale con código 2 cuando `available: false`, pero sigue emitiendo JSON en stdout.
    parse_snapshot_stdout(&output.stdout, &output.stderr)
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Err(err) = window.show() {
            eprintln!("[hotbar] No se pudo mostrar la ventana principal: {err}");
        }
        if let Err(err) = window.set_focus() {
            eprintln!("[hotbar] No se pudo enfocar la ventana principal: {err}");
        }
    }
}

#[tauri::command]
fn toggle_hotbar_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(true) {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let show_item = MenuItem::with_id(app, "show", "Mostrar / ocultar hotbar", true, None::<&str>)?;
            let refresh_item = MenuItem::with_id(app, "refresh", "Actualizar métricas", true, None::<&str>)?;
            let quit_item = PredefinedMenuItem::quit(app, Some("Salir"))?;
            let tray_menu = Menu::with_items(app, &[&show_item, &refresh_item, &quit_item])?;

            let icon = match app.default_window_icon() {
                Some(icon) => icon.clone(),
                None => {
                    eprintln!("[hotbar] AVISO: sin icono embebido; omitiendo bandeja del sistema");
                    show_main_window(app.handle());
                    return Ok(());
                }
            };

            if let Err(err) = TrayIconBuilder::new()
                .icon(icon)
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .tooltip("Antigravity Hotbar — clic: mostrar/ocultar · clic derecho: menú")
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show" => {
                        let _ = toggle_hotbar_window(app.clone());
                    }
                    "refresh" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("hotbar:refresh", ());
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let _ = toggle_hotbar_window(app.clone());
                    }
                })
                .build(app)
            {
                eprintln!("[hotbar] AVISO: no se pudo crear el icono de bandeja: {err}");
            }

            show_main_window(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fetch_antigravity_snapshot,
            toggle_hotbar_window
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            if let RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parsea_snapshot_con_campo_quota() {
        let json = r#"{
            "source": "antigravity",
            "available": true,
            "sessionId": "abc",
            "tokens": {
                "prompt": 1,
                "output": 2,
                "cached": 0,
                "thinking": 0,
                "totalAccumulated": 3
            },
            "quota": {
                "estado": "agotado",
                "resetAt": "2026-09-20T12:00:00.000Z",
                "sourceFile": "C:\\logs\\ls-main.log",
                "detectedAt": "2026-09-17T19:12:39.555Z"
            },
            "message": null
        }"#;

        let parsed: AntigravitySnapshot =
            parse_snapshot_stdout(json.as_bytes(), b"").expect("debe parsear");

        assert_eq!(parsed.quota.estado, "agotado");
        assert_eq!(
            parsed.quota.reset_at.as_deref(),
            Some("2026-09-20T12:00:00.000Z")
        );
        assert_eq!(parsed.session_id.as_deref(), Some("abc"));
    }

    #[test]
    fn quota_desconocida_si_falta_en_json_legacy() {
        let json = r#"{
            "source": "antigravity",
            "available": false,
            "sessionId": null,
            "tokens": {
                "prompt": 0,
                "output": 0,
                "cached": 0,
                "thinking": 0,
                "totalAccumulated": 0
            },
            "message": "sin datos"
        }"#;

        let parsed: AntigravitySnapshot =
            parse_snapshot_stdout(json.as_bytes(), b"").expect("debe parsear");

        assert_eq!(parsed.quota.estado, "desconocido");
        assert!(parsed.quota.reset_at.is_none());
    }
}