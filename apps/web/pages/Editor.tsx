import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { Mascot } from '../components/Mascot';
import { SlashCommandPalette, builtInCommands, type SlashCommand } from '../components/SlashCommandPalette';
import { View } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';
import { eventBus, Events } from '@vicoo/events';
import type { Note, NoteUpdate, NoteCategory } from '@vicoo/types';

// Mock Knowledge Graph for "Cognitive Context"
const KNOWLEDGE_GRAPH = [
  { id: '1', term: 'React', type: 'Technology', desc: 'A JS library for building UIs.' },
  { id: '2', term: 'Auth', type: 'Security', desc: 'Authentication and Authorization patterns.' },
  { id: '3', term: 'Design System', type: 'Concept', desc: 'A collection of reusable components.' },
  { id: '4', term: 'Neobrutalism', type: 'Style', desc: 'High contrast, bold borders design style.' },
  { id: '5', term: 'API', type: 'Technology', desc: 'Application Programming Interface.' },
];

const MOCK_NOTES = {
  '1': { title: 'React Performance Tips', content: 'Use React.memo to prevent re-renders...' },
  '3': { title: 'Neubrutalism UI Kit', content: 'Using high contrast borders and shadows...' },
};

// Mock Backlinks Data
const MOCK_BACKLINKS = [
    { id: 'bl1', title: 'Q3 Review Meeting', preview: '...discussed the impact of [React Performance Tips] on the new dashboard...', date: '2 days ago' },
    { id: 'bl2', title: 'Frontend Architecture', preview: '...standardize on patterns from [React Performance Tips] for all widgets...', date: '1 week ago' },
];

interface EditorProps {
    initialNoteId?: string | null;
}

export const Editor: React.FC<EditorProps> = ({ initialNoteId }) => {
  const { t } = useLanguage();
  const { getNote, createNote, updateNote } = useApi();

  const [noteId, setNoteId] = useState<string | null>(initialNoteId === 'new' ? null : initialNoteId || null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoteCategory>('idea');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [detectedConcepts, setDetectedConcepts] = useState<typeof KNOWLEDGE_GRAPH>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Load note data if editing existing note
  useEffect(() => {
    const loadNote = async () => {
      if (initialNoteId && initialNoteId !== 'new') {
        try {
          const note = await getNote(initialNoteId);
          setNoteId(note.id);
          setTitle(note.title);
          setContent(note.content || '');
          setCategory(note.category);
          setIsPublished(note.published);
        } catch (err) {
          console.error('Failed to load note:', err);
        }
      } else {
        // New note
        setNoteId(null);
        setTitle(t('editor.untitled'));
        setContent("Start typing to see the magic happen. Type '/' for commands.");
        setCategory('idea');
        setIsPublished(false);
      }
    };
    loadNote();
  }, [initialNoteId, getNote, t]);

  // Auto-save functionality
  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    eventBus.emit(Events.MASCOT_STATE, { state: 'saving', message: 'Saving...', duration: 0 });

    try {
      const noteData = {
        title,
        content,
        category,
        published: isPublished,
        snippet: content.substring(0, 100)
      };

      if (noteId) {
        // Update existing note
        await updateNote(noteId, noteData);
      } else {
        // Create new note
        const newNote = await createNote(noteData as any);
        setNoteId(newNote.id);
      }
      setLastSaved(new Date());

      // Emit saved event
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'saved',
        message: 'Saved!',
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to save note:', err);
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'error',
        message: 'Save failed!',
        duration: 3000
      });
    } finally {
      setIsSaving(false);
    }
  }, [title, content, category, isPublished, noteId, createNote, updateNote]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!title.trim()) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [title, content, category, isPublished, handleSave]);

  const handlePublishToggle = async () => {
    setIsPublished(!isPublished);
    if (title.trim()) {
      setIsSaving(true);
      try {
        const noteData = {
          title,
          content,
          category,
          published: !isPublished,
          snippet: content.substring(0, 100)
        };

        if (noteId) {
          await updateNote(noteId, noteData);
        } else {
          const newNote = await createNote(noteData as any);
          setNoteId(newNote.id);
        }
        setLastSaved(new Date());
      } catch (err) {
        console.error('Failed to publish/unpublish note:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Slash Command State
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 处理斜杠命令选择
  const handleSlashCommandSelect = useCallback((command: SlashCommand, query: string) => {
    const result = command.action(query);
    
    // 在光标位置插入文本
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = content;
      
      // 找到命令开始位置
      const textBefore = text.substring(0, start);
      const lastSlashIndex = textBefore.lastIndexOf('/');
      
      if (lastSlashIndex !== -1) {
        const newText = text.substring(0, lastSlashIndex) + result.insertText + text.substring(end);
        setContent(newText);
        
        // 设置光标位置
        setTimeout(() => {
          const newCursorPos = lastSlashIndex + result.insertText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
    }
    
    if (result.shouldClose) {
      setShowSlashMenu(false);
    }
  }, [content]);

  // 处理键盘事件以检测斜杠命令
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '/' && !showSlashMenu) {
      // 延迟以获取光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          const cursorPos = textareaRef.current.selectionStart;
          
          // 简单估算光标位置
          setSlashPosition({
            top: rect.top + 40,
            left: rect.left + 20
          });
        }
        setShowSlashMenu(true);
        setSlashQuery('');
      }, 0);
    } else if (showSlashMenu) {
      const commands = builtInCommands;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSlashCommandSelect(commands[slashMenuIndex], slashQuery);
      } else if (e.key === 'Escape') {
        setShowSlashMenu(false);
      } else if (e.key === 'Backspace' && slashQuery.length > 0) {
        setSlashQuery(slashQuery.slice(-1));
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // 收集查询字符
        setSlashQuery(prev => prev + e.key);
      }
    }
  }, [showSlashMenu, slashMenuIndex, slashQuery, handleSlashCommandSelect]);

  const handleSummarize = () => {
    setIsSummarizing(true);
    eventBus.emit(Events.MASCOT_STATE, { state: 'thinking', message: 'Analyzing...', duration: 0 });
    setTimeout(() => {
      setIsSummarizing(false);
      setShowSummary(true);
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'celebrating',
        message: 'Analysis complete!',
        duration: 2000
      });
    }, 1500);
  };

  // Typing detection - emit typing event
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Emit typing event (debounced)
    eventBus.emit(Events.MASCOT_STATE, { state: 'typing', message: 'Writing...', duration: 500 });
  };

  // The "Cognitive Engine": Scans text for concepts
  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => {
      const found = KNOWLEDGE_GRAPH.filter(item => 
        content.toLowerCase().includes(item.term.toLowerCase())
      );
      setDetectedConcepts(found);
      setIsScanning(false);
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Editor Main */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          
          {/* Toolbar */}
          <div className="sticky top-0 z-20 mb-6 flex justify-between items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur border-3 border-ink dark:border-gray-500 rounded-xl p-2 shadow-neo-sm">
             <div className="flex gap-2">
                <button className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center text-ink dark:text-white"><span className="material-icons-round text-lg">format_bold</span></button>
                <button className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center text-ink dark:text-white"><span className="material-icons-round text-lg">format_italic</span></button>
                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <button className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center text-ink dark:text-white"><span className="material-icons-round text-lg">code</span></button>
                <button 
                  onClick={handleSummarize}
                  className={`
                    px-3 rounded text-xs font-bold flex items-center gap-1 transition-all
                    ${showSummary ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-secondary/20 hover:bg-secondary/40 text-ink dark:text-white dark:bg-secondary/30'}
                  `}
                >
                   <span className={`material-icons-round text-sm ${isSummarizing ? 'animate-spin' : ''}`}>
                     {showSummary ? 'check' : 'auto_awesome'}
                   </span> 
                   {isSummarizing ? t('editor.summarizing') : showSummary ? t('editor.summarized') : t('editor.summarize')}
                </button>
             </div>
             
             {/* Publish Toggle */}
             <div className="flex items-center gap-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                {/* Save Status */}
                {isSaving && (
                  <span className="text-xs font-bold text-gray-500 animate-pulse">
                    <span className="material-icons-round text-xs align-middle mr-1">sync</span>
                    {t('editor.saving')}
                  </span>
                )}
                {!isSaving && lastSaved && (
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    <span className="material-icons-round text-xs align-middle mr-1">check_circle</span>
                    {t('editor.saved')}
                  </span>
                )}
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{isPublished ? t('editor.public') : t('editor.private')}</span>
                <button 
                    onClick={handlePublishToggle}
                    disabled={isSaving}
                    className={`w-12 h-6 rounded-full border-2 border-ink dark:border-gray-400 p-0.5 transition-colors relative ${isPublished ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className={`w-4 h-4 rounded-full border-2 border-ink bg-white shadow-sm transition-transform ${isPublished ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
             </div>
          </div>

          {/* Paper */}
          <div className="bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-2xl shadow-neo-lg dark:shadow-none min-h-[800px] p-8 md:p-12 relative flex flex-col mb-12">
             <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-primary border-3 border-ink dark:border-gray-500 rounded-xl shadow-neo-sm flex items-center justify-center shrink-0 -rotate-3 text-ink">
                   <span className="material-icons-round text-4xl">bolt</span>
                </div>
                <div className="flex-1">
                   <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-4xl font-display font-bold border-none p-0 focus:ring-0 placeholder-gray-300 text-ink dark:text-white bg-transparent"
                      placeholder={t('editor.untitled')}
                   />
                   <div className="flex items-center gap-3 mt-3">
                      <span className="bg-secondary/30 dark:bg-secondary/20 border border-ink dark:border-gray-400 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 dark:text-white">
                         <span className="w-2 h-2 rounded-full bg-secondary border border-ink"></span> {initialNoteId ? t('editor.edit_mode') : t('editor.draft')}
                      </span>
                      {isPublished && (
                          <span className="bg-primary/30 border border-ink px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 text-green-800 dark:text-green-300">
                             <span className="material-icons-round text-xs">public</span> {t('editor.live')}
                          </span>
                      )}
                      <span className="text-gray-400 text-sm font-medium">{t('editor.last_edited')}</span>
                   </div>
                </div>
             </div>

             {/* Auto-Summary Section */}
             {showSummary && (
               <div className="mb-8 animate-float">
                 <NeoCard color="secondary" className="p-4 relative">
                   <div className="absolute -top-3 -left-3 bg-white border-2 border-ink px-2 py-1 rounded shadow-neo-sm flex items-center gap-1">
                     <span className="material-icons-round text-sm text-primary">stars</span>
                     <span className="text-xs font-bold text-ink">AI Summary</span>
                   </div>
                   <div className="flex gap-4 items-start pt-2">
                     <Mascot state="happy" className="w-16 h-16 shrink-0 hidden sm:block" />
                     <div>
                       <p className="font-medium text-sm leading-relaxed text-ink">
                         <span className="font-bold">TL;DR:</span> This note touches on {detectedConcepts.map(c => c.term).join(', ')}. It appears to be a technical planning document.
                       </p>
                       <div className="mt-2 flex gap-2">
                         <button className="text-xs font-bold underline hover:text-white text-ink">Regenerate</button>
                         <button className="text-xs font-bold underline hover:text-white text-ink" onClick={() => setShowSummary(false)}>Dismiss</button>
                       </div>
                     </div>
                   </div>
                 </NeoCard>
               </div>
             )}

             <div className="relative flex-1">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full min-h-[500px] resize-none border-none focus:ring-0 p-0 text-lg leading-relaxed font-display text-ink dark:text-gray-100 bg-transparent placeholder-gray-300"
                />

                {/* Slash Command Palette */}
                <SlashCommandPalette
                  isOpen={showSlashMenu}
                  position={slashPosition}
                  query={slashQuery}
                  onSelect={handleSlashCommandSelect}
                  onClose={() => setShowSlashMenu(false)}
                />
             </div>
          </div>

          {/* BACKLINKS / Linked Mentions (The Synaptic Gap Filler) */}
          <div className="mb-20">
             <div className="flex items-center gap-2 mb-4 opacity-50">
                 <span className="material-icons-round text-xl dark:text-gray-400">hub</span>
                 <h3 className="font-bold uppercase tracking-widest text-sm dark:text-gray-400">{t('editor.linked_mentions')}</h3>
                 <div className="flex-1 h-px bg-ink/20 dark:bg-white/20"></div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {MOCK_BACKLINKS.map(link => (
                     <div key={link.id} className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 hover:border-ink dark:hover:border-white hover:shadow-neo-sm transition-all cursor-pointer group opacity-70 hover:opacity-100">
                         <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-ink dark:text-white group-hover:underline">{link.title}</h4>
                             <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300">{link.date}</span>
                         </div>
                         <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                             {link.preview}
                         </p>
                     </div>
                 ))}
                 <div className="flex items-center justify-center p-4 border-2 border-dashed border-transparent text-gray-400 text-xs font-bold">
                     AI is scanning for more connections...
                 </div>
             </div>
          </div>
          
        </div>
      </main>

      {/* Right Sidebar (Cognitive Context Rail) */}
      <aside className="w-80 bg-white dark:bg-gray-900 border-l-3 border-ink dark:border-gray-600 p-6 hidden xl:flex flex-col gap-6 relative">
        <div className="flex items-center justify-between mb-2">
           <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Cognitive Context</h4>
           <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-accent animate-ping' : 'bg-green-500'}`}></div>
        </div>

        {detectedConcepts.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 dark:text-gray-400">
              <span className="material-icons-round text-4xl mb-2">radar</span>
              <p className="font-bold text-sm">{t('editor.scanning')}</p>
              <p className="text-xs mt-2">Type "React" or "Design" to see the engine work.</p>
           </div>
        ) : (
           <div className="space-y-4 animate-pop">
              {/* Detected Concepts Card */}
              <div className="space-y-3">
                 <p className="text-xs font-bold text-gray-400 uppercase">{t('editor.detected')} ({detectedConcepts.length})</p>
                 {detectedConcepts.map(concept => (
                    <div key={concept.id} className="group relative">
                       <NeoCard className="p-3 bg-white dark:bg-gray-800 hover:bg-light dark:hover:bg-gray-700 transition-colors cursor-pointer group-hover:-translate-x-1">
                          <div className="flex justify-between items-start">
                             <span className="font-bold text-sm text-ink dark:text-white">{concept.term}</span>
                             <span className="text-[10px] uppercase font-bold bg-gray-200 dark:bg-gray-600 px-1.5 rounded dark:text-gray-200">{concept.type}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{concept.desc}</p>
                       </NeoCard>
                       {/* Add Link Button */}
                       <button className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary border-2 border-ink dark:border-gray-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-neo-sm hover:scale-110 text-ink" title="Link to this concept">
                          <span className="material-icons-round text-xs">link</span>
                       </button>
                    </div>
                 ))}
              </div>

              <div className="border-t-2 border-ink/10 dark:border-white/10 my-4"></div>

              {/* Related Notes (Mocked) */}
              <div className="space-y-3">
                 <p className="text-xs font-bold text-gray-400 uppercase">{t('editor.related')}</p>
                 <NeoCard color="info" className="p-3 cursor-pointer hover:bg-blue-300 transition-colors">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="material-icons-round text-xs">code</span>
                        <span className="font-bold text-xs">React Performance Tips</span>
                     </div>
                     <p className="text-[10px] opacity-70">Mentions 'React' and 'Optimization'</p>
                 </NeoCard>
                 <NeoCard color="accent" className="p-3 cursor-pointer hover:bg-pink-300 transition-colors">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="material-icons-round text-xs">palette</span>
                        <span className="font-bold text-xs">Design System V2</span>
                     </div>
                     <p className="text-[10px] opacity-70">Shared tag: 'UI'</p>
                 </NeoCard>
              </div>
           </div>
        )}

        <div className="mt-auto bg-gray-50 dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-xl p-3">
           <div className="flex items-center gap-2 mb-2">
              <Mascot state={isScanning ? 'thinking' : 'idle'} className="w-8 h-8" />
              <span className="text-xs font-bold dark:text-white">{t('editor.ai_assistant')}</span>
           </div>
           <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {detectedConcepts.length > 0 
                 ? t('editor.ai_hint_found')
                 : t('editor.ai_hint_scanning')}
           </p>
        </div>
      </aside>
    </div>
  );
};