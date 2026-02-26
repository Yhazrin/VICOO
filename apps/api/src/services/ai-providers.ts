/**
 * Multi AI Provider Manager
 * Supports MiniMax (default), OpenAI GPT-4o, Anthropic Claude, Google Gemini.
 * Users can select their preferred provider in Settings.
 */

export type AIProviderId = 'minimax' | 'openai' | 'anthropic' | 'gemini';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  nameZh: string;
  models: string[];
  defaultModel: string;
  envKey: string;
  baseUrlEnv?: string;
  configured: boolean;
  icon: string;
}

export function getAvailableProviders(): AIProviderConfig[] {
  return [
    {
      id: 'minimax',
      name: 'MiniMax',
      nameZh: 'MiniMax 海螺',
      models: ['MiniMax-M2.5', 'M2-her'],
      defaultModel: 'MiniMax-M2.5',
      envKey: 'MINIMAX_API_KEY',
      baseUrlEnv: 'MINIMAX_BASE_URL',
      configured: !!process.env.MINIMAX_API_KEY,
      icon: '🌊',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      nameZh: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4o',
      envKey: 'OPENAI_API_KEY',
      configured: !!process.env.OPENAI_API_KEY,
      icon: '🤖',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      nameZh: 'Claude',
      models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-sonnet-4-20250514',
      envKey: 'ANTHROPIC_API_KEY',
      configured: !!process.env.ANTHROPIC_API_KEY,
      icon: '🧠',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      nameZh: 'Gemini',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
      defaultModel: 'gemini-2.5-flash',
      envKey: 'GEMINI_API_KEY',
      configured: !!process.env.GEMINI_API_KEY,
      icon: '💎',
    },
  ];
}

export function getActiveProvider(): AIProviderConfig {
  const preferred = process.env.AI_PROVIDER as AIProviderId;
  const providers = getAvailableProviders();

  if (preferred) {
    const found = providers.find(p => p.id === preferred && p.configured);
    if (found) return found;
  }

  // Auto-select first configured provider
  const configured = providers.find(p => p.configured);
  return configured || providers[0];
}

/**
 * Call AI provider with a simple text prompt.
 * Routes to the appropriate provider based on configuration.
 */
export async function callProvider(
  providerId: AIProviderId,
  prompt: string,
  model?: string
): Promise<{ success: boolean; content?: string; error?: string; provider: string }> {
  const providers = getAvailableProviders();
  const provider = providers.find(p => p.id === providerId);

  if (!provider?.configured) {
    return { success: false, error: `${provider?.nameZh || providerId} 未配置 API Key`, provider: providerId };
  }

  const useModel = model || provider.defaultModel;

  try {
    switch (providerId) {
      case 'minimax': {
        const { MiniMaxProvider } = await import('./minimax.js');
        const mm = new MiniMaxProvider({
          apiKey: process.env.MINIMAX_API_KEY!,
          baseUrl: process.env.MINIMAX_BASE_URL,
          model: useModel,
        });
        const result = await mm.simpleChat([{ role: 'user', content: prompt }]);
        const text = result.content?.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
        return { success: result.success, content: text, error: result.error, provider: 'minimax' };
      }

      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: useModel, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
        });
        const data = await res.json() as any;
        return { success: true, content: data.choices?.[0]?.message?.content, provider: 'openai' };
      }

      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({ model: useModel, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
        });
        const data = await res.json() as any;
        return { success: true, content: data.content?.[0]?.text, provider: 'anthropic' };
      }

      case 'gemini': {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await res.json() as any;
        return { success: true, content: data.candidates?.[0]?.content?.parts?.[0]?.text, provider: 'gemini' };
      }

      default:
        return { success: false, error: '未知 Provider', provider: providerId };
    }
  } catch (err: any) {
    return { success: false, error: err.message, provider: providerId };
  }
}
