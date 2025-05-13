use tauri_plugin_prevent_default::Flags;
// use tauri_plugin_shell::ShellExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn quit() {
    std::process::exit(0x0);
}

fn create_prevent_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS))
        .build()
}

// fn calculate_size() -> (f64, f64) {
//     let shell = app_handle.shell();
//     let output = tauri::async_runtime::block_on(async move {
//         shell
//             .command("echo")
//             .args(["Hello from Rust!"])
//             .output()
//             .await
//             .unwrap()
//     });
//     if output.status.success() {
//         println!("Result: {:?}", String::from_utf8(output.stdout));
//     } else {
//         println!("Exit with code: {}", output.status.code().unwrap());
//     }

//     // Default fallback if no primary monitor is found
//     (800.0, 800.0)
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(create_prevent_plugin())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        // .plugin(tauri_plugin_prevent_default::init())
        // .setup(|app| {
        //     let webview_window = tauri::WebviewWindowBuilder::new(app, "label", tauri::WebviewUrl::App("index.html".into()))
        //         .inner_size(calculate_size().0, calculate_size().1)
        //         .build();
        //     Ok(())
        // })
        .invoke_handler(tauri::generate_handler![greet, quit])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
