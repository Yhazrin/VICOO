export type EventPayload = Record<string, unknown>;

export interface VicooEvent<T extends EventPayload = EventPayload> {
  type: string;
  payload: T;
}

// Event Bus implementation
type EventCallback<T = unknown> = (data: T) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
    }
  }

  emit<T = unknown>(event: string, data: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

export const eventBus = new EventEmitter();

// Event type constants
export const Events = {
  MASCOT_STATE: 'mascot:state',
  MASCOT_SHOW_MESSAGE: 'mascot:show_message',
  MASCOT_CELEBRATE: 'mascot:celebrate',
} as const;

// Mascot event state type
export type MascotEventState =
  | 'idle' | 'happy' | 'thinking' | 'working'
  | 'typing' | 'saving' | 'saved'
  | 'searching' | 'search_found' | 'search_empty'
  | 'connecting' | 'connected' | 'disconnected'
  | 'file_reading' | 'file_writing' | 'command_running'
  | 'navigating' | 'focus_enter' | 'focus_exit'
  | 'syncing' | 'synced' | 'sync_error'
  | 'dragging' | 'dropped' | 'celebrating' | 'surprised' | 'sad';
