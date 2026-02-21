import React, { useState, useMemo } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';

// Map API category to display tag
const categoryToTag: Record<string, string> = {
  idea: 'Idea',
  code: 'Code',
  design: 'Design',
  meeting: 'Meeting',
};

// Map category to color
const categoryToColor: Record<string, string> = {
  idea: 'secondary',
  code: 'info',
  design: 'accent',
  meeting: 'primary',
};

// Map category to icon
const categoryToIcon: Record<string, string> = {
  idea: 'lightbulb',
  code: 'code',
  design: 'palette',
  meeting: 'mic',
};

interface LibraryProps {
    onOpenNote: (id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onOpenNote }) => {
  const { t } = useLanguage();
  const { notes, loading, error, refreshNotes } = useApi();
  const [filter, setFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Derive tags from notes
  const tags = useMemo(() => {
    const tagSet = new Set(['All', 'Inbox']);
    notes.forEach(note => {
      tagSet.add(categoryToTag[note.category] || note.category);
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [notes]);

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  
  // Memoized sorting and filtering
  const processedNotes = useMemo(() => {
      let filtered = notes.filter(n => {
          const noteTag = categoryToTag[n.category] || n.category;
          const matchesTag = filter === 'All' || filter === 'Inbox' ? true : noteTag === filter || n.tags.includes(filter);
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            n.title.toLowerCase().includes(query) ||
            (n.content && n.content.toLowerCase().includes(query)) ||
            (n.snippet && n.snippet.toLowerCase().includes(query)) ||
            noteTag.toLowerCase().includes(query) ||
            n.tags.some(tag => tag.toLowerCase().includes(query));

          return matchesTag && matchesSearch;
      });

      return filtered.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [notes, filter, searchQuery, sortOrder]);

  const inboxCount = notes.filter(n => !n.published).length;

  const handleAddTag = () => {
    const trimmedTag = newTagValue.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setFilter(trimmedTag); // Automatically select the new tag
      setNewTagValue('');
      setIsAddingTag(false);
    }
  };

  const toggleSort = () => {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 h-full flex flex-col">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">{t('lib.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">{t('lib.subtitle')}</p>
        </div>
        
        {/* Rive-style Animated Sort Toggle */}
        <div className="hidden md:block">
            <button 
                onClick={toggleSort}
                className="group relative bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-full h-12 w-48 shadow-neo-sm hover:shadow-neo transition-all active:translate-y-0.5 overflow-hidden"
            >
                {/* The "Liquid" Background Slider */}
                <div 
                    className={`
                        absolute top-1 bottom-1 w-1/2 bg-ink dark:bg-white rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                        ${sortOrder === 'desc' ? 'left-1' : 'left-[calc(50%-4px)]'}
                    `}
                ></div>

                {/* Content Container */}
                <div className="relative z-10 flex w-full h-full items-center justify-between px-1 text-xs font-bold uppercase tracking-wider">
                    
                    {/* Newest Option */}
                    <div className={`w-1/2 flex items-center justify-center gap-2 transition-colors duration-300 ${sortOrder === 'desc' ? 'text-white dark:text-ink' : 'text-gray-400'}`}>
                        <span>{t('lib.sort.newest')}</span>
                        {sortOrder === 'desc' && <span className="material-icons-round text-sm animate-pop">arrow_downward</span>}
                    </div>

                    {/* Oldest Option */}
                    <div className={`w-1/2 flex items-center justify-center gap-2 transition-colors duration-300 ${sortOrder === 'asc' ? 'text-white dark:text-ink' : 'text-gray-400'}`}>
                        <span>{t('lib.sort.oldest')}</span>
                        {sortOrder === 'asc' && <span className="material-icons-round text-sm animate-pop">arrow_upward</span>}
                    </div>
                </div>
            </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        
        {/* Animated Tag Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto items-center scrollbar-hide p-1">
          {tags.map(f => {
            const isActive = filter === f || (f === 'All' && filter === 'All');
            const label = f === 'All' ? t('lib.filter.all') : f;
            return (
                <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                    relative px-4 py-2 rounded-xl font-bold border-2 transition-all whitespace-nowrap flex items-center gap-2 overflow-hidden
                    ${isActive 
                    ? 'text-white border-ink shadow-neo-sm dark:text-ink dark:border-white scale-105' 
                    : 'bg-white text-ink border-ink hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-400'}
                `}
                style={{
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s, color 0.2s'
                }}
                >
                {/* Active Background Morph */}
                {isActive && (
                    <div className="absolute inset-0 bg-ink dark:bg-white z-0 animate-pop origin-center"></div>
                )}

                <span className="relative z-10">{label}</span>
                
                {f === 'Inbox' && inboxCount > 0 && (
                    <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {inboxCount}
                    </span>
                )}
                </button>
            );
          })}

          {/* Add New Tag Input */}
          {isAddingTag ? (
             <div className="flex items-center gap-1 animate-pop ml-1">
                <input 
                    autoFocus
                    type="text" 
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') handleAddTag();
                        if(e.key === 'Escape') setIsAddingTag(false);
                    }}
                    placeholder="Tag name..."
                    className="w-32 px-3 py-2 rounded-xl font-bold border-2 border-ink dark:border-gray-500 focus:ring-0 text-sm shadow-neo-sm bg-white dark:bg-gray-800 text-ink dark:text-white"
                />
                <button 
                    onClick={handleAddTag}
                    className="w-9 h-9 bg-primary border-2 border-ink dark:border-gray-500 rounded-lg flex items-center justify-center hover:bg-green-400 shadow-neo-sm active:shadow-none active:translate-y-1 transition-all text-ink"
                    title={t('common.save')}
                >
                    <span className="material-icons-round text-sm">check</span>
                </button>
                <button 
                    onClick={() => setIsAddingTag(false)}
                    className="w-9 h-9 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 shadow-neo-sm active:shadow-none active:translate-y-1 transition-all text-ink dark:text-white"
                    title={t('common.cancel')}
                >
                    <span className="material-icons-round text-sm">close</span>
                </button>
            </div>
          ) : (
            <button
                onClick={() => setIsAddingTag(true)}
                className="px-3 py-2 rounded-xl font-bold border-2 border-dashed border-gray-400 text-gray-400 hover:text-ink hover:border-ink hover:bg-white dark:hover:bg-gray-800 dark:hover:text-white dark:hover:border-gray-400 transition-all whitespace-nowrap flex items-center gap-1 ml-1 hover:scale-105 active:scale-95"
                title="Add Custom Tag"
            >
                <span className="material-icons-round text-sm">add</span> {t('lib.tag.new')}
            </button>
          )}
        </div>
        
        <div className="relative w-full md:w-96">
           <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('lib.search_placeholder')}
              className="w-full bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-xl px-4 py-3 pl-12 font-bold focus:ring-0 shadow-neo-sm placeholder-gray-400 text-ink dark:text-white transition-all focus:shadow-neo-lg"
           />
           <span className="material-icons-round absolute left-4 top-3.5 text-gray-400">search</span>
           {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-ink dark:hover:text-white hover:rotate-90 transition-transform"
              >
                 <span className="material-icons-round text-lg">close</span>
              </button>
           )}
        </div>
      </div>

      {/* Grid with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 animate-pop">
                <span className="material-icons-round text-6xl mb-4 opacity-20 animate-spin">sync</span>
                <p className="font-bold text-xl">Loading notes...</p>
            </div>
        ) : error ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 animate-pop">
                <span className="material-icons-round text-6xl mb-4 opacity-20">error_outline</span>
                <p className="font-bold text-xl">Error: {error}</p>
                <button onClick={refreshNotes} className="mt-4 px-4 py-2 bg-primary border-2 border-ink rounded-lg font-bold">
                    Retry
                </button>
            </div>
        ) : processedNotes.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 animate-pop">
                <span className="material-icons-round text-6xl mb-4 opacity-20">filter_none</span>
                <p className="font-bold text-xl">{t('lib.no_results')} "{searchQuery || filter}"</p>
                <p className="text-sm mt-2">Try adjusting your search or filters.</p>
            </div>
        ) : (
            processedNotes.map((note, index) => {
                const noteTag = categoryToTag[note.category] || note.category;
                const noteColor = note.color || categoryToColor[note.category] || 'white';
                const noteIcon = note.icon || categoryToIcon[note.category] || 'note';
                const displayDate = new Date(note.timestamp).toLocaleDateString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric'
                });

                return (
                <div
                    key={note.id}
                    className="animate-pop"
                    style={{ animationDelay: `${index * 0.05}s` }}
                >
                    <NeoCard
                        color={noteColor as any}
                        className={`p-5 flex flex-col cursor-pointer group hover:-translate-y-1 h-full relative overflow-hidden ${!note.published ? 'border-dashed' : ''}`}
                        onClick={() => onOpenNote(note.id)}
                    >
                        {/* Hover Geometry Effect */}
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 bg-white dark:bg-black/10 border-2 border-ink dark:border-white/20 rounded-lg flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform duration-300">
                            <span className="material-icons-round">{noteIcon}</span>
                            </div>
                            <span className={`border-2 border-ink px-2 py-0.5 rounded text-xs font-bold ${!note.published ? 'bg-red-100 text-red-800 border-red-800 animate-pulse' : 'bg-white/50 dark:bg-black/20 dark:border-white/20'}`}>
                                {noteTag}
                            </span>
                        </div>
                        <h3 className="font-bold text-xl mb-2 group-hover:underline relative z-10">{note.title}</h3>
                        <p className="text-sm font-medium opacity-70 mb-4 line-clamp-2 relative z-10">
                            {note.content || note.snippet}
                        </p>
                        <div className="mt-auto flex justify-between items-center border-t-2 border-ink/10 dark:border-white/10 pt-3 relative z-10">
                            <span className="text-xs font-bold opacity-60">{displayDate}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                <button className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded hover:scale-110 transition-transform"><span className="material-icons-round text-sm">edit</span></button>
                                <button className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded hover:scale-110 transition-transform"><span className="material-icons-round text-sm">share</span></button>
                            </div>
                        </div>
                    </NeoCard>
                </div>
                );
            })
        )}

        {/* Add New Card - Visible if not searching and no error */}
        {!searchQuery && !loading && !error && (
            <div
                onClick={() => onOpenNote('new')}
                className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center p-6 text-gray-400 dark:text-gray-500 hover:text-ink dark:hover:text-white hover:border-ink dark:hover:border-white hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer min-h-[200px] group animate-pop"
                style={{ animationDelay: `${processedNotes.length * 0.05}s` }}
            >
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-primary border-2 border-transparent group-hover:border-ink flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90">
                <span className="material-icons-round text-3xl">add</span>
            </div>
            <span className="font-bold">{t('lib.create_note')} '{filter === 'All' ? 'Inbox' : filter}'</span>
            </div>
        )}
      </div>
    </div>
  );
};