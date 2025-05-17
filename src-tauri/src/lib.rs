use tauri_plugin_prevent_default::Flags;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
    handle: tauri::AppHandle
) -> Result<(), String> {
    if let Some(window) = handle.get_webview_window(id) {
        // If the window already exists, bring it to front
        let _ = window.set_focus();
        Ok(())
    } else {
        // Otherwise, create the window
        tauri::WebviewWindowBuilder::new(
            &handle,
            id,
            tauri::WebviewUrl::App(url.into()),
        )
        .position(x, y)
        .inner_size(w, h)
        .resizable(false)
        .maximizable(false)
        .build()
        .map(|_| ())
        .map_err(|e| e.to_string())
    }
}

fn create_prevent_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS))
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(create_prevent_plugin())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, quit, create_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
