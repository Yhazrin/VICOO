import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mascot } from './Mascot';
import { eventBus, Events, type MascotEventState } from '@vicoo/events';

// Extended state type including all event-driven states
type ExtendedMascotState =
  | 'idle' | 'happy' | 'thinking' | 'working'
  | 'typing' | 'saving' | 'saved'
  | 'searching' | 'search_found' | 'search_empty'
  | 'connecting' | 'connected' | 'disconnected'
  | 'file_reading' | 'file_writing' | 'command_running'
  | 'navigating' | 'focus_enter' | 'focus_exit'
  | 'syncing' | 'synced' | 'sync_error'
  | 'dragging' | 'dropped' | 'celebrating' | 'surprised' | 'sad';

// Map extended states to base Mascot states for rendering
const mapToBaseState = (state: ExtendedMascotState): 'idle' | 'happy' | 'thinking' | 'working' => {
  switch (state) {
    case 'happy':
    case 'celebrating':
    case 'search_found':
    case 'synced':
    case 'completed':
    case 'saved':
    case 'connected':
      return 'happy';
    case 'thinking':
    case 'searching':
    case 'search_empty':
    case 'navigating':
    case 'connecting':
    case 'focus_exit':
      return 'thinking';
    case 'working':
    case 'typing':
    case 'saving':
    case 'tool_using':
    case 'file_reading':
    case 'file_writing':
    case 'command_running':
    case 'syncing':
    case 'dragging':
    case 'surprised':
    case 'focus_enter':
      return 'working';
    case 'sad':
    case 'error':
    case 'sync_error':
    case 'disconnected':
    case 'dropped':
      return 'thinking'; // Use thinking as base, but could add 'sad' state
    default:
      return 'idle';
  }
};

// Message templates for different states
const getMessageForState = (state: ExtendedMascotState): string | null => {
  const messages: Record<ExtendedMascotState, string> = {
    idle: "I'm just chilling.",
    typing: "Writing...",
    saving: "Saving...",
    saved: "Saved!",
    searching: "Searching...",
    search_found: "Found it!",
    search_empty: "No matches...",
    connecting: "Connecting...",
    connected: "Ready to code!",
    disconnected: "Connection lost",
    thinking: "Hmm, let me think...",
    tool_using: "Using tool...",
    file_reading: "Reading file...",
    file_writing: "Writing file...",
    command_running: "Running command...",
    completed: "All done!",
    error: "Oops! Something went wrong",
    navigating: "Loading...",
    focus_enter: "Focus mode!",
    focus_exit: "Back to normal",
    syncing: "Syncing...",
    synced: "All synced!",
    sync_error: "Sync failed!",
    dragging: "Hey! Put me down!",
    dropped: "Wheee!",
    celebrating: "Woohoo!",
    sad: "Don't be sad...",
    happy: "Yay! High five!",
    working: "Time to code!",
  };
  return messages[state] || null;
};

export const DraggableMascot: React.FC = () => {
  const [position, setPosition] = useState({ x: window.innerWidth - 160, y: window.innerHeight - 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [mascotState, setMascotState] = useState<ExtendedMascotState>('idle');
  const [message, setMessage] = useState<string | null>("I'm draggable!");
  const [overrideState, setOverrideState] = useState<ExtendedMascotState | null>(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const mascotRef = useRef<HTMLDivElement>(null);
  const autoRevertTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle event-driven state changes
  const handleMascotEvent = useCallback((data: { state: MascotEventState; message?: string; duration?: number; persistent?: boolean }) => {
    const newState = data.state as ExtendedMascotState;

    // Set override state
    setOverrideState(newState);

    // Show message if provided, otherwise use default
    const msg = data.message || getMessageForState(newState);
    setMessage(msg);

    // Clear existing timer
    if (autoRevertTimer.current) {
      clearTimeout(autoRevertTimer.current);
    }

    // Auto-revert after duration (unless persistent)
    if (!data.persistent && data.duration !== 0) {
      const duration = data.duration || 3000;
      autoRevertTimer.current = setTimeout(() => {
        setOverrideState(null);
        setMessage(null);
      }, duration);
    }
  }, []);

  // Subscribe to mascot events
  useEffect(() => {
    const unsubscribeState = eventBus.on(Events.MASCOT_STATE, handleMascotEvent);
    const unsubscribeMessage = eventBus.on(Events.MASCOT_SHOW_MESSAGE, (data: { message: string; state?: MascotEventState; duration?: number }) => {
      const state = (data.state || 'idle') as ExtendedMascotState;
      handleMascotEvent({ state, message: data.message, duration: data.duration });
    });
    const unsubscribeCelebrate = eventBus.on(Events.MASCOT_CELEBRATE, () => {
      handleMascotEvent({ state: 'celebrating', duration: 2000 });
    });

    return () => {
      unsubscribeState();
      unsubscribeMessage();
      unsubscribeCelebrate();
    };
  }, [handleMascotEvent]);

  // Cycle states on click (manual interaction)
  const handleInteract = () => {
    if (isDragging) return;

    const states: ExtendedMascotState[] = ['idle', 'happy', 'thinking', 'working'];
    const currentIndex = overrideState ? states.indexOf(overrideState) : 0;
    const nextIndex = (currentIndex + 1) % states.length;
    const nextState = states[nextIndex];

    setOverrideState(nextState);
    setMessage(getMessageForState(nextState));

    // Clear message after 3s
    setTimeout(() => {
      setOverrideState((current) => {
        if (current === nextState) return null;
        return current;
      });
      setMessage(null);
    }, 3000);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);

    // Clear any auto-revert timer when user interacts
    if (autoRevertTimer.current) {
      clearTimeout(autoRevertTimer.current);
    }

    setOverrideState('dragging');
    setMessage("Hey! Put me down!");

    if (mascotRef.current) {
      const rect = mascotRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      // Keep within bounds
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 100;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setOverrideState('dropped');
        setMessage("Wheee!");

        // Revert to idle after drop animation
        setTimeout(() => {
          setOverrideState(null);
          setMessage(null);
        }, 1000);
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  // Determine current state (override takes priority)
  const currentState = overrideState || mascotState;

  return (
    <div
      ref={mascotRef}
      onPointerDown={handlePointerDown}
      onClick={handleInteract}
      className={`fixed z-[100] transition-transform duration-75 touch-none select-none cursor-grab active:cursor-grabbing hover:scale-105 active:scale-110`}
      style={{
        left: position.x,
        top: position.y,
        width: '128px',
        height: '128px',
        filter: isDragging ? 'drop-shadow(8px 8px 0px rgba(0,0,0,0.2))' : 'none'
      }}
    >
      {/* Speech Bubble */}
      {message && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 animate-pop pointer-events-none">
          <div className="bg-white border-3 border-ink px-3 py-2 rounded-xl rounded-b-none text-center shadow-neo-sm relative">
            <p className="text-xs font-bold leading-tight">{message}</p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-3 border-b-3 border-ink transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* The Mascot - uses mapped base state for rendering */}
      <div className={`${isDragging ? 'animate-wiggle' : overrideState ? 'animate-none' : 'animate-float'}`}>
        <Mascot state={mapToBaseState(currentState)} className="w-32 h-32" />
      </div>
    </div>
  );
};