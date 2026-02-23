/**
 * LangChain 服务入口
 * 统一导出所有 LangChain 模块
 */

// Models
export {
  createChatModel,
  createOpenAIModel,
  createAnthropicModel,
  createMiniMaxModel,
  createMiniMaxChatAnthropic,
  getThinkingModel,
  getEmbeddingModel,
  type ModelProvider,
  type ModelConfig,
  type MiniMaxConfig,
} from './models';

// Tools
export {
  NoteTools,
  TaskTools,
  TagTools,
  KnowledgeGraphTools,
  InfoTools,
  AllTools,
  searchNotes,
  getRecentNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getTasks,
  createTask,
  completeTask,
  deleteTask,
  getTags,
  getNotesByTag,
  getGraph,
  getRelatedNotes,
  getStatistics,
  getTimeline,
  searchWeb,
  fetchWebContent,
  WebTools,
} from './tools';

// Chains
export {
  createIntentChain,
  createRoutingChain,
  createToolExecutionChain,
  createWritingChain,
  createSearchChain,
  createRAGChain,
  createAgentChain,
  VICO_SYSTEM_PROMPT,
  writingActions,
  writingStyles,
  type WritingAction,
} from './chains';

// Agents
export {
  createMiniMaxAgent,
  chatWithAgent,
  chatWithAgentStream,
  simpleChat,
  getOrCreateSession,
  clearSession,
  type AgentConfig,
  type AgentMessage,
  type AgentSession,
  type StreamCallback,
} from './agents/agent';

export default {
  // Add default exports if needed
};
