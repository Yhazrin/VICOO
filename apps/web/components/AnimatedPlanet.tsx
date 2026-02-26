import React from 'react';
import { VicooIcon } from './VicooIcon';

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

function darken(hex: string, amount = 0.25): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (n & 0xff) * (1 - amount));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function lighten(hex: string, amount = 0.3): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + (255 - ((n >> 8) & 0xff)) * amount);
  const b = Math.min(255, (n & 0xff) + (255 - (n & 0xff)) * amount);
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

export const AnimatedPlanet: React.FC<AnimatedPlanetProps> = ({ 
  color, 
  icon, 
  size = 120, 
  label, 
  className = '' 
}) => {
  const hexColor = colorHexMap[color] || color || '#0df259';
  const uid = React.useId().replace(/:/g, '');

  return (
    <div 
      className={`relative flex flex-col items-center justify-center group ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          {/* Planet gradient with lighting */}
          <radialGradient id={`pg-${uid}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={lighten(hexColor, 0.5)} />
            <stop offset="50%" stopColor={hexColor} />
            <stop offset="100%" stopColor={darken(hexColor, 0.4)} />
          </radialGradient>
          {/* Atmosphere glow */}
          <radialGradient id={`ag-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor={hexColor} stopOpacity="0" />
            <stop offset="100%" stopColor={hexColor} stopOpacity="0.15" />
          </radialGradient>
          {/* Clip for ring behind planet */}
          <clipPath id={`ringBack-${uid}`}>
            <rect x="0" y="0" width="100" height="50" />
          </clipPath>
          {/* Clip for ring in front of planet */}
          <clipPath id={`ringFront-${uid}`}>
            <rect x="0" y="50" width="100" height="50" />
          </clipPath>
        </defs>

        {/* Gentle float animation on the whole planet group */}
        <g>
          <animateTransform
            attributeName="transform" type="translate"
            values="0,0; 0,-2; 0,0; 0,1; 0,0"
            dur="5s" repeatCount="indefinite"
          />

          {/* Atmosphere glow */}
          <circle cx="50" cy="50" r="34" fill={`url(#ag-${uid})`} />

          {/* Ring BEHIND planet (upper half clipped) */}
          <g clipPath={`url(#ringBack-${uid})`}>
            <ellipse
              cx="50" cy="50" rx="42" ry="10"
              fill="none" stroke={darken(hexColor, 0.1)} strokeWidth="2.5" opacity="0.5"
              transform="rotate(-12 50 50)"
            />
            <ellipse
              cx="50" cy="50" rx="46" ry="12"
              fill="none" stroke={darken(hexColor, 0.2)} strokeWidth="1.2" opacity="0.3"
              transform="rotate(-12 50 50)"
            />
          </g>

          {/* Planet body */}
          <circle cx="50" cy="50" r="28" fill={`url(#pg-${uid})`} stroke="#1a1a1a" strokeWidth="2.5" />

          {/* Surface detail band - slow self-rotation */}
          <g opacity="0.12">
            <ellipse cx="50" cy="50" rx="28" ry="6" fill="none" stroke="#000" strokeWidth="3">
              <animateTransform
                attributeName="transform" type="rotate"
                from="0 50 50" to="360 50 50"
                dur="20s" repeatCount="indefinite"
              />
            </ellipse>
          </g>

          {/* Craters / surface spots */}
          <circle cx="40" cy="42" r="3" fill="#000" fillOpacity="0.08" />
          <circle cx="60" cy="55" r="2" fill="#000" fillOpacity="0.06" />
          <circle cx="52" cy="38" r="1.5" fill="#000" fillOpacity="0.05" />

          {/* Specular highlight */}
          <ellipse cx="40" cy="40" rx="7" ry="5" fill="#fff" fillOpacity="0.3" transform="rotate(-20 40 40)" />

          {/* Ring IN FRONT of planet (lower half clipped) */}
          <g clipPath={`url(#ringFront-${uid})`}>
            <ellipse
              cx="50" cy="50" rx="42" ry="10"
              fill="none" stroke={darken(hexColor, 0.1)} strokeWidth="2.5" opacity="0.5"
              transform="rotate(-12 50 50)"
            />
            <ellipse
              cx="50" cy="50" rx="46" ry="12"
              fill="none" stroke={darken(hexColor, 0.2)} strokeWidth="1.2" opacity="0.3"
              transform="rotate(-12 50 50)"
            />
          </g>

          {/* Orbiting moon */}
          <g>
            <animateTransform
              attributeName="transform" type="rotate"
              from="0 50 50" to="360 50 50"
              dur="8s" repeatCount="indefinite"
            />
            <circle cx="50" cy="6" r="4" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="8s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </svg>
      
      {/* Centered Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <VicooIcon name={icon} size={size * 0.26} className="text-ink drop-shadow-sm" />
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
