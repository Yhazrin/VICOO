// Desktop-specific: System Tray and Notifications
import { useEffect } from 'react';

// This component handles desktop-specific features
// It runs silently and doesn't render anything

export function DesktopIntegrations() {
  useEffect(() => {
    // Check if we're in Tauri environment
    const isTauri = window.__TAURI__ !== undefined;

    if (isTauri) {
      console.log('Running in Tauri desktop environment');

      // Import Tauri APIs dynamically
      import('@tauri-apps/api/notification').then((notification) => {
        // Notification API is available
        console.log('Desktop notifications ready');
      }).catch((err) => {
        console.log('Notification API not available:', err);
      });

      // Set up system tray (handled by Rust backend)
      // Window controls are handled by Tauri
    }
  }, []);

  return null; // This component doesn't render anything
}

// TypeScript declaration for Tauri global
declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}
