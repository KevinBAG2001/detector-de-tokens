use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
use tauri::{
    image::Image,
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
pub struct AntigravitySnapshot {
    pub source: String,
    pub available: bool,
    pub session_id: Option<String>,
    pub tokens: TokenBreakdown,
    pub message: Option<String>,
}

const SNAPSHOT_SCRIPT: &str = "dist/cli/snapshot.js";

fn workspace_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../.."))
}

fn local_ingest_package_dir() -> PathBuf {
    workspace_root().join("packages/local-ingest")
}

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

/// Ejecuta el snapshot CLI con cwd en el paquete de ingesta y sin NODE_PATH heredado
/// (en Windows un NODE_PATH roto hacia `C:\` provoca EISDIR al resolver módulos ESM).
fn spawn_snapshot_cli(node: &str, package_dir: &Path) -> std::io::Result<std::process::Output> {
    let script = package_dir.join(SNAPSHOT_SCRIPT);
    let mut command = Command::new(node);
    command.arg(&script).current_dir(package_dir);

    for (key, value) in std::env::vars() {
        if key == "NODE_PATH" {
            continue;
        }
        command.env(key, value);
    }

    command.output()
}

fn parse_snapshot_stdout(stdout: &[u8], stderr: &[u8]) -> Result<AntigravitySnapshot, String> {
    let stdout_text = String::from_utf8_lossy(stdout);
    let text = stdout_text.trim();
    if text.is_empty() {
        return Err(format!(
            "Salida vacía del CLI de ingesta: {}",
            String::from_utf8_lossy(stderr).trim()
        ));
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

    let node = resolve_node_program();
    let output = spawn_snapshot_cli(&node, &package_dir)
        .map_err(|e| format!("No se pudo ejecutar Node para leer tokens ({node}): {e}"))?;

    // El CLI sale con código 2 cuando `available: false`, pero sigue emitiendo JSON en stdout.
    parse_snapshot_stdout(&output.stdout, &output.stderr)
}

fn resolve_tray_icon(app: &tauri::App) -> Image<'static> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    for name in ["icons/icon.ico", "icons/32x32.png"] {
        let path = manifest_dir.join(name);
        if !path.is_file() {
            continue;
        }
        match Image::from_path(&path) {
            Ok(image) => return image.to_owned(),
            Err(err) => eprintln!(
                "[hotbar] No se pudo cargar el icono de bandeja {}: {err}",
                path.display()
            ),
        }
    }

    eprintln!("[hotbar] Usando icono por defecto de la ventana para la bandeja");
    app.default_window_icon()
        .expect("icono de ventana por defecto")
        .to_owned()
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

            let icon = resolve_tray_icon(app);

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