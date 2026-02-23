import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NeoCard } from '../components/NeoCard';
import { Mascot } from '../components/Mascot';
import { NeoButton } from '../components/NeoButton';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';
import { eventBus, Events } from '@vicoo/events';

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  sources?: Array<{
    id?: string;
    title: string;
    type: string;
    content?: string;
  }>;
  isThinking?: boolean;
}

interface Source {
  id?: string;
  title: string;
  type: string;
  content?: string;
  relevance?: number;
}

export const UnifiedAI: React.FC = () => {
  const { t } = useLanguage();
  const { aiChat } = useApi();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      role: 'ai', 
      text: '你好！我是 Vicoo 智能助手。我可以帮你管理笔记、搜索知识、回答问题。有什么我可以帮你的吗？',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiProvider, setAiProvider] = useState<'auto' | 'coze' | 'claude'>('auto');
  const [expandedSource, setExpandedSource] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to mascot events
  useEffect(() => {
    const handleMascotInteract = () => {
      if (isTyping) {
        eventBus.emit(Events.MASCOT_SHOW_MESSAGE, {
          message: '正在思考中...',
          state: 'thinking',
          duration: 2000
        });
      }
    };

    window.addEventListener('mascot-click', handleMascotInteract);
    return () => window.removeEventListener('mascot-click', handleMascotInteract);
  }, [isTyping]);

  // Update mascot state when typing
  useEffect(() => {
    if (isTyping) {
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'thinking',
        message: '让我想想...',
        duration: 0,
        persistent: true
      });
    }
  }, [isTyping]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg: Message = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    eventBus.emit(Events.MASCOT_STATE, {
      state: 'thinking',
      message: '正在思考...',
      duration: 0,
      persistent: true
    });

    try {
      // 使用 auto 模式，让 AI 自动判断意图
      const result = await aiChat(input, 'auto', aiProvider);

      setIsTyping(false);

      if (result.success) {
        eventBus.emit(Events.MASCOT_STATE, {
          state: result.sources && result.sources.length > 0 ? 'search_found' : 'working',
          message: result.sources && result.sources.length > 0 
            ? `找到 ${result.sources.length} 个相关资料！` 
            : '回答完成',
          duration: 2000
        });

        const aiMsg: Message = {
          id: Date.now() + 1,
          role: 'ai',
          text: result.response,
          sources: result.sources?.map((s, idx) => ({
            ...s,
            relevance: 90 - (idx * 10)
          }))
        };
        
        setMessages(prev => [...prev, aiMsg]);

        setTimeout(() => {
          eventBus.emit(Events.MASCOT_STATE, {
            state: 'happy',
            message: '回答完成！',
            duration: 2000
          });
        }, 500);
      } else {
        throw new Error(result.error || 'AI request failed');
      }
    } catch (err) {
      setIsTyping(false);
      
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'error',
        message: '处理失败...',
        duration: 3000
      });

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: '抱歉，我遇到了一些问题，请稍后重试。',
        sources: []
      }]);
    }
  }, [input, isTyping, aiChat, aiProvider]);

  // Render sources as expandable cards
  const renderSources = (sources: Source[], messageId: number) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t-2 border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-icons-round text-sm text-gray-500">library_books</span>
          <span className="text-xs font-bold text-gray-500 uppercase">参考资料 ({sources.length})</span>
        </div>
        <div className="space-y-2">
          {sources.map((source, index) => (
            <div 
              key={index}
              className={`
                transition-all duration-300 cursor-pointer
                ${expandedSource === index + messageId ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
              onClick={() => setExpandedSource(
                expandedSource === index + messageId ? null : index + messageId
              )}
            >
              <NeoCard 
                className={`
                  p-3 text-left
                  ${expandedSource === index + messageId ? 'ring-2 ring-primary' : ''}
                `}
                color="white"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-gray-100 dark:bg-gray-700 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-bold uppercase">
                    {source.type || 'Note'}
                  </span>
                  {source.relevance && (
                    <span className="text-[10px] font-bold text-gray-400 ml-auto">
                      {source.relevance}% 相关
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm dark:text-white truncate">{source.title}</h4>
                {expandedSource === index + messageId && source.content && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-3">{source.content}</p>
                )}
              </NeoCard>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col p-4 md:p-6 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Mascot state={isTyping ? 'thinking' : 'happy'} className="w-16 h-16 md:w-20 md:h-20" />
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold dark:text-white">Vicoo 智能助手</h1>
            <p className="text-gray-500 font-bold dark:text-gray-400 text-sm">AI 自动判断任务类型</p>
          </div>
        </div>

        {/* AI Provider Selector */}
        <div className="hidden sm:flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setAiProvider('auto')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              aiProvider === 'auto' 
                ? 'bg-accent text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            自动
          </button>
          <button
            onClick={() => setAiProvider('coze')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              aiProvider === 'coze' 
                ? 'bg-accent text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Coze
          </button>
          <button
            onClick={() => setAiProvider('claude')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              aiProvider === 'claude' 
                ? 'bg-accent text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Claude
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-20 px-2 md:px-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] p-4 md:p-5 rounded-2xl border-3 border-ink dark:border-gray-500 shadow-neo-sm
              ${msg.role === 'user' 
                ? 'bg-white dark:bg-gray-800 dark:text-white rounded-tr-none' 
                : 'bg-primary rounded-tl-none text-ink'}
            `}>
              {msg.role === 'ai' ? (
                <div className="text-base font-medium leading-relaxed">
                  <MarkdownRenderer content={msg.text} />
                  {renderSources(msg.sources || [], msg.id)}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-base font-medium">{msg.text}</div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-primary p-4 rounded-2xl rounded-tl-none border-3 border-ink dark:border-gray-500 shadow-neo-sm flex gap-2 items-center">
              <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-4 left-4 right-4 md:left-8 md:right-8">
        <div className="bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-2xl p-2 shadow-neo dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] flex gap-2 items-center relative z-20">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <span className="material-icons-round text-xl">add_circle</span>
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="问我任何问题..."
            disabled={isTyping}
            className="flex-1 bg-transparent border-none focus:ring-0 text-base font-bold placeholder-gray-400 text-ink dark:text-white disabled:opacity-50"
          />
          <NeoButton 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            variant="icon" 
            className="bg-ink text-white hover:bg-gray-800 dark:bg-white dark:text-ink dark:hover:bg-gray-200 w-10 h-10 flex items-center justify-center !rounded-xl !p-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-icons-round">send</span>
          </NeoButton>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          AI 会自动判断是搜索知识库还是普通对话
        </p>
      </div>
    </div>
  );
};
