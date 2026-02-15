import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { GalaxyView } from './pages/GalaxyView';
import { Taxonomy } from './pages/Taxonomy';
import { Habitat } from './pages/Habitat';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { Timeline } from './pages/Timeline';
import { Analytics } from './pages/Analytics';
import { Templates } from './pages/Templates';
import { FocusMode } from './pages/FocusMode';
import { PublicGateway } from './pages/PublicGateway';
import { Spark } from './pages/Spark'; 
import { AnimatedLogo } from './components/AnimatedLogo';
import { DraggableMascot } from './components/DraggableMascot';
import { CommandPalette } from './components/CommandPalette';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  // Track the view before entering focus mode to restore it properly
  const [previousView, setPreviousView] = useState<View>(View.DASHBOARD);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { theme } = useTheme();

  // Focus Mode Transition States
  const [focusState, setFocusState] = useState<'idle' | 'expanding' | 'active' | 'collapsing'>('idle');
  const [focusOrigin, setFocusOrigin] = useState<DOMRect | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNote = (noteId: string) => {
      setActiveNoteId(noteId);
      setCurrentView(View.EDITOR);
  };

  const handleEnterFocusMode = (rect: DOMRect) => {
      setPreviousView(currentView); // Save the current view state
      setFocusOrigin(rect);
      setFocusState('expanding');
      // Note: We keep currentView as is during expansion so the background doesn't flash empty
  };

  const handleExitFocusMode = () => {
      setFocusState('collapsing');
      // Crucial: Restore the main view IMMEDIATELY so it renders behind the collapsing overlay
      setCurrentView(previousView);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-light dark:bg-dark flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
         <div className="absolute inset-0 bg-dot-pattern opacity-20 dark:opacity-10"></div>
         
         <div className="w-32 h-32 mb-8 animate-bounce-slow">
            <AnimatedLogo />
         </div>
         
         <h1 className="text-6xl font-display font-black text-ink dark:text-white mb-2 tracking-tight">vicoo</h1>
         <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-ink dark:border-white/50 mt-4">
            <div className="h-full bg-primary animate-[wiggle_1s_infinite] w-full origin-left"></div>
         </div>
         <p className="mt-4 text-sm font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Initializing Visual Core...</p>
      </div>
    );
  }

  // --- FOCUS MODE OVERLAY ---
  const isFocusOverlayVisible = focusState !== 'idle';
  
  return (
    <div className="flex h-screen overflow-hidden bg-light dark:bg-dark font-sans text-ink dark:text-gray-100 selection:bg-primary selection:text-ink transition-colors duration-300">
      
      {/* FOCUS MODE TRANSITION LAYER */}
      {isFocusOverlayVisible && (
          <FocusTransitionLayer 
            state={focusState} 
            origin={focusOrigin} 
            isDarkMode={theme === 'dark'}
            onExpandComplete={() => {
                setFocusState('active');
                setCurrentView(View.FOCUS); // Only now do we unmount the background content
            }}
            onCollapseComplete={() => {
                setFocusState('idle');
                setFocusOrigin(null);
                // No need to set currentView here, we did it on exit request
            }}
            onExitRequest={handleExitFocusMode}
          />
      )}

      {/* Global Modals */}
      <DraggableMascot />
      <CommandPalette 
        isOpen={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)} 
        onNavigate={setCurrentView} 
      />

      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView === View.FOCUS ? previousView : currentView} // Keep sidebar indicating previous view during focus
        onChangeView={setCurrentView} 
        onEnterFocusMode={handleEnterFocusMode} 
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none z-0 dark:opacity-5"></div>
        <div className="relative z-10 h-full">
           {renderContent(currentView, setCurrentView, handleOpenNote)}
        </div>
      </main>
      
      {/* Global Quick Actions FAB (Hidden in Focus) */}
      {focusState === 'idle' && (
        <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
            <button 
            onClick={() => { setActiveNoteId(null); setCurrentView(View.EDITOR); }}
            className="w-16 h-16 bg-primary border-4 border-ink dark:border-white rounded-full shadow-neo dark:shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-neo-lg dark:hover:shadow-[6px_6px_0px_0px_#ffffff] hover:-translate-y-1 active:shadow-neo-sm active:translate-y-0 transition-all flex items-center justify-center group pointer-events-auto text-ink"
            title="New Note"
            >
            <span className="material-icons-round text-3xl group-hover:rotate-90 transition-transform">add</span>
            </button>
        </div>
      )}
    </div>
  );
};

// Helper to extract content rendering
const renderContent = (view: View, setView: any, openNote: any) => {
    switch (view) {
      case View.DASHBOARD: return <Dashboard onNavigate={setView} />;
      case View.SEARCH: return <Search />;
      case View.LIBRARY: return <Library onOpenNote={openNote} />;
      case View.GALAXY: return <GalaxyView />;
      case View.TAXONOMY: return <Taxonomy />;
      case View.HABITAT: return <Habitat />;
      case View.EDITOR: return <Editor initialNoteId={null} />;
      case View.SETTINGS: return <Settings />;
      case View.TIMELINE: return <Timeline />;
      case View.ANALYTICS: return <Analytics />;
      case View.TEMPLATES: return <Templates />;
      case View.SPARK: return <Spark />;
      case View.PUBLIC_GATEWAY: return <PublicGateway onLogin={() => setView(View.DASHBOARD)} />;
      case View.FOCUS: return null; // Rendered in Overlay
      default: return <Dashboard onNavigate={setView} />;
    }
}

// --- ISOLATED TRANSITION COMPONENT ---
const FocusTransitionLayer: React.FC<{
    state: 'idle' | 'expanding' | 'active' | 'collapsing';
    origin: DOMRect | null;
    isDarkMode: boolean;
    onExpandComplete: () => void;
    onCollapseComplete: () => void;
    onExitRequest: () => void;
}> = ({ state, origin, isDarkMode, onExpandComplete, onCollapseComplete, onExitRequest }) => {
    const [style, setStyle] = useState<React.CSSProperties>({});
    const [showContent, setShowContent] = useState(false);

    // Initial Button Color -> Target Glass Color
    const startColor = isDarkMode ? '#f3f4f6' : '#1a1a1a'; // bg-gray-100 (white-ish) or bg-ink
    // Target is a deep, slightly transparent black for glassmorphism over the dashboard
    const endColor = 'rgba(16, 16, 16, 0.95)'; // Increased opacity for better legibility

    useLayoutEffect(() => {
        if (!origin) return;

        // ANIMATION CONFIGURATION
        // We use different durations for geometry vs color to prevent "pop" artifacts in glass children.
        // Geometry: 0.8s (Slow, silky expansion)
        // Color: 0.4s (Fast stabilization to dark mode so child glass doesn't flicker)
        const transitionString = `
            width 0.8s cubic-bezier(0.19, 1, 0.22, 1), 
            height 0.8s cubic-bezier(0.19, 1, 0.22, 1), 
            top 0.8s cubic-bezier(0.19, 1, 0.22, 1), 
            left 0.8s cubic-bezier(0.19, 1, 0.22, 1), 
            background-color 0.4s ease-out, 
            border-radius 0.8s cubic-bezier(0.19, 1, 0.22, 1),
            backdrop-filter 0.8s ease
        `;

        // Start State: Matches the Sidebar Button perfectly
        const collapsedStyle: React.CSSProperties = {
            position: 'fixed',
            top: origin.top,
            left: origin.left,
            width: origin.width,
            height: origin.height,
            borderRadius: '0.75rem', // Match rounded-xl
            zIndex: 9999,
            overflow: 'hidden',
            backgroundColor: startColor,
            backdropFilter: 'blur(0px)',
            boxShadow: '0 0 0 0 rgba(0,0,0,0)',
            transition: transitionString.replace(/\n/g, ''),
        };

        // End State: Full Screen Glass
        const expandedStyle: React.CSSProperties = {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: '0px',
            zIndex: 9999,
            overflow: 'hidden',
            backgroundColor: endColor,
            backdropFilter: 'blur(32px)', // Stronger blur
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transition: transitionString.replace(/\n/g, ''),
        };

        if (state === 'expanding') {
            setStyle(collapsedStyle);
            
            // Trigger transition next frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setStyle(expandedStyle);
                });
            });

            // Fade content in ONLY after the background has mostly stabilized (0.5s > 0.4s bg trans)
            // This prevents the "gray to black" jump in the child glass elements
            const timer = setTimeout(() => setShowContent(true), 500);
            return () => clearTimeout(timer);
        }

        if (state === 'active') {
            setStyle(expandedStyle);
            setShowContent(true);
        }

        if (state === 'collapsing') {
            setShowContent(false);
            setStyle(expandedStyle);
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setStyle(collapsedStyle);
                });
            });
        }
    }, [state, origin, isDarkMode]);

    const handleTransitionEnd = (e: React.TransitionEvent) => {
        if (e.target !== e.currentTarget) return;
        
        // Use 'width' or 'top' as a proxy for completion
        if (e.propertyName === 'width') {
             if (state === 'expanding') onExpandComplete();
             if (state === 'collapsing') onCollapseComplete();
        }
    };

    return (
        <div 
            style={style} 
            className="will-change-[top,left,width,height,border-radius,background-color]"
            onTransitionEnd={handleTransitionEnd}
        >
            <div 
                className={`w-full h-full transition-opacity duration-500 ease-out ${showContent ? 'opacity-100' : 'opacity-0'}`}
            >
               <FocusMode onExit={onExitRequest} />
            </div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;