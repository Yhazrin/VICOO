/**
 * 智能体类型定义
 */

export interface AgentPersona {
  name: string;
  description: string;
  instructions: string;
  traits: string[];
  language: 'zh' | 'en' | 'auto';
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  function: AgentSkillFunction;
}

export interface AgentSkillFunction {
  name: string;
  description: string;
  input_schema: {  // Anthropic 兼容格式
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AgentTool {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  params?: Record<string, any>;
}

export interface AgentMemory {
  type: 'none' | 'short-term' | 'long-term';
  maxMessages: number;
  embeddingEnabled: boolean;
}

export interface AgentReasoning {
  enabled: boolean;
  effort: 'low' | 'medium' | 'high';
}

export interface AgentConfig {
  id: string;
  name: string;
  persona: AgentPersona;
  skills: AgentSkill[];
  tools: AgentTool[];
  memory: AgentMemory;
  reasoning: AgentReasoning;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
  tool_results?: Array<{
    tool_call_id: string;
    result: any;
  }>;
}

export interface AgentSession {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  createdAt: string;
}
