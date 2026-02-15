import React, { useState } from 'react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { Mascot } from '../components/Mascot';

interface Category {
    id: string;
    label: string;
    color: string;
    count: number;
    subTags: string[];
}

interface Cluster {
    id: string;
    suggestedLabel: string;
    confidence: number;
    items: string[];
    reason: string;
}

export const Taxonomy: React.FC = () => {
  // Mock AI Clusters instead of raw Inbox
  const [clusters, setClusters] = useState<Cluster[]>([
    { 
        id: 'c1', 
        suggestedLabel: 'Frontend / React', 
        confidence: 94, 
        items: ['Notes from coffee chat (React 19)', 'Untitled snippet 23 (useEffect)', 'Link: css-tricks.com'],
        reason: 'Detected semantic overlap in JS frameworks.'
    },
    { 
        id: 'c2', 
        suggestedLabel: 'Ethics & AI', 
        confidence: 82, 
        items: ['AI Ethics Draft', 'Screenshot 2024-10-12 (News)'],
        reason: 'Keywords: bias, regulation, safety.'
    }
  ]);

  const [categories, setCategories] = useState<Category[]>([
      { id: 'dev', label: 'Development', color: 'bg-info/20', count: 12, subTags: ['TypeScript', 'Node.js', 'Python', 'DevOps'] },
      { id: 'design', label: 'Design', color: 'bg-accent/20', count: 8, subTags: ['Figma', 'UI Patterns', 'Typography'] },
      { id: 'biz', label: 'Business', color: 'bg-secondary/20', count: 5, subTags: ['Strategy', 'Marketing', 'Q4 Goals'] },
  ]);

  const handleAcceptCluster = (clusterId: string) => {
      const cluster = clusters.find(c => c.id === clusterId);
      if (!cluster) return;

      // Simulate API call to merge
      setCategories(prev => [
          { 
              id: Date.now().toString(), 
              label: cluster.suggestedLabel, 
              color: 'bg-primary/20', 
              count: cluster.items.length, 
              subTags: ['New'] 
          }, 
          ...prev
      ]);
      setClusters(prev => prev.filter(c => c.id !== clusterId));
  };

  const handleRejectCluster = (clusterId: string) => {
      setClusters(prev => prev.filter(c => c.id !== clusterId));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 h-full flex flex-col">
      <header className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">Neural Gardener</h1>
           <p className="text-gray-600 dark:text-gray-400 font-medium">Review AI-detected patterns and structure your knowledge.</p>
        </div>
        <NeoButton variant="secondary" size="sm">
           <span className="material-icons-round text-sm mr-1">history</span> History
        </NeoButton>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden h-full">
         
         {/* Column 1: Pattern Detection (AI Clusters) */}
         <div className="lg:w-2/5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                  <span className="material-icons-round text-primary animate-pulse">auto_awesome</span>
                  Detected Patterns
               </h3>
               <span className="bg-gray-200 dark:bg-gray-800 text-xs font-bold px-2 py-0.5 rounded border border-ink dark:border-gray-600 dark:text-white">{clusters.length} Suggestions</span>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-12">
               {clusters.length === 0 ? (
                   <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-3 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                       <span className="material-icons-round text-4xl mb-2">check_circle</span>
                       <p className="font-bold">No new patterns detected.</p>
                       <p className="text-sm">Add more notes to trigger the engine.</p>
                   </div>
               ) : (
                   clusters.map((cluster) => (
                      <div key={cluster.id} className="animate-pop">
                          <NeoCard className="p-0 overflow-hidden border-2 hover:border-primary transition-colors bg-white dark:bg-gray-900">
                              {/* Header */}
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b-2 border-ink dark:border-gray-600 flex justify-between items-start">
                                  <div>
                                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Suggestion</p>
                                      <h4 className="font-bold text-lg text-ink dark:text-white">Create "{cluster.suggestedLabel}"</h4>
                                  </div>
                                  <div className="flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 px-2 py-1 rounded text-xs font-bold dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                      <span className="material-icons-round text-xs">bolt</span>
                                      {cluster.confidence}% Match
                                  </div>
                              </div>
                              
                              {/* Reason & Items */}
                              <div className="p-4">
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 italic">
                                      "{cluster.reason}"
                                  </p>
                                  <ul className="space-y-2 mb-4">
                                      {cluster.items.map((item, i) => (
                                          <li key={i} className="flex items-center gap-2 text-sm font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-2 rounded text-ink dark:text-gray-200">
                                              <span className="material-icons-round text-xs text-gray-400">article</span>
                                              {item}
                                          </li>
                                      ))}
                                  </ul>
                                  
                                  {/* Actions */}
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleAcceptCluster(cluster.id)}
                                        className="flex-1 bg-primary border-2 border-ink dark:border-gray-600 text-ink dark:text-ink py-2 rounded-lg font-bold shadow-neo-sm hover:translate-y-px hover:shadow-none transition-all flex items-center justify-center gap-2"
                                      >
                                          <span className="material-icons-round text-sm">check</span> Apply
                                      </button>
                                      <button 
                                        onClick={() => handleRejectCluster(cluster.id)}
                                        className="w-10 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 shadow-neo-sm dark:text-white"
                                      >
                                          <span className="material-icons-round text-sm">close</span>
                                      </button>
                                  </div>
                              </div>
                          </NeoCard>
                      </div>
                   ))
               )}
            </div>
         </div>

         {/* Center Action Area (Visual Divider) */}
         <div className="hidden lg:flex flex-col items-center justify-center w-12 opacity-20 dark:opacity-40">
            <div className="h-full w-px bg-ink dark:bg-white border-l-2 border-dashed border-gray-400 dark:border-gray-600"></div>
         </div>

         {/* Column 2: Established Structure */}
         <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                  <span className="material-icons-round text-ink dark:text-white">account_tree</span>
                  Knowledge Structure
               </h3>
               <NeoButton variant="icon" className="w-8 h-8 !p-0"><span className="material-icons-round text-sm">add</span></NeoButton>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-900 border-3 border-ink dark:border-gray-500 rounded-2xl p-6 relative overflow-y-auto">
               <div className="space-y-6">
                  {categories.map(cat => (
                      <div 
                        key={cat.id}
                        className="transition-all duration-300 rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                      >
                        <div className="flex items-center gap-2 mb-3">
                            <button className="w-6 h-6 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 text-ink dark:text-white">
                                <span className="material-icons-round text-sm">expand_more</span>
                            </button>
                            <span className={`font-bold text-xl px-2 rounded ${cat.color} border-2 border-ink dark:border-gray-500 shadow-sm dark:text-white`}>
                                {cat.label}
                            </span>
                            <span className="text-xs font-bold text-gray-400 ml-auto">{cat.count} items</span>
                        </div>
                        <div className="pl-8 flex flex-wrap gap-2">
                            {cat.subTags.map(tag => (
                                <span key={tag} className="bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-1 text-xs font-bold shadow-sm cursor-pointer hover:border-primary dark:hover:border-primary text-ink dark:text-gray-200 transition-colors">
                                    #{tag}
                                </span>
                            ))}
                            <button className="px-2 py-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-400 hover:text-ink dark:hover:text-white hover:border-ink dark:hover:border-white transition-colors">
                                +
                            </button>
                        </div>
                      </div>
                  ))}
               </div>
               
               {/* Mascot Helper */}
               <div className="absolute bottom-4 right-4 pointer-events-none">
                  <Mascot state={clusters.length > 0 ? "thinking" : "idle"} className="w-24 h-24" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};