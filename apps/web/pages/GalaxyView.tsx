import React, { useState, useRef, useEffect } from 'react';
import { NeoButton } from '../components/NeoButton';
import { AnimatedPlanet } from '../components/AnimatedPlanet';
import { Mascot } from '../components/Mascot';
import { Node, Link } from '../types';

// Enhanced Data with context
const initialNodes: Node[] = [
  { 
      id: 'python', x: 0, y: 0, label: 'Python', icon: 'code', color: 'bg-info', type: 'planet',
      description: 'Core scripting language for backend services and data processing.',
      tags: ['Backend', 'Scripting', 'v3.11']
  },
  { 
      id: 'ui', x: 300, y: -50, label: 'UI Design', icon: 'palette', color: 'bg-accent', type: 'planet',
      description: 'Design system tokens, component libraries, and visual guidelines.',
      tags: ['Figma', 'CSS', 'Neobrutalism']
  },
  { 
      id: 'phil', x: -150, y: 250, label: 'Philosophy', icon: 'psychology', color: 'bg-secondary', type: 'planet',
      description: 'Mental models, ethics in AI, and first-principles thinking.',
      tags: ['Mental Models', 'Ethics']
  },
  { 
      id: 'sys', x: 400, y: 200, label: 'Systems', icon: 'dns', color: 'bg-primary', type: 'planet',
      description: 'Infrastructure, cloud architecture, and microservices topology.',
      tags: ['AWS', 'Kubernetes', 'Scalability']
  },
];

const initialLinksData: Link[] = [
  { source: 'python', target: 'ui' },
  { source: 'python', target: 'phil' },
  { source: 'ui', target: 'sys' },
];

export const GalaxyView: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [links, setLinks] = useState<Link[]>(initialLinksData);
  
  // Viewport State (Infinite Canvas)
  const [viewport, setViewport] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Interaction State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Linking State (The "Synapse Builder")
  const [isLinking, setIsLinking] = useState(false);
  const [linkStartId, setLinkStartId] = useState<string | null>(null);
  const [mousePosWorld, setMousePosWorld] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Coordinate Conversion
  const screenToWorld = (sx: number, sy: number) => ({
      x: (sx - viewport.x) / viewport.scale,
      y: (sy - viewport.y) / viewport.scale
  });

  // --- Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.2, viewport.scale + delta), 3);
    
    // Zoom centered on view for stability
    setViewport(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseDownBg = (e: React.MouseEvent) => {
      if (e.button === 0) { // Left click
          setIsPanning(true);
          setLastMousePos({ x: e.clientX, y: e.clientY });
          setSelectedNodeId(null); // Deselect on bg click
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setMousePosWorld(worldPos);

      // Pan Logic
      if (isPanning) {
          const dx = e.clientX - lastMousePos.x;
          const dy = e.clientY - lastMousePos.y;
          setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          setLastMousePos({ x: e.clientX, y: e.clientY });
          return;
      }

      // Drag Node Logic
      if (draggingId) {
          setNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: worldPos.x, y: worldPos.y } : n));
      }
  };

  const handleMouseUp = () => {
      setIsPanning(false);
      setDraggingId(null);
      
      // End Linking
      if (isLinking && linkStartId) {
          // Check if dropped on a node is handled in handleMouseUpNode
          setIsLinking(false);
          setLinkStartId(null);
      }
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey || isLinking) {
          setIsLinking(true);
          setLinkStartId(id);
      } else {
          setDraggingId(id);
          setSelectedNodeId(id);
      }
  };

  const handleNodeMouseUp = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLinking && linkStartId && linkStartId !== id) {
          // Create Link
          const exists = links.some(l => 
            (l.source === linkStartId && l.target === id) || 
            (l.source === id && l.target === linkStartId)
          );
          
          if (!exists) {
              setLinks(prev => [...prev, { source: linkStartId, target: id }]);
          }
          setIsLinking(false);
          setLinkStartId(null);
      }
  };

  const handleDoubleClickBg = (e: React.MouseEvent) => {
     const worldPos = screenToWorld(e.clientX, e.clientY);
     const newNode: Node = {
        id: `new-${Date.now()}`,
        x: worldPos.x,
        y: worldPos.y,
        label: 'New Idea',
        icon: 'lightbulb',
        color: 'bg-white',
        type: 'planet',
        description: 'Double-clicked to create.',
        tags: ['Unsorted']
     };
     setNodes(prev => [...prev, newNode]);
     setSelectedNodeId(newNode.id);
  };

  // Search & Focus
  const filteredNodes = nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleFocusNode = (node: Node) => {
      setSelectedNodeId(node.id);
      setViewport({
          x: window.innerWidth / 2 - node.x * viewport.scale,
          y: window.innerHeight / 2 - node.y * viewport.scale,
          scale: 1
      });
      setSearchQuery('');
  };

  const getCoords = (id: string) => nodes.find(n => n.id === id) || { x: 0, y: 0 };

  return (
    <div className="flex h-full relative overflow-hidden bg-[#f0f4f8] dark:bg-[#0a0a0a]">
        
        {/* Canvas Area */}
        <div 
            ref={containerRef}
            className={`
                absolute inset-0 overflow-hidden select-none 
                ${isPanning ? 'cursor-grabbing' : isLinking ? 'cursor-crosshair' : 'cursor-grab'}
            `}
            onWheel={handleWheel}
            onMouseDown={handleMouseDownBg}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClickBg}
        >
            {/* Infinite Grid Pattern that moves with viewport */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 dark:invert"
                style={{
                    backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 1px)',
                    backgroundSize: `${40 * viewport.scale}px ${40 * viewport.scale}px`,
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`
                }}
            />

            {/* World Container */}
            <div 
                className="absolute w-0 h-0 overflow-visible origin-top-left transition-transform duration-75 ease-out"
                style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
            >
                {/* Links Layer */}
                <svg className="overflow-visible pointer-events-none absolute top-0 left-0">
                    {links.map((link, i) => {
                        const start = getCoords(link.source);
                        const end = getCoords(link.target);
                        // Curve logic
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;
                        
                        return (
                            <path 
                                key={i}
                                d={`M ${start.x} ${start.y} Q ${midX} ${midY + 50} ${end.x} ${end.y}`} 
                                fill="none" 
                                stroke="#1a1a1a" 
                                strokeWidth={2 / viewport.scale * 1.5} // Scale stroke so it doesn't get too thin/thick
                                opacity={0.4}
                                className="dark:stroke-white dark:opacity-20"
                            />
                        );
                    })}
                    
                    {/* Active Linking Line */}
                    {isLinking && linkStartId && (
                        <line 
                            x1={getCoords(linkStartId).x} 
                            y1={getCoords(linkStartId).y} 
                            x2={mousePosWorld.x} 
                            y2={mousePosWorld.y} 
                            stroke="#EF476F" 
                            strokeWidth={3 / viewport.scale} 
                            strokeDasharray="10 5"
                            className="animate-pulse"
                        />
                    )}
                </svg>

                {/* Nodes Layer */}
                {nodes.map((node) => (
                    <div 
                        key={node.id}
                        onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                        onMouseUp={(e) => handleNodeMouseUp(node.id, e)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ 
                            left: node.x, 
                            top: node.y, 
                            zIndex: selectedNodeId === node.id ? 50 : 10,
                            // If search active and not matched, dim
                            opacity: searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase()) ? 0.2 : 1
                        }}
                    >
                        <AnimatedPlanet 
                            color={node.color} 
                            icon={node.icon} 
                            label={node.label} 
                            size={120}
                            className={`
                                transition-all duration-300 
                                ${selectedNodeId === node.id ? 'scale-125 drop-shadow-2xl' : 'hover:scale-110'}
                                ${linkStartId === node.id ? 'ring-4 ring-accent rounded-full' : ''}
                            `}
                        />
                        {/* Selection Ring */}
                        {selectedNodeId === node.id && (
                            <div className="absolute inset-0 -m-4 border-2 border-dashed border-ink dark:border-white rounded-full animate-spin-slow pointer-events-none"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* HUD: Search & Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-50">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-3 border-ink dark:border-gray-500 shadow-neo-sm rounded-xl p-2 pointer-events-auto flex items-center gap-2 max-w-md w-full">
                <span className="material-icons-round text-gray-400 ml-2">search</span>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search nodes..." 
                    className="bg-transparent border-none focus:ring-0 font-bold text-ink dark:text-white w-full placeholder-gray-400"
                />
                {searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-xl shadow-neo-lg overflow-hidden">
                        {filteredNodes.length > 0 ? filteredNodes.map(node => (
                            <button 
                                key={node.id}
                                onClick={() => handleFocusNode(node)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-2 text-ink dark:text-white"
                            >
                                <span className="material-icons-round text-sm">{node.icon}</span>
                                {node.label}
                            </button>
                        )) : (
                            <div className="p-4 text-gray-400 italic text-sm text-center">No nodes found</div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="pointer-events-auto flex flex-col gap-2">
                 <div className="bg-white dark:bg-gray-900 border-3 border-ink dark:border-gray-500 rounded-lg shadow-neo-sm p-2 flex flex-col gap-1">
                     <button 
                        onClick={() => setViewport(v => ({ ...v, scale: v.scale * 1.2 }))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-white" title="Zoom In"
                     >
                         <span className="material-icons-round">add</span>
                     </button>
                     <button 
                        onClick={() => setViewport(v => ({ ...v, scale: v.scale * 0.8 }))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-white" title="Zoom Out"
                     >
                         <span className="material-icons-round">remove</span>
                     </button>
                     <button 
                        onClick={() => setViewport({ x: window.innerWidth/2, y: window.innerHeight/2, scale: 1 })}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded dark:text-white" title="Reset View"
                     >
                         <span className="material-icons-round">center_focus_strong</span>
                     </button>
                 </div>
            </div>
        </div>

        {/* Bottom Legend / Hints */}
        <div className="absolute bottom-8 left-8 pointer-events-none z-40">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-3 border-ink dark:border-gray-500 rounded-xl px-4 py-3 pointer-events-auto shadow-neo-sm">
                 <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                     <span className="flex items-center gap-1"><span className="w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800">↔</span> Pan</span>
                     <span className="flex items-center gap-1"><span className="w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800">🖱</span> Zoom</span>
                     <span className="flex items-center gap-1"><span className="px-1 border-2 border-gray-400 rounded bg-gray-100 dark:bg-gray-800">Shift</span> + Drag to Link</span>
                 </div>
            </div>
        </div>

      {/* Slide-over Panel (Same as before but improved Z-Index) */}
      <div 
        className={`
            absolute top-4 bottom-4 right-4 w-96 bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-2xl shadow-neo-lg z-[60] 
            transform transition-transform duration-300 flex flex-col overflow-hidden
            ${selectedNodeId ? 'translate-x-0' : 'translate-x-[120%]'}
        `}
      >
          {selectedNode && (
            <>
                <div className={`p-6 ${selectedNode.color} border-b-3 border-ink dark:border-gray-600 relative`}>
                    <button 
                        onClick={() => setSelectedNodeId(null)}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/50 border-2 border-ink dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-white/80 shadow-neo-sm"
                    >
                        <span className="material-icons-round text-sm text-ink">close</span>
                    </button>
                    <div className="w-12 h-12 bg-white border-2 border-ink dark:border-gray-600 rounded-xl flex items-center justify-center shadow-neo-sm mb-3">
                        <span className="material-icons-round text-2xl text-ink">{selectedNode.icon}</span>
                    </div>
                    <input 
                        type="text" 
                        value={selectedNode.label} 
                        onChange={(e) => {
                            const val = e.target.value;
                            setNodes(prev => prev.map(n => n.id === selectedNode.id ? {...n, label: val} : n));
                        }}
                        className="text-2xl font-bold font-display bg-transparent border-none focus:ring-0 p-0 w-full placeholder-ink/50 text-ink"
                    />
                    <p className="text-xs font-bold opacity-70 uppercase tracking-wider mt-1 text-ink">
                        X: {Math.round(selectedNode.x)}, Y: {Math.round(selectedNode.y)}
                    </p>
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-[#f8fafc] dark:bg-gray-900">
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Context</label>
                        <textarea 
                            value={selectedNode.description}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNodes(prev => prev.map(n => n.id === selectedNode.id ? {...n, description: val} : n));
                            }}
                            className="w-full text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded-xl border-2 border-ink/10 dark:border-gray-600 h-32 resize-none focus:border-primary focus:ring-0 shadow-sm"
                        />
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        <NeoButton size="sm" className="flex-1">Open Note</NeoButton>
                        <NeoButton size="sm" variant="secondary" className="w-10 !px-0 flex items-center justify-center"><span className="material-icons-round text-sm">delete</span></NeoButton>
                    </div>
                </div>
            </>
          )}
      </div>

    </div>
  );
};