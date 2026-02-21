import React from 'react';
import { useTheme, MascotSkin } from '../contexts/ThemeContext';

// Extended mascot states for deep event integration
type ExtendedState =
  // Legacy states
  | 'idle' | 'thinking' | 'happy' | 'working'
  // Editor states
  | 'typing' | 'saving' | 'saved'
  // Search states
  | 'searching' | 'search_found' | 'search_empty'
  // Vibe Coding states
  | 'connecting' | 'connected' | 'disconnected'
  | 'file_reading' | 'file_writing' | 'command_running'
  // Navigation states
  | 'navigating' | 'focus_enter' | 'focus_exit'
  // Sync states
  | 'syncing' | 'synced' | 'sync_error'
  // Interaction states
  | 'dragging' | 'dropped' | 'celebrating' | 'surprised' | 'sad';

interface MascotProps {
  state: ExtendedState;
  className?: string;
  skin?: MascotSkin; // Allow overriding the context (e.g. for previews)
}

export const Mascot: React.FC<MascotProps> = ({ state, className = '', skin: propSkin }) => {
  const { mascotSkin } = useTheme();
  const activeSkin = propSkin || mascotSkin;

  // Map extended states to animation classes
  const bodyAnim = (() => {
    switch (state) {
      // Legacy states
      case 'happy':
      case 'celebrating':
      case 'search_found':
      case 'synced':
      case 'completed':
      case 'saved':
      case 'connected':
        return 'animate-squash origin-bottom';
      case 'thinking':
      case 'search_empty':
      case 'navigating':
        return 'animate-shiver';
      case 'working':
      case 'typing':
      case 'saving':
      case 'tool_using':
      case 'file_reading':
      case 'file_writing':
      case 'command_running':
      case 'syncing':
      case 'dragging':
        return 'animate-none translate-y-2';
      case 'surprised':
      case 'focus_enter':
        return 'animate-[wiggle_0.5s_ease-in-out_infinite]';
      case 'sad':
      case 'sync_error':
      case 'error':
      case 'disconnected':
        return 'animate-[shiver_1s_ease-in-out_infinite] origin-top';
      case 'dropped':
        return 'animate-[bounce_0.5s_ease-out]';
      case 'searching':
      case 'connecting':
      case 'focus_exit':
        return 'animate-[pulse_1s_ease-in-out_infinite]';
      default:
        return 'animate-float';
    }
  })();

  // --- SKIN: CLASSIC BOT ---
  if (activeSkin === 'bot') {
    return (
      <div className={`relative w-32 h-32 ${className}`}>
        <svg viewBox="0 0 200 220" className="w-full h-full overflow-visible">
          {/* Shadow */}
          <ellipse cx="100" cy="200" rx={state === 'happy' ? '60' : '50'} ry="8" fill="#1a1a1a" opacity="0.2" className="transition-all duration-300 dark:fill-black dark:opacity-40">
             {state === 'idle' && <animate attributeName="rx" values="50;40;50" dur="6s" repeatCount="indefinite" />}
             {state === 'happy' && <animate attributeName="rx" values="60;70;60" dur="0.6s" repeatCount="indefinite" />}
          </ellipse>

          <g className={`${bodyAnim} transition-all duration-500`}>
              {/* Legs */}
              <g transform={state === 'working' ? 'translate(0, 10)' : ''}>
                  <path d="M70 170 L70 200" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" className="dark:stroke-white" />
                  <path d="M130 170 L130 200" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" className="dark:stroke-white" />
                  <path d="M60 200 L80 200" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" className="dark:stroke-white" />
                  <path d="M120 200 L140 200" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" className="dark:stroke-white" />
              </g>

              {/* Body */}
              <rect 
                  x="40" y="50" width="120" height="130" rx="45" 
                  fill={state === 'thinking' ? '#FFFBEB' : '#ffffff'} 
                  stroke="#1a1a1a" strokeWidth="6" 
                  className="transition-colors duration-300 dark:stroke-white dark:fill-gray-800"
              />

              {/* Screen */}
              <rect 
                  x="55" y="70" width="90" height="70" rx="20" 
                  fill={state === 'thinking' ? '#1a1a1a' : '#f5f8f6'} 
                  stroke="#1a1a1a" strokeWidth="4"
                  className="transition-colors duration-300 dark:stroke-white dark:fill-gray-900"
              />
              
              {/* Antenna - Extended states */}
              <g transform="translate(100, 50)">
                  <line x1="0" y1="0" x2="0" y2={
                    ['thinking', 'searching', 'navigating', 'search_empty'].includes(state) ? '-35' :
                    ['surprised', 'focus_enter'].includes(state) ? '-45' :
                    '-25'
                  } stroke="#1a1a1a" strokeWidth="6" className="transition-all duration-300 dark:stroke-white" />
                  <circle
                      cx="0" cy={
                        ['thinking', 'searching', 'navigating', 'search_empty'].includes(state) ? '-35' :
                        ['surprised', 'focus_enter'].includes(state) ? '-45' :
                        '-25'
                      } r={
                        ['thinking', 'searching', 'navigating', 'search_empty'].includes(state) ? '12' :
                        ['surprised', 'focus_enter'].includes(state) ? '14' :
                        '10'
                      }
                      fill={
                        ['thinking', 'searching', 'navigating', 'search_empty'].includes(state) ? '#EF476F' :
                        ['happy', 'celebrating', 'search_found', 'synced', 'completed', 'saved', 'connected'].includes(state) ? '#0df259' :
                        ['sad', 'error', 'sync_error', 'disconnected'].includes(state) ? '#EF476F' :
                        ['surprised', 'focus_enter'].includes(state) ? '#FFD166' :
                        ['working', 'typing', 'saving', 'tool_using', 'file_reading', 'file_writing', 'command_running', 'syncing', 'dragging'].includes(state) ? '#118AB2' :
                        '#0df259'
                      }
                      stroke="#1a1a1a" strokeWidth="4"
                      className="transition-all duration-300 dark:stroke-white"
                  >
                      {['thinking', 'searching', 'navigating', 'search_empty'].includes(state) && <animate attributeName="fill" values="#EF476F;#FFD166;#EF476F" dur="0.5s" repeatCount="indefinite" />}
                      {['happy', 'celebrating', 'search_found', 'synced', 'completed', 'saved'].includes(state) && <animate attributeName="fill" values="#0df259;#118AB2;#0df259" dur="0.8s" repeatCount="indefinite" />}
                      {['sad', 'error', 'sync_error'].includes(state) && <animate attributeName="fill" values="#EF476F;#FF6B6B;#EF476F" dur="1s" repeatCount="indefinite" />}
                  </circle>
              </g>

              {/* Face Expressions - Extended states */}
              <g className="dark:[&_path]:stroke-white dark:[&_circle]:fill-white">
                {/* IDLE - Default blinking */}
                {(state === 'idle' || state === 'dragging' || state === 'dropped') && (
                  <g className="animate-blink" style={{ transformOrigin: '100px 100px' }}>
                      <circle cx="80" cy="100" r="8" fill="#1a1a1a" />
                      <circle cx="120" cy="100" r="8" fill="#1a1a1a" />
                      <path d="M90 120 Q100 125 110 120" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
                {/* THINKING - Processing/Analysis */}
                {(state === 'thinking' || state === 'searching' || state === 'navigating' || state === 'search_empty') && (
                  <g>
                      <path d="M75 100 L95 100" stroke="#0df259" strokeWidth="4" strokeLinecap="round" />
                      <path d="M115 100 L135 100" stroke="#0df259" strokeWidth="4" strokeLinecap="round" />
                      <path d="M95 120 Q105 125 115 120" fill="none" stroke="#0df259" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
                {/* HAPPY/CELEBRATING - Success states */}
                {(state === 'happy' || state === 'celebrating' || state === 'search_found' || state === 'synced' || state === 'completed' || state === 'saved' || state === 'connected') && (
                  <g>
                      <path d="M75 105 L85 95 L95 105" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M105 105 L115 95 L125 105" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M85 120 Q100 135 115 120" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
                  </g>
                )}
                {/* WORKING/TYPING - Active work states */}
                {(state === 'working' || state === 'typing' || state === 'saving' || state === 'tool_using' || state === 'file_reading' || state === 'file_writing' || state === 'command_running' || state === 'syncing') && (
                  <g transform="translate(0, 5)">
                      <circle cx="80" cy="100" r="14" fill="#ffffff" stroke="#1a1a1a" strokeWidth="3" className="dark:fill-gray-800" />
                      <circle cx="120" cy="100" r="14" fill="#ffffff" stroke="#1a1a1a" strokeWidth="3" className="dark:fill-gray-800" />
                      <line x1="94" y1="100" x2="106" y2="100" stroke="#1a1a1a" strokeWidth="3" />
                      <circle cx="80" cy="100" r="4" fill="#1a1a1a"><animate attributeName="cx" values="76;84;76" dur="2s" repeatCount="indefinite" /></circle>
                      <circle cx="120" cy="100" r="4" fill="#1a1a1a"><animate attributeName="cx" values="116;124;116" dur="2s" repeatCount="indefinite" /></circle>
                  </g>
                )}
                {/* SURPRISED - Focus mode enter */}
                {(state === 'surprised' || state === 'focus_enter') && (
                  <g>
                      <circle cx="80" cy="100" r="12" fill="#1a1a1a" />
                      <circle cx="120" cy="100" r="12" fill="#1a1a1a" />
                      <circle cx="80" cy="100" r="5" fill="#ffffff" />
                      <circle cx="120" cy="100" r="5" fill="#ffffff" />
                      <ellipse cx="100" cy="125" rx="15" ry="8" fill="#1a1a1a" />
                  </g>
                )}
                {/* SAD/ERROR - Error states */}
                {(state === 'sad' || state === 'error' || state === 'sync_error' || state === 'disconnected') && (
                  <g>
                      <circle cx="80" cy="105" r="8" fill="#1a1a1a" />
                      <circle cx="120" cy="105" r="8" fill="#1a1a1a" />
                      <path d="M85 125 Q100 115 115 125" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
                      <path d="M70 90 L90 100" stroke="#EF476F" strokeWidth="2" strokeLinecap="round" />
                      <path d="M130 90 L110 100" stroke="#EF476F" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
                {/* CONNECTING - Pulsing */}
                {(state === 'connecting' || state === 'focus_exit') && (
                  <g className="animate-pulse">
                      <circle cx="80" cy="100" r="8" fill="#1a1a1a" />
                      <circle cx="120" cy="100" r="8" fill="#1a1a1a" />
                      <path d="M90 120 Q100 122 110 120" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
              </g>

              {/* Arms - Extended states */}
              <g className="dark:[&_path]:stroke-white dark:[&_circle]:stroke-white">
                {/* IDLE/DRAGGING/DROPPED */}
                {(state === 'idle' || state === 'dragging' || state === 'dropped') && (
                  <>
                    <path d="M40 120 Q20 140 40 160" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
                    <path d="M160 120 Q180 140 160 160" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
                  </>
                )}
                {/* HAPPY/CELEBRATING */}
                {(state === 'happy' || state === 'celebrating' || state === 'search_found' || state === 'synced' || state === 'completed' || state === 'saved' || state === 'connected') && (
                   <>
                    <path d="M40 110 Q20 80 30 60" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round"><animate attributeName="d" values="M40 110 Q20 80 30 60; M40 110 Q10 90 20 70; M40 110 Q20 80 30 60" dur="0.6s" repeatCount="indefinite" /></path>
                    <path d="M160 110 Q180 80 170 60" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round"><animate attributeName="d" values="M160 110 Q180 80 170 60; M160 110 Q190 90 180 70; M160 110 Q180 80 170 60" dur="0.6s" repeatCount="indefinite" /></path>
                   </>
                )}
                {/* THINKING/SEARCHING */}
                {(state === 'thinking' || state === 'searching' || state === 'navigating' || state === 'search_empty') && (
                   <>
                    <path d="M40 130 Q20 150 40 170" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
                    <path d="M160 140 L130 150 L110 135" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                   </>
                )}
                {/* WORKING/TYPING/SYNCING - All active work states */}
                {(state === 'working' || state === 'typing' || state === 'saving' || state === 'tool_using' || state === 'file_reading' || state === 'file_writing' || state === 'command_running' || state === 'syncing') && (
                   <>
                    <circle cx="60" cy="150" r="12" fill="#0df259" stroke="#1a1a1a" strokeWidth="3" className="animate-type dark:fill-primary" style={{ animationDelay: '0s' }} />
                    <circle cx="140" cy="150" r="12" fill="#0df259" stroke="#1a1a1a" strokeWidth="3" className="animate-type dark:fill-primary" style={{ animationDelay: '0.05s' }} />
                    <path d="M30 170 L170 170" stroke="#118AB2" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                   </>
                )}
                {/* SURPRISED */}
                {(state === 'surprised' || state === 'focus_enter') && (
                   <>
                    <path d="M40 100 Q10 90 20 70" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round">
                        <animate attributeName="d" values="M40 100 Q10 90 20 70; M40 100 Q5 80 15 60; M40 100 Q10 90 20 70" dur="0.3s" repeatCount="indefinite" />
                    </path>
                    <path d="M160 100 Q190 90 180 70" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round">
                        <animate attributeName="d" values="M160 100 Q190 90 180 70; M160 100 Q195 80 185 60; M160 100 Q190 90 180 70" dur="0.3s" repeatCount="indefinite" />
                    </path>
                   </>
                )}
                {/* SAD/ERROR */}
                {(state === 'sad' || state === 'error' || state === 'sync_error' || state === 'disconnected') && (
                   <>
                    <path d="M40 140 Q30 160 50 170" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
                    <path d="M160 140 Q170 160 150 170" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
                   </>
                )}
                {/* CONNECTING */}
                {(state === 'connecting' || state === 'focus_exit') && (
                   <>
                    <path d="M40 120 Q10 120 20 100" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round">
                        <animate attributeName="d" values="M40 120 Q10 120 20 100; M40 120 Q5 110 15 90; M40 120 Q10 120 20 100" dur="1s" repeatCount="indefinite" />
                    </path>
                    <path d="M160 120 Q190 120 180 100" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round">
                        <animate attributeName="d" values="M160 120 Q190 120 180 100; M160 120 Q195 110 185 90; M160 120 Q190 120 180 100" dur="1s" repeatCount="indefinite" />
                    </path>
                   </>
                )}
              </g>
          </g>
        </svg>
      </div>
    );
  }

  // --- SKIN: CYBER CAT ---
  if (activeSkin === 'cat') {
    return (
      <div className={`relative w-32 h-32 ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
           <ellipse cx="100" cy="190" rx="60" ry="10" fill="#1a1a1a" opacity="0.2" className="dark:fill-black" />
           
           <g className={`${bodyAnim} transition-all duration-500`}>
              {/* Tail */}
              <path 
                d="M160 160 Q190 140 180 110" 
                fill="none" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" 
                className={`dark:stroke-white ${state === 'happy' ? 'animate-[wiggle_1s_infinite]' : ''}`}
              />

              {/* Body (Loaf Shape) */}
              <path 
                d="M40 180 L160 180 Q170 180 170 150 L170 120 Q170 60 100 60 Q30 60 30 120 L30 150 Q30 180 40 180"
                fill={state === 'thinking' ? '#118AB2' : '#ffffff'}
                stroke="#1a1a1a" strokeWidth="6"
                className="transition-colors dark:fill-gray-800 dark:stroke-white"
              />

              {/* Ears */}
              <path d="M40 70 L30 30 L70 50" fill="#EF476F" stroke="#1a1a1a" strokeWidth="6" strokeLinejoin="round" className="dark:stroke-white" />
              <path d="M160 70 L170 30 L130 50" fill="#EF476F" stroke="#1a1a1a" strokeWidth="6" strokeLinejoin="round" className="dark:stroke-white" />

              {/* Face */}
              <g className="dark:[&_path]:stroke-white dark:[&_circle]:fill-white">
                 {/* Whiskers */}
                 <line x1="20" y1="120" x2="40" y2="125" stroke="#1a1a1a" strokeWidth="3" />
                 <line x1="20" y1="130" x2="40" y2="130" stroke="#1a1a1a" strokeWidth="3" />
                 <line x1="180" y1="120" x2="160" y2="125" stroke="#1a1a1a" strokeWidth="3" />
                 <line x1="180" y1="130" x2="160" y2="130" stroke="#1a1a1a" strokeWidth="3" />

                 {state === 'idle' && (
                    <g className="animate-blink" style={{ transformOrigin: '100px 120px' }}>
                        <circle cx="70" cy="110" r="6" fill="#1a1a1a" />
                        <circle cx="130" cy="110" r="6" fill="#1a1a1a" />
                        <path d="M90 130 Q100 135 110 130" fill="none" stroke="#1a1a1a" strokeWidth="3" />
                    </g>
                 )}
                 {state === 'happy' && (
                    <g>
                        <path d="M60 110 Q70 100 80 110" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
                        <path d="M120 110 Q130 100 140 110" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
                        <path d="M90 125 Q100 140 110 125" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
                    </g>
                 )}
                 {state === 'thinking' && (
                    <g>
                        <circle cx="70" cy="110" r="8" fill="#FFD166" />
                        <circle cx="130" cy="110" r="8" fill="#FFD166" />
                        <path d="M90 130 L110 130" stroke="#1a1a1a" strokeWidth="3" />
                        {/* Loading bubble */}
                        <circle cx="160" cy="80" r="4" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" /></circle>
                        <circle cx="170" cy="70" r="6" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.2s" repeatCount="indefinite" /></circle>
                    </g>
                 )}
                 {state === 'working' && (
                    <g>
                       {/* Cyber Glasses */}
                       <rect x="50" y="100" width="100" height="25" rx="5" fill="#1a1a1a" className="dark:fill-white" />
                       <line x1="50" y1="112" x2="150" y2="112" stroke="#0df259" strokeWidth="2" className="dark:stroke-black" />
                       <path d="M80 160 L120 160" stroke="#1a1a1a" strokeWidth="4" />
                       <g className="animate-type">
                          <circle cx="60" cy="160" r="10" fill="#EF476F" stroke="#1a1a1a" strokeWidth="2" />
                          <circle cx="140" cy="160" r="10" fill="#EF476F" stroke="#1a1a1a" strokeWidth="2" />
                       </g>
                    </g>
                 )}
              </g>
           </g>
        </svg>
      </div>
    );
  }

  // --- SKIN: CORE ORB ---
  if (activeSkin === 'orb') {
    return (
      <div className={`relative w-32 h-32 ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {/* Energy Field (Shadow) */}
            <ellipse cx="100" cy="180" rx="40" ry="10" fill="#118AB2" opacity="0.3" className="animate-pulse">
               <animate attributeName="rx" values="30;50;30" dur="2s" repeatCount="indefinite" />
            </ellipse>

            <g className={`${state === 'idle' ? 'animate-float' : ''}`} style={{ transformOrigin: 'center' }}>
                
                {/* Outer Rings */}
                <g className="animate-spin-slow" style={{ transformOrigin: '100px 100px' }}>
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="10 10" className="dark:stroke-white" opacity="0.3" />
                </g>
                <g className="animate-spin-slow" style={{ transformOrigin: '100px 100px', animationDuration: '8s', animationDirection: 'reverse' }}>
                     <ellipse cx="100" cy="100" rx="85" ry="30" fill="none" stroke="#1a1a1a" strokeWidth="2" className="dark:stroke-white" opacity="0.2" transform="rotate(45 100 100)" />
                </g>

                {/* Main Sphere */}
                <circle 
                  cx="100" cy="100" r="50" 
                  fill={state === 'working' ? '#1a1a1a' : '#ffffff'} 
                  stroke="#1a1a1a" strokeWidth="4" 
                  className="dark:fill-gray-900 dark:stroke-white transition-colors duration-500"
                />

                {/* The "Eye" (Core) */}
                <g transform="translate(100, 100)">
                    {state === 'idle' && (
                       <circle cx="0" cy="0" r="15" fill="#118AB2" className="animate-pulse-glow">
                          <animate attributeName="r" values="15;18;15" dur="3s" repeatCount="indefinite" />
                       </circle>
                    )}
                    
                    {state === 'thinking' && (
                       <g className="animate-spin" style={{ animationDuration: '2s' }}>
                          <rect x="-15" y="-15" width="30" height="30" rx="4" fill="#FFD166" stroke="#1a1a1a" strokeWidth="3" />
                          <circle cx="0" cy="0" r="5" fill="#1a1a1a" />
                       </g>
                    )}

                    {state === 'happy' && (
                       <g>
                           <path d="M-15 -5 Q0 10 15 -5" fill="none" stroke="#EF476F" strokeWidth="5" strokeLinecap="round" />
                           <circle cx="-20" cy="-10" r="5" fill="#EF476F" className="animate-pop" />
                           <circle cx="20" cy="-10" r="5" fill="#EF476F" className="animate-pop" />
                       </g>
                    )}

                    {state === 'working' && (
                        <g>
                            <circle cx="0" cy="0" r="15" fill="#0df259" className="animate-ping" opacity="0.5" />
                            <circle cx="0" cy="0" r="10" fill="#0df259" />
                            <path d="M-25 0 L-40 0" stroke="#0df259" strokeWidth="2" />
                            <path d="M25 0 L40 0" stroke="#0df259" strokeWidth="2" />
                            <path d="M0 -25 L0 -40" stroke="#0df259" strokeWidth="2" />
                            <path d="M0 25 L0 40" stroke="#0df259" strokeWidth="2" />
                        </g>
                    )}
                </g>
            </g>
        </svg>
      </div>
    );
  }

  return null;
};