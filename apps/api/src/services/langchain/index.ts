/**
 * LangChain 服务入口
 * 统一导出所有 LangChain 模块
 */

// Models (原始版)
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

// Models (增强版 - 支持更多 Provider)
export {
  createChatModel as unifiedCreateChatModel,
  createOpenAIChat,
  createAnthropicChat,
  createGoogleChat,
  createCohereChat,
  createMistralChat,
  createMiniMaxChat,
  getModelByPurpose,
  getFastModel,
  getCheapModel,
  setModelStrategy,
  defaultModelStrategies,
  type UnifiedModelConfig,
  type ModelPurpose,
  type ModelStrategy,
} from './models-unified';

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

// Retrievers - 新增
export {
  NotesRetriever,
  TasksRetriever,
  TimelineRetriever,
  createNotesRetriever,
  createTasksRetriever,
  createTimelineRetriever,
  createMultiRetriever,
  type RetrieverConfig,
} from './retrievers';

// Memory - 新增
export {
  getOrCreateConversation,
  addMessage,
  getConversationHistory,
  clearConversation,
  getUserMemorySummary,
  VicooMemory,
  createConversationMemory,
  initializeMemoryTables,
  type MemoryMessage,
  type ConversationSession,
  type MemoryConfig,
} from './memory';

// Loaders - 新增
export {
  NotesLoader,
  TasksLoader,
  TimelineLoader,
  createNotesLoader,
  createTasksLoader,
  createTimelineLoader,
  createFullLoader,
  type LoaderConfig,
} from './loaders';

// Observability - 新增
export {
  initializeLangSmith,
  createTracingCallback,
  traceAgentExecution,
  traceRAGPipeline,
  traceToolExecution,
  createTraceEvent,
  getTracingStatus,
} from './observability';

export default {
  // Add default exports if needed
};
