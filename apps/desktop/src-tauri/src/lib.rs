// Vicoo Desktop Library
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("你好 {}! 欢迎使用 Vicoo Desktop 🚀", name)
}

#[tauri::command]
fn get_platform() -> String {
    format!("{}-{}", std::env::consts::OS, std::env::consts::ARCH)
}

pub fn run() {
    env_logger::init();
    log::info!("Starting Vicoo Desktop...");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, get_platform])
        .setup(|app| {
            log::info!("Vicoo Desktop setup complete");

            let window = app.get_webview_window("main").unwrap();
            log::info!("Window initialized: {}", window.title().unwrap_or_default());

            // Set window title with version
            let _ = window.set_title("Vicoo — AI 知识管理");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
