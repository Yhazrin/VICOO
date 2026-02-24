import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { Mascot } from '../components/Mascot';
import { NeoButton } from '../components/NeoButton';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { eventBus, Events } from '@vicoo/events';
import { VicooIcon } from '../components/VicooIcon';

// 使用eventBus发送事件

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
}

const API_BASE = 'http://localhost:8000';

export const AskAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', text: '你好！我是 Vicoo 智能助手，可以帮你管理笔记、任务和知识。有什么我可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 监听吉祥物事件并响应
  useEffect(() => {
    const handleMascotInteract = () => {
      // 点击吉祥物时显示当前状态消息
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

  // 当打字状态变化时，同步更新吉祥物状态
  useEffect(() => {
    if (isTyping) {
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'thinking',
        message: '让我想想...',
        duration: 0, // 持续直到状态改变
        persistent: true
      });
    }
  }, [isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // 发送用户消息后，吉祥物进入思考状态
    eventBus.emit(Events.MASCOT_STATE, {
      state: 'thinking',
      message: '正在思考...',
      duration: 0,
      persistent: true
    });

    try {
      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      
      const data = await response.json();
      
      setIsTyping(false);
      
      // AI回复后，吉祥物进入工作状态表示正在生成回复
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'working',
        message: '正在组织回复...',
        duration: 1500
      });

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: data.success ? data.response : '抱歉，我遇到了一些问题，请稍后重试。'
      }]);

      // 回复完成后，吉祥物进入高兴状态
      setTimeout(() => {
        eventBus.emit(Events.MASCOT_STATE, {
          state: 'happy',
          message: '回答完成！',
          duration: 2000
        });
      }, 500);

    } catch (error) {
      setIsTyping(false);
      
      // 错误时，吉祥物显示错误状态
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'error',
        message: '连接失败...',
        duration: 3000
      });

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: '连接服务器失败，请确保 API 服务正在运行。'
      }]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col p-4 md:p-8 relative">
      
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Mascot state={isTyping ? 'thinking' : 'happy'} className="w-20 h-20 md:w-24 md:h-24" />
        <div className="hidden md:block">
          <h1 className="text-3xl font-display font-bold dark:text-white">Vicoo 智能助手</h1>
          <p className="text-gray-500 font-bold dark:text-gray-400">Powered by MiniMax</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-24 px-2 md:px-10">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`
               max-w-[80%] p-4 md:p-6 rounded-2xl border-3 border-ink dark:border-gray-500 shadow-neo-sm text-lg font-medium leading-relaxed
               ${msg.role === 'user' ? 'bg-white dark:bg-gray-800 dark:text-white rounded-tr-none' : 'bg-primary rounded-tl-none text-ink'}
             `}>
               {msg.role === 'ai' ? (
                 <MarkdownRenderer content={msg.text} />
               ) : (
                 <div className="whitespace-pre-wrap">{msg.text}</div>
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
      </div>

      {/* Input Area */}
      <div className="absolute bottom-6 left-4 right-4 md:left-20 md:right-20">
         <div className="bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-2xl p-2 shadow-neo dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] flex gap-2 items-center relative z-20">
            <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
               <VicooIcon name="add_circle" size={24} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="问点什么..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold placeholder-gray-400 text-ink dark:text-white"
            />
            <NeoButton
               onClick={handleSend}
               variant="icon"
               className="bg-ink text-white hover:bg-gray-800 dark:bg-white dark:text-ink dark:hover:bg-gray-200 w-12 h-12 flex items-center justify-center !rounded-xl !p-0"
            >
               <VicooIcon name="send" size={20} />
            </NeoButton>
         </div>
      </div>

    </div>
  );
};
