// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![resize_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use tauri::Window;

#[tauri::command]
async fn resize_window(
    window: Window,
    increase_width: i32,
    increase_height: i32,
    duration_ms: u64,
    direction: String,
) -> Result<(), String> {
    let start_size = window.inner_size().unwrap();
    let start_pos = window.outer_position().unwrap();
    let target_width = start_size.width as i32 + increase_width;
    let target_height = start_size.height as i32 + increase_height;
    let delta_x = target_width - start_size.width as i32;
    let delta_y = target_height - start_size.height as i32;

    let start_time = std::time::Instant::now();

    while start_time.elapsed().as_millis() < duration_ms as u128 {
        let elapsed = start_time.elapsed().as_millis() as f64;
        let progress = (elapsed / duration_ms as f64).min(1.0);

        let new_width = start_size.width as i32 + (delta_x as f64 * progress) as i32;
        let new_height = start_size.height as i32 + (delta_y as f64 * progress) as i32;

        let mut new_x = start_pos.x;
        let mut new_y = start_pos.y;
        if direction == "left" {
            new_x = start_pos.x - (delta_x as f64 * progress) as i32;
        } else if direction == "top" {
            new_y = start_pos.y - (delta_y as f64 * progress) as i32;
        } else if direction == "shrink" {
            new_x = start_pos.x + (delta_x as f64 * progress / 2.0) as i32;
            new_y = start_pos.y + (delta_y as f64 * progress / 2.0) as i32;
        }

        window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: new_width as f64,
            height: new_height as f64,
        })).unwrap();
        window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x: new_x as f64,
            y: new_y as f64,
        })).unwrap();

        std::thread::sleep(std::time::Duration::from_millis(16));
    }

    Ok(())
}