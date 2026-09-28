use std::path::PathBuf;
use std::process::Command;

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, RunEvent,
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

fn workspace_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../.."))
}

fn snapshot_cli_path() -> PathBuf {
    workspace_root().join("packages/local-ingest/dist/cli/snapshot.js")
}

/// Invoca el CLI de `@antigravity/local-ingest` (Node) para leer logs locales sin servidor HTTP.
#[tauri::command]
fn fetch_antigravity_snapshot() -> Result<AntigravitySnapshot, String> {
    let cli = snapshot_cli_path();
    if !cli.exists() {
        return Err(format!(
            "CLI de ingesta no compilado. Ejecute: pnpm --filter @antigravity/local-ingest build (ruta esperada: {})",
            cli.display()
        ));
    }

    let output = Command::new("node")
        .arg(&cli)
        .current_dir(workspace_root())
        .output()
        .map_err(|e| format!("No se pudo ejecutar Node para leer tokens: {e}"))?;

    if output.stdout.is_empty() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Salida vacía del CLI de ingesta: {stderr}"));
    }

    serde_json::from_slice(&output.stdout).map_err(|e| {
        format!(
            "JSON inválido del CLI: {e} — stderr: {}",
            String::from_utf8_lossy(&output.stderr)
        )
    })
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

            let icon = app
                .default_window_icon()
                .cloned()
                .expect("icono de ventana por defecto");

            let app_handle = app.handle().clone();
            TrayIconBuilder::new()
                .icon(icon)
                .menu(&tray_menu)
                .tooltip("Antigravity Hotbar")
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
                .build(app)?;

            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
            }

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
