import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { NeoModal } from '../components/NeoModal';

export const Templates: React.FC = () => {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const templates = [
    { title: 'Meeting Notes', icon: 'groups', desc: 'Action items, attendees, and key decisions.', color: 'bg-secondary' },
    { title: 'Code Snippet', icon: 'code', desc: 'Language, dependencies, and usage examples.', color: 'bg-info' },
    { title: 'Design Review', icon: 'palette', desc: 'Feedback grid, screenshots, and next steps.', color: 'bg-accent' },
    { title: 'Daily Journal', icon: 'edit', desc: 'Morning intention, gratitude, and evening reflection.', color: 'bg-primary' },
    { title: 'Project Spec', icon: 'rocket_launch', desc: 'Goals, scope, risks, and timeline.', color: 'bg-gray-100' },
    { title: 'Bug Report', icon: 'bug_report', desc: 'Reproduction steps, environment, and logs.', color: 'bg-red-100' },
  ];

  const handleSaveTemplate = () => {
      // Logic to save
      setIsCreatorOpen(false);
      setNewTemplateName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">Template Hub</h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Standardize your input for better output.</p>
         </div>
         <NeoButton variant="primary" onClick={() => setIsCreatorOpen(true)}>
            <span className="material-icons-round mr-2">add</span> Create Custom Template
         </NeoButton>
      </header>

      {/* TEMPLATE CREATOR MODAL */}
      <NeoModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        title="New Mindframe"
        icon="extension"
        footer={
            <>
                <NeoButton variant="secondary" onClick={() => setIsCreatorOpen(false)}>Cancel</NeoButton>
                <NeoButton onClick={handleSaveTemplate}>Save Template</NeoButton>
            </>
        }
      >
          <div className="space-y-6">
              <div>
                  <label className="block text-sm font-bold mb-2">Template Name</label>
                  <input 
                    type="text" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Weekly Retrospective" 
                    className="w-full border-3 border-ink dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-white rounded-xl px-4 py-3 font-bold focus:ring-0" 
                  />
              </div>

              <div>
                  <label className="block text-sm font-bold mb-2">Category / Tag</label>
                  <div className="flex gap-2">
                      {['Work', 'Personal', 'Code', 'System'].map(tag => (
                          <button key={tag} className="border-2 border-ink dark:border-gray-600 bg-white dark:bg-gray-800 text-ink dark:text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-primary dark:focus:bg-primary dark:focus:text-ink">
                              {tag}
                          </button>
                      ))}
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold mb-2">Structure (Markdown)</label>
                  <div className="relative">
                    <textarea 
                        className="w-full h-48 border-3 border-ink dark:border-gray-600 rounded-xl p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:ring-0 resize-none"
                        placeholder="# Goal&#10;&#10;## Key Results&#10;- [ ] ...&#10;&#10;## Blockers"
                    ></textarea>
                    <div className="absolute top-2 right-2">
                        <button className="text-xs font-bold bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 text-ink dark:text-white px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600">Insert Variable</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-bold">Supported: {"{{date}}"}, {"{{time}}"}, {"{{clipboard}}"}</p>
              </div>
          </div>
      </NeoModal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {templates.map((tpl, i) => (
            <NeoCard key={i} className="p-6 cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-20 h-20 ${tpl.color} rounded-bl-full border-l-3 border-b-3 border-ink opacity-20 group-hover:opacity-100 transition-opacity -mr-4 -mt-4`}></div>
               
               <div className={`w-14 h-14 ${tpl.color} border-3 border-ink dark:border-gray-500 rounded-xl flex items-center justify-center shadow-neo-sm mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-icons-round text-3xl text-ink">{tpl.icon}</span>
               </div>
               
               <h3 className="text-xl font-bold mb-2">{tpl.title}</h3>
               <p className="text-gray-600 dark:text-gray-300 font-medium text-sm mb-6 min-h-[40px]">{tpl.desc}</p>
               
               <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:text-ink dark:group-hover:text-white transition-colors">
                  <span>Use Template</span>
                  <span className="material-icons-round text-base">arrow_forward</span>
               </div>
            </NeoCard>
         ))}
         
         <div className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 hover:text-ink dark:hover:text-white hover:border-ink dark:hover:border-white hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer min-h-[200px] group">
             <span className="material-icons-round text-4xl mb-2">upload_file</span>
             <span className="font-bold">Import from Markdown</span>
         </div>
      </div>
    </div>
  );
};