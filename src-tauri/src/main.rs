// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Check if running in headless mode (no display or --headless flag)
    #[cfg(all(feature = "websocket", not(target_os = "android")))]
    if aero_work_lib::is_headless() {
        aero_work_lib::run_headless();
        return;
    }

    aero_work_lib::run()
}
