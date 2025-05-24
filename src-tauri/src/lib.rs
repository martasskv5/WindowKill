use std::sync::{Arc, Mutex};
use tauri::async_runtime::spawn;
use tauri::Emitter;
use tauri::Manager;
use tauri::State;
use tauri_plugin_prevent_default::Flags;
use tokio::sync::broadcast;

type SharedSender = Arc<Mutex<Option<broadcast::Sender<String>>>>;

#[tauri::command]
fn start_sync_server(state: State<SharedSender>) {
    let sender = state.inner().clone();
    spawn(async move {
        let (tx, _rx) = broadcast::channel::<String>(100);
        *sender.lock().unwrap() = Some(tx);
    });
}

#[tauri::command]
async fn send_sync_message(state: State<'_, SharedSender>, msg: String) -> Result<(), ()> {
    if let Some(sender) = &*state.lock().unwrap() {
        let _ = sender.send(msg);
    }
    Ok(())
}

#[tauri::command]
async fn subscribe_sync(state: State<'_, SharedSender>, window: tauri::Window) -> Result<(), ()> {
    let rx = {
        let sender = state.lock().unwrap();
        sender.as_ref().unwrap().subscribe()
    };
    spawn(async move {
        let mut rx = rx;
        while let Ok(msg) = rx.recv().await {
            let _ = window.emit("sync-message", msg);
        }
    });
    Ok(())
}

#[tauri::command]
fn quit() {
    std::process::exit(0x0);
}

#[tauri::command]
async fn create_window(
    id: &str,
    url: &str,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
    title: &str,
    resizable: Option<bool>,
    maximizable: Option<bool>,
    transparent: Option<bool>,
    decorations: Option<bool>,
    focused: Option<bool>,
    handle: tauri::AppHandle,
) -> Result<(), String> {
    let resizable = resizable.unwrap_or(false); // Default to false if not provided
    let maximizable = maximizable.unwrap_or(false); // Default to false if not provided
    let transparent = transparent.unwrap_or(true); // Default to true if not provided
    let decorations = decorations.unwrap_or(true);
    let focused = focused.unwrap_or(true); // Default to true if not provided
    if let Some(window) = handle.get_webview_window(id) {
        // If the window already exists, bring it to front
        let _ = window.set_focus();
        Ok(())
    } else {
        // Otherwise, create the window
        tauri::WebviewWindowBuilder::new(&handle, id, tauri::WebviewUrl::App(url.into()))
            .position(x, y)
            .inner_size(w, h)
            .title(title)
            .resizable(resizable)
            .maximizable(maximizable)
            .transparent(transparent)
            .decorations(decorations)
            .focused(focused)
            .build()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}

#[tauri::command]
async fn close_window(id: &str, handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = handle.get_webview_window(id) {
        let _ = window.close();
        Ok(())
    } else {
        Err(format!("Window with ID '{}' not found", id))
    }
}

#[tauri::command]
async fn get_current_window_id(window: tauri::Window) -> Result<String, String> {
    let id = window.label();
    Ok(id.to_string())
}

fn create_prevent_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS))
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let shared_sender: SharedSender = Arc::new(Mutex::new(None));
    tauri::Builder::default()
        .manage(shared_sender)
        .plugin(tauri_plugin_notification::init())
        .plugin(create_prevent_plugin())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            quit,
            create_window,
            close_window,
            get_current_window_id,
            start_sync_server,
            send_sync_message,
            subscribe_sync
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
