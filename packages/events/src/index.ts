/**
 * Vicoo Event Bus
 *
 * Simple event emitter for cross-component communication
 */

export enum Events {
  // Mascot states
  MASCOT_STATE = 'mascot:state',
  MASCOT_SHOW_MESSAGE = 'mascot:show_message',
  MASCOT_CELEBRATE = 'mascot:celebrate',

  // Navigation
  NAVIGATE = 'navigate',

  // Notes
  NOTE_CREATED = 'note:created',
  NOTE_UPDATED = 'note:updated',
  NOTE_DELETED = 'note:deleted',

  // Sync
  SYNC_START = 'sync:start',
  SYNC_COMPLETE = 'sync:complete',
  SYNC_ERROR = 'sync:error',

  // Theme
  THEME_CHANGED = 'theme:changed',
}

type EventHandler = (data?: any) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  once(event: string, handler: EventHandler): void {
    const wrappedHandler = (data: any) => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const eventBus = new EventBus();

export default eventBus;
