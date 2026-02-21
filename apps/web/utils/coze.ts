/**
 * Coze 智能体服务
 * 
 * 用于直接调用 Coze Bot 进行对话
 * 
 * 使用方法：
 * 1. 配置 Coze Token 和 Bot ID
 * 2. 调用 chat() 方法发送消息
 */

export interface CozeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_type?: 'text' | 'image';
}

export interface CozeChatRequest {
  bot_id: string;
  user_id: string;
  query: string;
  conversation_id?: string;
  stream?: boolean;
}

export interface CozeChatResponse {
  success: boolean;
  data?: {
    conversation_id: string;
    messages: CozeMessage[];
  };
  error?: string;
}

export interface CozeConfig {
  token: string;
  botId: string;
  baseUrl: string;
}

const DEFAULT_BASE_URL = 'http://localhost:8889';

class CozeService {
  private config: CozeConfig | null = null;

  /**
   * 配置 Coze 服务
   */
  configure(config: CozeConfig): void {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL
    };
    localStorage.setItem('coze_config', JSON.stringify(this.config));
  }

  /**
   * 获取当前配置
   */
  getConfig(): CozeConfig | null {
    if (!this.config) {
      const stored = localStorage.getItem('coze_config');
      if (stored) {
        this.config = JSON.parse(stored);
      }
    }
    return this.config;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config?.token && config?.botId);
  }

  /**
   * 清除配置
   */
  clearConfig(): void {
    this.config = null;
    localStorage.removeItem('coze_config');
  }

  /**
   * 调用 Coze Bot 进行对话
   */
  async chat(query: string, userId: string = 'default_user'): Promise<CozeChatResponse> {
    const config = this.getConfig();
    
    if (!config) {
      return {
        success: false,
        error: '请先配置 Coze Token 和 Bot ID'
      };
    }

    try {
      const conversationId = `conv_${Date.now()}`;
      
      const response = await fetch(`${config.baseUrl}/v3/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify({
          bot_id: config.botId,
          user_id: userId,
          query: query,
          conversation_id: conversationId,
          stream: false
        })
      });

      const data = await response.json();

      if (response.ok && data.code === 0) {
        return {
          success: true,
          data: {
            conversation_id: data.data?.conversation_id || conversationId,
            messages: data.data?.messages || []
          }
        };
      }

      return {
        success: false,
        error: data.msg || data.message || '调用失败'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '网络错误'
      };
    }
  }

  /**
   * 流式调用 Coze Bot
   */
  async *chatStream(
    query: string, 
    userId: string = 'default_user'
  ): AsyncGenerator<{ type: string; content?: string; error?: string }> {
    const config = this.getConfig();
    
    if (!config) {
      yield { type: 'error', error: '请先配置 Coze Token 和 Bot ID' };
      return;
    }

    try {
      const conversationId = `conv_${Date.now()}`;
      
      const response = await fetch(`${config.baseUrl}/v3/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify({
          bot_id: config.botId,
          user_id: userId,
          query: query,
          conversation_id: conversationId,
          stream: true
        })
      });

      if (!response.ok) {
        yield { type: 'error', error: `HTTP ${response.status}` };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { type: 'error', error: '无法读取响应' };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.event === 'message') {
                yield { 
                  type: 'message', 
                  content: data.message?.content || data.message?.content?.text || '' 
                };
              } else if (data.event === 'error') {
                yield { type: 'error', error: data.error || '未知错误' };
              } else if (data.event === 'done') {
                yield { type: 'done' };
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      yield { type: 'error', error: error.message || '网络错误' };
    }
  }
}

export const cozeService = new CozeService();
export default cozeService;
