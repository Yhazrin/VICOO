import React, { useState } from 'react';

interface AnimatedLogoProps {
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
        className={`relative cursor-pointer select-none group ${className}`} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="vicoo"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        
        {/* Background Glow - vicoo Yellow */}
        <circle 
            cx="50" cy="50" r="45" 
            fill="#FFD166" 
            className={`transition-all duration-500 ease-out origin-center ${isHovered ? 'scale-100 opacity-20' : 'scale-0 opacity-0'}`} 
        />

        {/* 
            MASCOT FACE CONTAINER 
            Idle: Visible White rounded rect
            Hover: Scales down and fades out
        */}
        <rect 
            x="22" y="32" width="56" height="46" rx="14"
            fill="#ffffff"
            stroke="#1a1a1a"
            strokeWidth="3"
            className="transition-all duration-500"
            style={{
                transformOrigin: '50px 55px',
                transform: isHovered ? 'scale(0.8)' : 'scale(1)',
                opacity: isHovered ? 0 : 1,
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        />

        {/* 
           GROUP: The Eyes -> The 'V' 
           Idle: Green Eyes
           Hover: Black V Legs
        */}
        <g>
            {/* Left Eye -> Left Leg */}
            <rect 
                x="35" y="42" width="8" height="16" rx="4"
                className="transition-all duration-500"
                style={{
                    fill: isHovered ? '#1a1a1a' : '#0df259', // Green to Black
                    stroke: '#1a1a1a', // Remove stroke distinction
                    strokeWidth: 0,
                    
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transformOrigin: 'center bottom', // Pivot from bottom to lean
                    transform: isHovered 
                        ? 'translate(-4px, 10px) scale(1.2, 3.5) rotate(-25deg)' // Move to V position, Stretch
                        : 'translate(0, 0) scale(1, 1) rotate(0deg)', 
                    borderRadius: isHovered ? '4px' : '4px'
                }}
            />
            
            {/* Right Eye -> Right Leg */}
            <rect 
                x="57" y="42" width="8" height="16" rx="4"
                className="transition-all duration-500"
                style={{
                    fill: isHovered ? '#1a1a1a' : '#0df259',
                    strokeWidth: 0,
                    
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transformOrigin: 'center bottom',
                    transform: isHovered 
                        ? 'translate(-20px, 10px) scale(1.2, 3.5) rotate(25deg)' // Move left to join V
                        : 'translate(0, 0) scale(1, 1) rotate(0deg)',
                }}
            />
        </g>

        {/* 
           GROUP: Antenna -> The 'C'
        */}
        <g>
            {/* Antenna Line (Disappears on hover) */}
            <line 
                x1="50" y1="32" x2="50" y2="15"
                stroke="#1a1a1a"
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{
                    opacity: isHovered ? 0 : 1,
                    transform: isHovered ? 'translateY(10px)' : 'translateY(0)',
                }}
            />

            {/* Antenna Dot -> The 'C' */}
            {/* 
                We use a circle. 
                Idle: Solid Pink Dot (r=6) at top.
                Hover: Stroked Black Circle (r=18) at right.
            */}
            <circle 
                cx="50" cy="15"
                r="6"
                className="transition-all duration-500"
                style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    
                    // Colors
                    fill: isHovered ? 'transparent' : '#EF476F', // Pink to Transparent
                    stroke: '#1a1a1a',
                    strokeWidth: isHovered ? 3.5 : 0, // Scales up with transform
                    
                    // Geometry Transform
                    // Move from 50,15 to ~70,65 (Center of C)
                    transformOrigin: 'center',
                    transform: isHovered 
                        ? 'translate(22px, 45px) scale(3)' // Move to C pos, Scale up (6*3=18 radius)
                        : 'translate(0px, 0px) scale(1)',

                    // The Gap for C
                    // Dasharray creates the gap.
                    strokeDasharray: isHovered ? '30 50' : '0 0', 
                    strokeDashoffset: isHovered ? -10 : 0, // Rotate the gap
                    strokeLinecap: 'round'
                }}
            />
        </g>

      </svg>
    </div>
  );
};