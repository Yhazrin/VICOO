// Vicoo Desktop Library
use tauri::Manager;

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
        .setup(|app| {
            log::info!("Vicoo Desktop setup complete");

            // Get main window
            let window = app.get_webview_window("main").unwrap();

            // Set window shadow (platform dependent)
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                // Windows specific: enable shadow
            }

            log::info!("Window initialized: {}", window.title().unwrap_or_default());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
