import React, { useState, useEffect, useRef } from 'react';
import { Mascot } from './Mascot';

export const DraggableMascot: React.FC = () => {
  const [position, setPosition] = useState({ x: window.innerWidth - 160, y: window.innerHeight - 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'happy' | 'thinking' | 'working'>('idle');
  const [message, setMessage] = useState<string | null>("I'm draggable!");
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const mascotRef = useRef<HTMLDivElement>(null);

  // Cycle states on click
  const handleInteract = () => {
    if (isDragging) return;
    
    const states: ('idle' | 'happy' | 'thinking' | 'working')[] = ['idle', 'happy', 'thinking', 'working'];
    const nextIndex = (states.indexOf(mascotState) + 1) % states.length;
    setMascotState(states[nextIndex]);

    const messages = [
      "I'm just chilling.",
      "Yay! High five!",
      "Hmm, let me compute...",
      "Time to code!",
    ];
    setMessage(messages[nextIndex]);
    
    // Clear message after 3s
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setMascotState('working'); // Look busy when being dragged
    
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
        setMascotState('idle'); // Return to idle
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

  return (
    <div
      ref={mascotRef}
      onPointerDown={handlePointerDown}
      onClick={handleInteract}
      className={`fixed z-[100] transition-transform duration-75 touch-none select-none cursor-grab active:cursor-grabbing hover:scale-105 active:scale-110`}
      // IMPORTANT: If we don't have explicit dimensions, a fixed div might block clicks.
      // We set specific size here to match the mascot size approx.
      style={{ 
        left: position.x, 
        top: position.y,
        width: '128px', // w-32
        height: '128px', // h-32
        filter: isDragging ? 'drop-shadow(8px 8px 0px rgba(0,0,0,0.2))' : 'none'
      }}
    >
      {/* Speech Bubble - Needs to be visible outside the 128x128 box */}
      {message && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 animate-pop pointer-events-none">
          <div className="bg-white border-3 border-ink px-3 py-2 rounded-xl rounded-b-none text-center shadow-neo-sm relative">
            <p className="text-xs font-bold leading-tight">{message}</p>
            {/* Triangle */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-3 border-b-3 border-ink transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* The Mascot */}
      <div className={`${isDragging ? 'animate-wiggle' : 'animate-float'}`}>
        <Mascot state={mascotState} className="w-32 h-32" />
      </div>
    </div>
  );
};