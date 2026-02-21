import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cozeService, type CozeConfig } from '../utils/coze';

interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CozeContextType {
  // 配置状态
  isConfigured: boolean;
  config: CozeConfig | null;
  
  // 对话状态
  messages: CozeMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  configure: (config: CozeConfig) => void;
  clearConfig: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const CozeContext = createContext<CozeContextType | null>(null);

export const CozeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<CozeConfig | null>(null);
  const [messages, setMessages] = useState<CozeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化时加载配置
  useEffect(() => {
    const savedConfig = cozeService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);

  const configure = useCallback((newConfig: CozeConfig) => {
    cozeService.configure(newConfig);
    setConfig(newConfig);
    setError(null);
  }, []);

  const clearConfig = useCallback(() => {
    cozeService.clearConfig();
    setConfig(null);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!config) {
      setError('请先配置 Coze');
      return;
    }

    // 添加用户消息
    const userMessage: CozeMessage = {
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // 使用流式响应
      const stream = cozeService.chatStream(content, 'web_user');
      
      // 添加助手消息占位
      const assistantMessage: CozeMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);

      let fullContent = '';
      
      for await (const chunk of stream) {
        if (chunk.type === 'message' && chunk.content) {
          fullContent += chunk.content;
          setMessages(prev => 
            prev.map((msg, idx) => 
              idx === prev.length - 1 
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        } else if (chunk.type === 'error') {
          setError(chunk.error || '调用失败');
        }
      }
    } catch (err: any) {
      setError(err.message || '调用失败');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return (
    <CozeContext.Provider
      value={{
        isConfigured: !!config,
        config,
        messages,
        isLoading,
        error,
        configure,
        clearConfig,
        sendMessage,
        clearMessages
      }}
    >
      {children}
    </CozeContext.Provider>
  );
};

export const useCoze = () => {
  const context = useContext(CozeContext);
  if (!context) {
    throw new Error('useCoze must be used within CozeProvider');
  }
  return context;
};

export default CozeContext;
