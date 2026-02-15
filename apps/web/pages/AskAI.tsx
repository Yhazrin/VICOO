import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { Mascot } from '../components/Mascot';
import { NeoButton } from '../components/NeoButton';

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
}

export const AskAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', text: "Hi! I'm your Knowledge Mascot. Ask me anything about your docs, code, or ideas!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: "I found 3 notes related to that. Based on your 'Design System' doc, we should use the 'NeoCard' component here." 
      }]);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col p-4 md:p-8 relative">
      
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Mascot state={isTyping ? 'thinking' : 'happy'} className="w-20 h-20 md:w-24 md:h-24" />
        <div className="hidden md:block">
          <h1 className="text-3xl font-display font-bold dark:text-white">Ask Your Brain</h1>
          <p className="text-gray-500 font-bold dark:text-gray-400">Powered by Gemini</p>
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
               {msg.text}
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
               <span className="material-icons-round text-2xl">add_circle</span>
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold placeholder-gray-400 text-ink dark:text-white"
            />
            <NeoButton 
               onClick={handleSend}
               variant="icon" 
               className="bg-ink text-white hover:bg-gray-800 dark:bg-white dark:text-ink dark:hover:bg-gray-200 w-12 h-12 flex items-center justify-center !rounded-xl !p-0"
            >
               <span className="material-icons-round">send</span>
            </NeoButton>
         </div>
      </div>

    </div>
  );
};