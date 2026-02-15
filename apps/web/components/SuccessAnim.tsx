import React from 'react';

export const SuccessAnim: React.FC = () => {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center animate-pop">
      {/* Background Burst */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-spin-slow">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <line 
            key={i} 
            x1="50" y1="50" x2="50" y2="10" 
            transform={`rotate(${deg} 50 50)`} 
            stroke={i % 2 === 0 ? '#FFD166' : '#EF476F'} 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray="10 30"
          />
        ))}
      </svg>

      {/* Checkmark Circle */}
      <div className="w-12 h-12 bg-primary border-3 border-ink rounded-full flex items-center justify-center relative z-10 shadow-neo-sm">
        <span className="material-icons-round text-ink text-3xl font-bold">check</span>
      </div>
    </div>
  );
};