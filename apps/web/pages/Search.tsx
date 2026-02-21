import React, { useState, useEffect, useCallback } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';
import { eventBus, Events } from '@vicoo/events';

interface SearchResult {
  id: string;
  title: string;
  type: string;
  relevance: number;
  snippet: string;
  date: string;
  color: 'info' | 'accent' | 'primary' | 'secondary';
  noteId?: string;
}

interface SearchProps {
  onOpenNote?: (noteId: string) => void;
}

export const Search: React.FC<SearchProps> = ({ onOpenNote }) => {
  const { t } = useLanguage();
  const { searchNotes, notes, aiChat } = useApi();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [aiMode, setAiMode] = useState<'auto' | 'knowledge' | 'search'>('auto');
  const [aiProvider, setAiProvider] = useState<'auto' | 'coze' | 'claude'>('auto');
  
  // Real results from API
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(false);
    setAiAnswer('');
    setActiveCitation(null);

    // Emit mascot event - searching
    eventBus.emit(Events.MASCOT_STATE, { state: 'searching', message: 'AI Thinking...', duration: 0 });

    try {
      // 使用 AI 助手
      const aiResult = await aiChat(query, aiMode, aiProvider);

      if (aiResult.success) {
        // 设置 AI 回答
        setAiAnswer(aiResult.response);

        // 转换 sources 为搜索结果格式
        const mappedResults: SearchResult[] = (aiResult.sources || []).map((source, index) => ({
          id: source.id || `source-${index}`,
          title: source.title,
          type: source.type || 'Note',
          relevance: 90 - (index * 10),
          snippet: source.content?.substring(0, 150) || '',
          date: 'Recent',
          color: ['info', 'accent', 'primary', 'secondary'][index % 4] as SearchResult['color'],
          noteId: source.id
        }));

        setResults(mappedResults);

        // Emit mascot event based on results
        if (mappedResults.length > 0) {
          eventBus.emit(Events.MASCOT_STATE, {
            state: 'search_found',
            message: `Found ${mappedResults.length} sources!`,
            duration: 3000
          });
          typeWriterEffect(`${aiResult.response.substring(0, 100)}... Found ${mappedResults.length} related sources.`);
        } else {
          eventBus.emit(Events.MASCOT_STATE, {
            state: 'search_empty',
            message: 'No matches found...',
            duration: 3000
          });
          typeWriterEffect(aiResult.response);
        }
      } else {
        throw new Error(aiResult.error || 'AI request failed');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'error',
        message: 'Search failed!',
        duration: 3000
      });
      typeWriterEffect(`抱歉，处理您的请求时出现错误。请稍后重试。`);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, [query, aiChat, aiMode, aiProvider]);

  const typeWriterEffect = (text: string) => {
      let i = 0;
      const interval = setInterval(() => {
          setAiAnswer(text.substring(0, i));
          i++;
          if (i > text.length) clearInterval(interval);
      }, 30);
  };

  // Helper to parse text with citations
  const renderAnswer = (text: string) => {
      // Split by citation markers [1], [2] etc
      const parts = text.split(/(\[\d+\])/g);
      return parts.map((part, index) => {
          if (part.match(/^\[\d+\]$/)) {
              const id = parseInt(part.replace('[', '').replace(']', ''));
              return (
                  <sup 
                    key={index} 
                    className={`
                        cursor-pointer px-1 rounded mx-0.5 font-bold transition-all
                        ${activeCitation === id ? 'bg-primary text-ink scale-125' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}
                    `}
                    onMouseEnter={() => setActiveCitation(id)}
                    onMouseLeave={() => setActiveCitation(null)}
                  >
                      {id}
                  </sup>
              );
          }
          return <span key={index}>{part}</span>;
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 h-full flex flex-col">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">{t('search.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('search.subtitle')}</p>
      </div>

      {/* Search Bar (Sticky-ish feel) */}
      <div className="relative mb-6 max-w-3xl mx-auto w-full z-20">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className={`material-icons-round text-3xl transition-colors ${isSearching ? 'text-primary animate-spin' : 'text-gray-400'}`}>
            {isSearching ? 'sync' : 'psychology'}
          </span>
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('search.placeholder')}
          disabled={isSearching}
          className="w-full pl-16 pr-32 py-5 rounded-2xl border-3 border-ink dark:border-gray-500 text-xl font-bold placeholder-gray-300 shadow-neo dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] focus:ring-0 focus:outline-none transition-shadow focus:shadow-neo-lg dark:focus:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] bg-white dark:bg-gray-800 text-ink dark:text-white disabled:opacity-50"
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          {/* 模式选择 */}
          <div className="hidden md:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setAiMode('knowledge')}
              disabled={isSearching}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                aiMode === 'knowledge' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="知识库问答"
            >
              笔记
            </button>
            <button
              onClick={() => setAiMode('search')}
              disabled={isSearching}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                aiMode === 'search' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="全网搜索"
            >
              全网
            </button>
            <button
              onClick={() => setAiMode('auto')}
              disabled={isSearching}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                aiMode === 'auto' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="AI 自动判断"
            >
              AI
            </button>
          </div>
          {/* AI 提供者选择 */}
          <div className="hidden lg:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setAiProvider('auto')}
              disabled={isSearching}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                aiProvider === 'auto' 
                  ? 'bg-accent text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="自动选择"
            >
              Auto
            </button>
            <button
              onClick={() => setAiProvider('coze')}
              disabled={isSearching}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                aiProvider === 'coze' 
                  ? 'bg-accent text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Coze 智能体"
            >
              Coze
            </button>
            <button
              onClick={() => setAiProvider('claude')}
              disabled={isSearching}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                aiProvider === 'claude' 
                  ? 'bg-accent text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Claude Code"
            >
              Claude
            </button>
          </div>
           <NeoButton size="sm" onClick={handleSearch} disabled={isSearching} className="!px-4">
              {isSearching ? t('search.thinking') : t('search.ask')}
           </NeoButton>
        </div>
      </div>

      {/* Results Area */}
      {hasSearched ? (
        <div className="flex flex-col lg:flex-row gap-8 animate-pop">
           
           {/* Left Column: AI Synthesis (The Answer) */}
           <div className="lg:w-1/2">
              <div className="flex items-center gap-2 mb-4">
                  <Mascot state="happy" className="w-12 h-12" />
                  <h3 className="font-bold text-xl dark:text-white">{t('search.answer')}</h3>
              </div>
              
              <NeoCard className="p-8 bg-white dark:bg-gray-800 border-primary relative overflow-visible">
                  {/* Decorative quote mark */}
                  <div className="absolute -top-4 -left-2 bg-primary border-3 border-ink rounded-lg w-10 h-10 flex items-center justify-center shadow-neo-sm">
                      <span className="material-icons-round text-white text-2xl">auto_awesome</span>
                  </div>
                  
                  <div className="text-lg leading-loose font-medium text-ink dark:text-gray-100">
                      {renderAnswer(aiAnswer)}
                      {aiAnswer.length > 0 && <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse align-middle"></span>}
                  </div>

                  <div className="mt-8 flex gap-3">
                      <button className="text-sm font-bold text-gray-500 hover:text-ink dark:hover:text-white flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                          <span className="material-icons-round text-sm">content_copy</span> {t('search.copy')}
                      </button>
                      <button className="text-sm font-bold text-gray-500 hover:text-ink dark:hover:text-white flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                          <span className="material-icons-round text-sm">thumb_up</span> {t('search.helpful')}
                      </button>
                      <button className="text-sm font-bold text-gray-500 hover:text-ink dark:hover:text-white flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                          <span className="material-icons-round text-sm">restart_alt</span> {t('search.regenerate')}
                      </button>
                  </div>
              </NeoCard>
              
              {/* Follow-up suggestions */}
              <div className="mt-6">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3">Follow-up questions</p>
                  <div className="flex flex-wrap gap-2">
                      {['What about useMemo?', 'Show me code examples', 'Summarize the meeting'].map(q => (
                          <button key={q} className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 transition-all shadow-sm dark:text-white">
                              {q}
                          </button>
                      ))}
                  </div>
              </div>
           </div>

           {/* Right Column: Grounding Sources (The Evidence) */}
           <div className="lg:w-1/2">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl flex items-center gap-2 dark:text-white">
                      <span className="material-icons-round text-gray-400">library_books</span>
                      {t('search.sources')} ({results.length})
                  </h3>
                  <button className="text-sm font-bold text-primary hover:underline">View All in Galaxy</button>
               </div>

               <div className="space-y-4">
                  {results.map((res, index) => (
                      <div 
                        key={res.id}
                        className={`transition-all duration-300 ${activeCitation === (index + 1) ? 'scale-105 z-10' : 'scale-100'}`}
                      >
                        <NeoCard 
                            color={activeCitation === (index + 1) ? res.color : 'white'}
                            className={`
                                p-5 flex flex-col gap-2 cursor-pointer
                                ${activeCitation === (index + 1) ? 'ring-4 ring-offset-2 ring-primary border-ink' : 'hover:border-gray-400 dark:hover:border-gray-500'}
                            `}
                            onClick={() => {
                              setActiveCitation(index + 1);
                              if (res.noteId && onOpenNote) {
                                onOpenNote(res.noteId);
                              }
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="bg-white dark:bg-black/20 border-2 border-ink dark:border-white/20 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-sm">
                                        {index + 1}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border-2 border-ink bg-white uppercase`}>
                                        {res.type}
                                    </span>
                                </div>
                                <span className="text-xs font-bold opacity-60">{res.date}</span>
                            </div>
                            
                            <h4 className="font-bold text-lg leading-tight">{res.title}</h4>
                            <p 
                                className="text-sm font-medium opacity-80 line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: res.snippet }}
                            />
                            
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t-2 border-black/5 dark:border-white/10">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-ink dark:bg-white h-full" style={{ width: `${res.relevance}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold">{res.relevance}% Relevancy</span>
                            </div>
                        </NeoCard>
                      </div>
                  ))}
               </div>
           </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center opacity-60 mt-10">
            <Mascot state="idle" className="w-32 h-32 mb-4" />
            <div className="text-center max-w-md">
                <p className="font-bold text-xl mb-2 dark:text-white">{t('search.empty_title')}</p>
                <p className="font-medium text-gray-500 dark:text-gray-400">{t('search.empty_subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-lg">
                {[
                    { icon: 'code', text: 'Find React snippets' },
                    { icon: 'history', text: 'Recap last week' },
                    { icon: 'lightbulb', text: 'Brainstorm ideas' },
                    { icon: 'bug_report', text: 'Debug notes' }
                ].map((item, i) => (
                    <button key={i} onClick={() => setQuery(item.text)} className="p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-ink dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3 font-bold text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-white">
                        <span className="material-icons-round">{item.icon}</span>
                        {item.text}
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};