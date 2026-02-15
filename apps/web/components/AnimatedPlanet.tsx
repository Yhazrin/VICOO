import React from 'react';

interface AnimatedPlanetProps {
  color: string;
  icon: string;
  size?: number;
  label?: string;
  className?: string;
}

const colorHexMap: Record<string, string> = {
  'bg-primary': '#0df259',
  'bg-secondary': '#FFD166',
  'bg-accent': '#EF476F',
  'bg-info': '#118AB2',
};

export const AnimatedPlanet: React.FC<AnimatedPlanetProps> = ({ 
  color, 
  icon, 
  size = 120, 
  label, 
  className = '' 
}) => {
  const hexColor = colorHexMap[color] || '#0df259';

  return (
    <div 
      className={`relative flex flex-col items-center justify-center group ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Orbit Ring (Back) */}
        <g className="animate-spin-slow" style={{ transformOrigin: '50px 50px' }}>
             <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" transform="rotate(-15 50 50)" />
        </g>

        {/* Main Planet Body */}
        <g className="animate-float">
          <circle cx="50" cy="50" r="30" fill={hexColor} stroke="#1a1a1a" strokeWidth="3" />
          
          {/* Shadow/Detail */}
          <path d="M 50 80 A 30 30 0 0 1 20 50 A 30 30 0 0 0 50 20" fill="black" fillOpacity="0.1" />
          
          {/* Crater */}
          <circle cx="65" cy="40" r="4" fill="black" fillOpacity="0.1" />
          <circle cx="35" cy="60" r="2" fill="black" fillOpacity="0.1" />

          {/* Shine */}
          <circle cx="35" cy="35" r="5" fill="white" fillOpacity="0.4" />
        </g>

        {/* Orbiting Satellite */}
        <g className="animate-orbit" style={{ transformOrigin: '50px 50px' }}>
           <g transform="translate(50, -10)">
              <circle cx="0" cy="0" r="6" fill="white" stroke="#1a1a1a" strokeWidth="2" />
           </g>
        </g>

        {/* Orbit Ring (Front - Partial to create depth illusion if complex, but simplified here) */}
      </svg>
      
      {/* Centered Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-float">
         <span className="material-icons-round text-3xl text-ink drop-shadow-sm">{icon}</span>
      </div>

      {/* Label */}
      {label && (
        <div className="absolute -bottom-8 bg-white border-2 border-ink px-3 py-1 rounded-xl shadow-neo-sm transform transition-transform group-hover:scale-110">
          <span className="font-bold text-sm whitespace-nowrap">{label}</span>
        </div>
      )}
    </div>
  );
};