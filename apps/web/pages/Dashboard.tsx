import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { SuccessAnim } from '../components/SuccessAnim';
import { View } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';
import type { FeedItem, Note } from '@vicoo/types';

interface DashboardFeedItem {
    id: string;
    type: 'resume' | 'maintenance' | 'memory' | 'insight';
    title: string;
    subtitle: string;
    icon: string;
    color: 'primary' | 'secondary' | 'accent' | 'info' | 'white';
    actionLabel: string;
    noteId?: string;
}

interface DashboardProps {
    onNavigate: (view: View) => void;
    onOpenNote?: (noteId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenNote }) => {
  const { t } = useLanguage();
  const { feedItems, notes, createNote } = useApi();
  
  // Convert API feed items to dashboard format
  const convertFeedItem = (item: any): DashboardFeedItem => {
    switch (item.type) {
      case 'draft':
        return {
          id: item.id,
          type: 'resume',
          title: item.title || 'Untitled Draft',
          subtitle: item.description || 'Unpublished note',
          icon: 'edit_note',
          color: 'info',
          actionLabel: 'Resume Writing',
          noteId: item.metadata?.noteId
        };
      case 'suggestion':
        return {
          id: item.id,
          type: 'maintenance',
          title: item.title,
          subtitle: item.description || 'System suggestion',
          icon: 'account_tree',
          color: 'secondary',
          actionLabel: 'Review'
        };
      case 'memory':
        return {
          id: item.id,
          type: 'memory',
          title: item.title,
          subtitle: item.description || 'Resurfaced memory',
          icon: 'history',
          color: 'white',
          actionLabel: 'View Note'
        };
      default:
        return {
          id: item.id,
          type: 'insight',
          title: item.title,
          subtitle: item.description || 'AI Insight',
          icon: 'auto_awesome',
          color: 'primary',
          actionLabel: 'View Details'
        };
    }
  };

  // Get feed items from API or use notes as fallback
  const [dashboardFeed, setDashboardFeed] = useState<DashboardFeedItem[]>([]);

  useEffect(() => {
    if (feedItems && feedItems.length > 0) {
      setDashboardFeed(feedItems.map(convertFeedItem));
    } else if (notes && notes.length > 0) {
      // Fallback: use recent notes as feed items
      const noteFeed: DashboardFeedItem[] = notes.slice(0, 6).map((note: Note) => ({
        id: `note-${note.id}`,
        type: note.published ? 'insight' : 'resume',
        title: note.title,
        subtitle: note.snippet || `Last edited: ${new Date(note.timestamp).toLocaleDateString()}`,
        icon: note.published ? 'auto_awesome' : 'edit_note',
        color: note.published ? 'primary' as const : 'info' as const,
        actionLabel: note.published ? 'View' : 'Resume',
        noteId: note.id
      }));
      setDashboardFeed(noteFeed);
    }
  }, [feedItems, notes]);

  const INITIAL_FEED: DashboardFeedItem[] = [
    { 
        id: 'f1', type: 'resume', title: 'React Performance Tips', subtitle: 'You were writing this 2 hours ago.', 
        icon: 'edit_note', color: 'info', actionLabel: 'Resume Writing', noteId: 'new'
    },
    { 
        id: 'f2', type: 'maintenance', title: 'Garden Maintenance', subtitle: '3 new clusters detected by Neural Gardener.', 
        icon: 'account_tree', color: 'secondary', actionLabel: 'Review Clusters'
    },
    { 
        id: 'f3', type: 'memory', title: 'Startup Idea: Cat Feeder', subtitle: 'Resurfaced from 2 weeks ago. Still relevant?', 
        icon: 'history', color: 'white', actionLabel: 'View Note'
    }
  ];

  const [inputValue, setInputValue] = useState('');
  const [processingState, setProcessingState] = useState<'idle' | 'researching' | 'summarizing' | 'done'>('idle');
  const [researchStatus, setResearchStatus] = useState('');
  const [feed, setFeed] = useState<DashboardFeedItem[]>(INITIAL_FEED);
  const [createdNote, setCreatedNote] = useState<{title: string, tag: string} | null>(null);

  // Update feed when API data is available
  useEffect(() => {
    if (dashboardFeed.length > 0) {
      setFeed(dashboardFeed);
    }
  }, [dashboardFeed]);

  const handleCardClick = (item: DashboardFeedItem) => {
    // Navigate based on item type
    switch (item.type) {
      case 'resume':
        // Open editor with the note ID
        if (item.noteId && onOpenNote) {
          onOpenNote(item.noteId);
        } else if (onOpenNote) {
          onOpenNote('new');
        }
        break;
      case 'maintenance':
        // Open taxonomy to review clusters
        onNavigate(View.TAXONOMY);
        break;
      case 'memory':
      case 'insight':
        // Open library or editor with note
        if (item.noteId && onOpenNote) {
          onOpenNote(item.noteId);
        } else {
          onNavigate(View.LIBRARY);
        }
        break;
      default:
        onNavigate(View.LIBRARY);
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;
    setProcessingState('researching');
    setResearchStatus('Scanning Dev.to & Medium...');
    setCreatedNote(null);
    
    // Simulate Vibe Coding Research Flow
    setTimeout(() => {
        setResearchStatus('Analyzing YouTube Tutorials...');
    }, 1000);

    setTimeout(() => {
        setProcessingState('summarizing');
        setResearchStatus('Extracting Key Patterns...');
    }, 2500);

    setTimeout(async () => {
      setProcessingState('done');
      
      // Create a new note with the research topic
      try {
        const newNote = await createNote({
          title: inputValue,
          content: `# Research: ${inputValue}\n\nAuto-generated research note.`,
          category: 'idea',
          published: false,
          snippet: `Research on ${inputValue}`
        });
        
        setCreatedNote({
            title: newNote.title,
            tag: 'Research'
        });
      } catch (err) {
        console.error('Failed to create note:', err);
      }
      
      setInputValue('');

      // Reset success state after a delay
      setTimeout(() => {
          setProcessingState('idle');
          // Add the new item to the top of the feed
          const newItem: DashboardFeedItem = {
              id: Date.now().toString(),
              type: 'insight',
              title: inputValue,
              subtitle: 'Auto-Research Complete. Note created.',
              icon: 'auto_awesome',
              color: 'primary',
              actionLabel: t('dash.action.view_brief')
          };
          setFeed(prev => [newItem, ...prev]);
          setCreatedNote(null);
      }, 2000);
    }, 3500);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <h1 className="text-4xl font-display font-bold text-ink dark:text-white">{t('dash.welcome')}</h1>
             <span className="bg-green-100 text-green-800 border-2 border-green-600 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {t('dash.online')}
             </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">
             {t('dash.subtitle')} <span className="text-ink dark:text-white font-bold">{t('dash.vibe_code')}</span>?
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
             {/* Public Gateway Button */}
            <NeoButton 
                variant="secondary" 
                size="md" 
                onClick={() => onNavigate(View.PUBLIC_GATEWAY)}
                className="hidden md:flex"
            >
                <span className="material-icons-round text-lg mr-2">public</span> {t('dash.view_live')}
            </NeoButton>

            {/* Quick Stats Pill */}
            <div 
                className="bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-full px-4 py-2 shadow-neo-sm dark:shadow-none flex items-center gap-4 text-xs font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onNavigate(View.PUBLIC_GATEWAY)}
                title="Go to Public Gateway"
            >
                <div className="flex items-center gap-1">
                    <span className="material-icons-round text-primary text-sm">bolt</span>
                    <span className="dark:text-white">124 {t('dash.thoughts')}</span>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="material-icons-round text-accent text-sm">public</span>
                    <span className="dark:text-white">12 {t('dash.published')}</span>
                </div>
            </div>
        </div>
      </header>

      {/* Magic Input Section - The "Cortex" */}
      <section className="relative mb-16 z-20">
        <div className="relative">
          <NeoCard className="p-1 flex items-center bg-white dark:bg-gray-900 relative z-20 overflow-visible transition-all duration-300">
             
             {/* Status Indicator / Mascot Mini */}
             <div className={`
                 w-14 h-14 flex items-center justify-center border-r-2 border-ink dark:border-gray-600 rounded-l-xl flex-shrink-0
                 ${processingState !== 'idle' ? 'bg-primary' : 'bg-light dark:bg-gray-800'}
             `}>
                 {processingState === 'done' ? (
                    <SuccessAnim />
                 ) : (
                    <Mascot state={processingState !== 'idle' ? 'working' : 'idle'} className="w-12 h-12" />
                 )}
             </div>

             <div className="flex-1 relative">
                 <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    disabled={processingState !== 'idle'}
                    placeholder={t('dash.input_placeholder')} 
                    className={`
                        w-full bg-transparent border-none focus:ring-0 text-xl font-bold placeholder-gray-300 text-ink dark:text-white h-14 px-4
                        ${processingState !== 'idle' ? 'opacity-0' : 'opacity-100'}
                    `}
                 />
                 {/* Research Overlay */}
                 {processingState !== 'idle' && processingState !== 'done' && (
                     <div className="absolute inset-0 flex items-center px-4 font-bold font-mono text-ink dark:text-white animate-pulse">
                         <span className="material-icons-round mr-2 animate-spin">sync</span>
                         {researchStatus}
                     </div>
                 )}
             </div>
             
             <div className="pr-1">
                <NeoButton 
                  size="md" 
                  className={`transition-all duration-300 ${processingState === 'done' ? 'bg-green-500 border-green-700 text-white' : ''}`}
                  onClick={handleAnalyze}
                  disabled={processingState !== 'idle'}
                >
                  {processingState !== 'idle' && processingState !== 'done' ? t('dash.researching') : processingState === 'done' ? t('dash.generated') : t('dash.deep_dive')}
                  {processingState === 'idle' && <span className="material-icons-round ml-2">travel_explore</span>}
                </NeoButton>
             </div>
          </NeoCard>

          {/* Feedback Toast / Action Card */}
          {createdNote && (
              <div className="absolute top-full left-0 right-0 mt-4 animate-pop z-10">
                  <div className="bg-ink text-white p-4 rounded-xl border-2 border-gray-700 shadow-neo-lg flex justify-between items-center">
                      <div>
                          <p className="font-bold text-sm text-gray-400 uppercase mb-1">{t('dash.status.research')}</p>
                          <p className="font-bold text-lg">{t('dash.status.brief')} "{createdNote.title}"</p>
                      </div>
                      <div className="flex gap-2">
                          <NeoButton size="sm" variant="secondary">{t('dash.action.view_brief')}</NeoButton>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </section>

      {/* The Cognitive Feed - The "Active Mind" */}
      <section>
          <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2 dark:text-white">
                  <span className="material-icons-round text-ink dark:text-white">stream</span>
                  {t('dash.stream_title')}
              </h2>
              <span className="text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-lg">{t('dash.stream_subtitle')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feed Items */}
              {feed.map((item, index) => (
                  <div key={item.id} className="animate-pop" style={{ animationDelay: `${index * 0.1}s` }}>
                      <NeoCard 
                        color={item.color as any} 
                        className="h-full flex flex-col p-5 relative overflow-hidden group cursor-pointer hover:-translate-y-1"
                        onClick={() => handleCardClick(item)}
                      >
                          {/* Type Indicator */}
                          <div className="flex justify-between items-start mb-3 relative z-10">
                              <div className="bg-white/80 dark:bg-black/20 backdrop-blur border-2 border-ink dark:border-white/50 rounded-lg px-2 py-1 flex items-center gap-1 dark:text-white">
                                  <span className="material-icons-round text-sm">
                                      {item.type === 'resume' ? 'schedule' : item.type === 'maintenance' ? 'build' : item.type === 'insight' ? 'auto_awesome' : 'history'}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wide">
                                      {item.type === 'resume' ? 'Draft' : item.type === 'maintenance' ? 'System' : item.type === 'insight' ? 'Research' : 'Recall'}
                                  </span>
                              </div>
                              {item.type === 'maintenance' && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse border border-ink"></span>
                              )}
                          </div>

                          <h3 className="text-xl font-bold text-ink dark:text-white mb-2 leading-tight relative z-10">{item.title}</h3>
                          <p className="text-sm font-medium opacity-80 mb-6 relative z-10 dark:text-gray-100">{item.subtitle}</p>

                          {/* Decorative Icon */}
                          <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 dark:opacity-20">
                              <span className="material-icons-round text-9xl text-ink dark:text-white">{item.icon}</span>
                          </div>

                          {/* Action Footer */}
                          <div className="mt-auto pt-4 border-t-2 border-black/5 dark:border-white/10 relative z-10 flex justify-between items-center group-hover:border-black/20 dark:group-hover:border-white/30 transition-colors">
                              <span className="text-xs font-bold opacity-60 dark:text-gray-200">{t('dash.priority')}</span>
                              <div className="flex items-center gap-1 font-bold text-sm dark:text-white">
                                  {item.actionLabel}
                                  <span className="material-icons-round text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                              </div>
                          </div>
                      </NeoCard>
                  </div>
              ))}
          </div>
      </section>
    </div>
  );
};