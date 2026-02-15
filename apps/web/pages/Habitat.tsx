import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { Mascot } from '../components/Mascot';
import { NeoButton } from '../components/NeoButton';
import { NeoModal } from '../components/NeoModal';

export const Habitat: React.FC = () => {
  const [isOrphanModalOpen, setIsOrphanModalOpen] = useState(false);
  const [currentOrphanIndex, setCurrentOrphanIndex] = useState(0);

  // Mock Orphans
  const orphans = [
      { id: 1, title: 'Grocery List: Avocados', preview: 'Need to buy avocados for the toast...', date: '3 days ago' },
      { id: 2, title: 'Shower thought about Aliens', preview: 'If they exist, why haven\'t they called?', date: '1 week ago' },
      { id: 3, title: 'CSS Grid vs Flexbox', preview: 'Grid is for layout, Flex is for alignment...', date: '2 weeks ago' }
  ];

  const handleLinkOrphan = () => {
      // Simulate linking logic
      if (currentOrphanIndex < orphans.length - 1) {
          setCurrentOrphanIndex(prev => prev + 1);
      } else {
          setIsOrphanModalOpen(false);
          setCurrentOrphanIndex(0);
          // Show success toast in real app
      }
  };

  const currentOrphan = orphans[currentOrphanIndex];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 h-full flex flex-col">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">Garden Monitor</h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">System health, maintenance quests, and analytics.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-100 border-2 border-green-600 text-green-800 px-3 py-1 rounded-full font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
            System Online
        </div>
      </header>

      {/* ORPHAN RESOLVER MODAL */}
      <NeoModal 
        isOpen={isOrphanModalOpen} 
        onClose={() => setIsOrphanModalOpen(false)}
        title="Orphan Resolver"
        icon="link_off"
        footer={
            <>
                <NeoButton variant="secondary" onClick={() => setIsOrphanModalOpen(false)}>Skip for Now</NeoButton>
                <NeoButton onClick={handleLinkOrphan}>Link & Archive</NeoButton>
            </>
        }
      >
        <div className="flex flex-col gap-6">
            <div className="bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-700 p-4 rounded-xl flex gap-3 items-start">
                <Mascot state="thinking" className="w-12 h-12 shrink-0" />
                <div>
                    <p className="font-bold text-sm text-orange-800 dark:text-orange-200">Why fix this?</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">This note has 0 connections. Connecting it increases the chance of rediscovery by 40%.</p>
                </div>
            </div>

            <div className="text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Current Orphan ({currentOrphanIndex + 1}/{orphans.length})</p>
                <NeoCard className="p-6 text-left">
                    <h3 className="font-bold text-xl mb-2">{currentOrphan?.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 italic">"{currentOrphan?.preview}"</p>
                    <div className="mt-4 flex gap-2 overflow-x-auto">
                        <span className="bg-gray-100 dark:bg-gray-700 text-xs font-bold px-2 py-1 rounded border border-gray-300 dark:border-gray-600">Uncategorized</span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-xs font-bold px-2 py-1 rounded border border-gray-300 dark:border-gray-600">{currentOrphan?.date}</span>
                    </div>
                </NeoCard>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 font-bold">Connect To</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold mb-2">Search existing nodes...</label>
                <div className="relative">
                    <input type="text" placeholder="Type to search..." className="w-full border-3 border-ink dark:border-gray-500 rounded-xl px-4 py-3 font-bold focus:ring-0 bg-white dark:bg-gray-800 text-ink dark:text-white" />
                    <span className="material-icons-round absolute right-3 top-3 text-gray-400">search</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-gray-400">Suggested:</span>
                    <button className="bg-info/20 text-info border-2 border-info/20 px-2 py-1 rounded-lg text-xs font-bold hover:bg-info hover:text-white transition-colors">Food</button>
                    <button className="bg-info/20 text-info border-2 border-info/20 px-2 py-1 rounded-lg text-xs font-bold hover:bg-info hover:text-white transition-colors">Health</button>
                </div>
            </div>
        </div>
      </NeoModal>

      {/* TOP ANALYTICS STRIP (Merged from Analytics.tsx) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         {[
            { label: 'Total Notes', value: '1,248', icon: 'article', color: 'bg-primary' },
            { label: 'Recall Rate', value: '84%', icon: 'psychology', color: 'bg-secondary' },
            { label: 'Connections', value: '3,402', icon: 'hub', color: 'bg-accent' },
            { label: 'Orphans', value: orphans.length.toString(), icon: 'link_off', color: 'bg-orange-300' },
         ].map((stat, i) => (
            <NeoCard key={i} className="p-4 flex items-center gap-4">
               <div className={`w-12 h-12 ${stat.color} border-2 border-ink rounded-xl flex items-center justify-center shadow-neo-sm text-ink`}>
                  <span className="material-icons-round text-2xl">{stat.icon}</span>
               </div>
               <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{stat.label}</p>
                  <p className="text-2xl font-black text-ink dark:text-white">{stat.value}</p>
               </div>
            </NeoCard>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* Main Health Monitor / Maintenance Console */}
        <div className="lg:col-span-2 flex flex-col gap-8">

           {/* Maintenance Console */}
           <NeoCard className="p-0 overflow-hidden min-h-[400px] flex flex-col">
              <div className="bg-gray-900 text-white p-4 border-b-3 border-ink flex justify-between items-center">
                  <span className="font-mono font-bold flex items-center gap-2">
                      <span className="material-icons-round text-sm">terminal</span>
                      GARDEN_MAINTENANCE.exe
                  </span>
                  <span className="text-xs font-mono text-gray-400">v2.1.0</span>
              </div>
              
              <div className="flex-1 p-6 bg-white dark:bg-gray-800 relative">
                  {/* Decor Background */}
                  <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none"></div>

                  <div className="flex gap-6 items-start">
                      <Mascot state="working" className="w-32 h-32 shrink-0 hidden sm:block" />
                      
                      <div className="flex-1 space-y-4">
                          <h3 className="font-bold text-lg border-b-2 border-ink/10 dark:border-white/10 pb-2 text-ink dark:text-white">Action Required</h3>
                          
                          {/* Quest 1 - LINKED TO MODAL */}
                          <div 
                            onClick={() => setIsOrphanModalOpen(true)}
                            className="bg-white dark:bg-gray-900 border-2 border-ink dark:border-gray-500 rounded-xl p-4 shadow-sm hover:shadow-neo-sm transition-shadow cursor-pointer group"
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-red-500 flex items-center gap-1">
                                      <span className="material-icons-round text-sm">link_off</span> High Priority
                                  </span>
                                  <span className="bg-gray-100 dark:bg-gray-700 text-xs font-bold px-2 py-1 rounded text-ink dark:text-white">+50 XP</span>
                              </div>
                              <h4 className="font-bold text-lg mb-1 group-hover:underline text-ink dark:text-white">Connect Orphaned Nodes</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {orphans.length} notes have zero connections. Linking them improves retrieval accuracy by 15%.
                              </p>
                              <NeoButton size="sm" className="w-full">Review Orphans</NeoButton>
                          </div>

                          {/* Quest 2 */}
                          <div className="bg-white dark:bg-gray-900 border-2 border-ink dark:border-gray-500 rounded-xl p-4 shadow-sm hover:shadow-neo-sm transition-shadow cursor-pointer group opacity-75 hover:opacity-100">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-yellow-600 flex items-center gap-1">
                                      <span className="material-icons-round text-sm">history</span> Stale Data
                                  </span>
                                  <span className="bg-gray-100 dark:bg-gray-700 text-xs font-bold px-2 py-1 rounded text-ink dark:text-white">+20 XP</span>
                              </div>
                              <h4 className="font-bold text-lg mb-1 group-hover:underline text-ink dark:text-white">Archive Old Meetings</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  5 meeting notes from last year haven't been opened recently.
                              </p>
                              <NeoButton size="sm" variant="secondary" className="w-full">Review List</NeoButton>
                          </div>
                      </div>
                  </div>
              </div>
           </NeoCard>

           {/* Activity Chart (Merged from Analytics) */}
           <NeoCard className="p-6 h-[300px] flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-ink dark:text-white">Input Frequency</h3>
                  <select className="bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-2 py-1 font-bold text-sm text-ink dark:text-white">
                     <option>Last 30 Days</option>
                  </select>
               </div>
               <div className="flex-1 flex items-end justify-between gap-2 px-4 border-b-2 border-l-2 border-ink/10 dark:border-white/10 pb-2">
                  {[40, 65, 30, 80, 55, 90, 45, 70, 50, 60, 85, 95].map((h, i) => (
                     <div key={i} className="w-full bg-primary/20 border-2 border-primary rounded-t-lg relative group hover:bg-primary transition-colors cursor-pointer" style={{ height: `${h}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                           {h * 10} inputs
                        </div>
                     </div>
                  ))}
               </div>
               <div className="flex justify-between px-4 mt-2 text-xs font-bold text-gray-400 uppercase">
                  <span>Jan</span><span>Dec</span>
               </div>
           </NeoCard>
        </div>

        {/* Sidebar: Brain Map & Taxonomy Pie */}
        <div className="space-y-6">
           <NeoCard className="p-6">
              <h3 className="text-xl font-bold mb-4 text-ink dark:text-white">Heatmap</h3>
              {/* Simple Grid Viz */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                 {Array.from({ length: 35 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`
                        aspect-square rounded-sm border border-black/10 dark:border-white/10 transition-colors hover:border-black dark:hover:border-white
                        ${Math.random() > 0.6 ? 'bg-primary' : Math.random() > 0.8 ? 'bg-secondary' : 'bg-gray-100 dark:bg-gray-700'}
                      `}
                      title="2 Notes Created"
                    ></div>
                 ))}
              </div>
              <p className="text-xs font-bold text-gray-500 text-center">Consistent input improves model training.</p>
           </NeoCard>

           {/* Taxonomy Pie (Merged from Analytics) */}
           <NeoCard color="info" className="p-6">
               <h3 className="text-xl font-bold mb-4 text-white">Data Distribution</h3>
               <div className="flex items-center justify-center relative mb-6">
                  {/* CSS Pie Chart */}
                  <div className="w-40 h-40 rounded-full border-4 border-ink shadow-neo relative overflow-hidden" style={{ background: 'conic-gradient(#0df259 0% 35%, #FFD166 35% 60%, #EF476F 60% 85%, #fff 85% 100%)' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-12 h-12 bg-info border-3 border-ink rounded-full"></div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-secondary border border-ink rounded-full"></div><span className="font-bold text-xs text-white">Code (35%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary border border-ink rounded-full"></div><span className="font-bold text-xs text-white">Meet (25%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-accent border border-ink rounded-full"></div><span className="font-bold text-xs text-white">Design (25%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-ink rounded-full"></div><span className="font-bold text-xs text-white">Idea (15%)</span></div>
               </div>
           </NeoCard>
           
           <div className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-400 rounded-2xl p-6 text-center">
               <span className="material-icons-round text-3xl text-gray-400 mb-2">backup</span>
               <p className="font-bold text-gray-500 dark:text-gray-400">Last Backup: 2h ago</p>
               <button className="text-sm font-bold text-ink dark:text-white underline mt-2 hover:text-primary">Backup Now</button>
           </div>
        </div>
      </div>
    </div>
  );
};