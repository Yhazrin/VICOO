/**
 * LangChain 模块使用示例
 *
 * 这个文件展示如何使用新创建的模块
 */

import {
  // Models - 增强版
  createOpenAIChat,
  createAnthropicChat,
  createGoogleChat,
  createMiniMaxChat,
  getModelByPurpose,
  getFastModel,

  // Retrievers
  createNotesRetriever,
  createTasksRetriever,
  createTimelineRetriever,
  createMultiRetriever,

  // Memory
  createConversationMemory,
  getOrCreateConversation,
  addMessage,
  initializeMemoryTables,

  // Loaders
  createNotesLoader,
  createFullLoader,

  // Observability
  initializeLangSmith,
  traceAgentExecution,
  traceRAGPipeline,
  getTracingStatus,

  // Tools & Agents (已有)
  AllTools,
  chatWithAgent,
} from './index.js';

// ==================== 示例 1: 使用不同 Provider 的模型 ====================

async function exampleModels() {
  // 使用增强版工厂函数创建不同 Provider 的模型
  const openai = createOpenAIChat({ model: 'gpt-4o-mini' });
  const anthropic = createAnthropicChat({ model: 'claude-3-5-sonnet-20241022' });
  const minimax = createMiniMaxChat({ model: 'MiniMax-M2.5' });

  // 或者根据用途自动选择模型
  const fastModel = getFastModel();       // 快速响应
  const thinkingModel = getModelByPurpose('thinking');  // 思考推理

  console.log('Models initialized');
}

// ==================== 示例 2: 使用 Retrievers 检索 ====================

async function exampleRetrievers() {
  // 创建不同领域的 Retriever
  const notesRetriever = createNotesRetriever({ topK: 5 });
  const tasksRetriever = createTasksRetriever({ topK: 5 });
  const timelineRetriever = createTimelineRetriever({ topK: 10 });

  // 检索相关笔记
  const notes = await notesRetriever.getRelevantDocuments('React 开发');
  console.log('Found notes:', notes.length);

  // 检索相关任务
  const tasks = await tasksRetriever.getRelevantDocuments('API 开发');
  console.log('Found tasks:', tasks.length);

  // 使用组合 Retriever 一次检索多个领域
  const multi = createMultiRetriever({ topK: 3 });
  const results = await multi.searchAll('项目计划');
  console.log('Notes:', results.notes.length);
  console.log('Tasks:', results.tasks.length);
  console.log('Timeline:', results.timeline.length);
}

// ==================== 示例 3: 使用 Memory 管理会话 ====================

async function exampleMemory() {
  // 初始化数据库表
  initializeMemoryTables();

  // 创建会话
  const session = getOrCreateConversation('session_123');

  // 添加消息
  addMessage(session.id, { role: 'user', content: '帮我找一下关于 React 的笔记' });
  addMessage(session.id, { role: 'assistant', content: '好的，我来找一下...' });

  // 使用 LangChain Memory 接口
  const memory = createConversationMemory(session.id, { maxMessages: 20 });
  const vars = await memory.loadMemoryVariables({});
  console.log('Memory vars:', vars);
}

// ==================== 示例 4: 使用 Loaders 加载数据 ====================

async function exampleLoaders() {
  // 创建笔记加载器
  const notesLoader = createNotesLoader();

  // 加载所有笔记
  const allNotes = notesLoader.loadAll();
  console.log('Total notes:', allNotes.length);

  // 按分类加载
  const ideaNotes = notesLoader.loadByCategory('idea');
  console.log('Idea notes:', ideaNotes.length);

  // 按关键词加载
  const keywordNotes = notesLoader.loadByKeyword('React');
  console.log('React notes:', keywordNotes.length);

  // 创建全量加载器
  const fullLoader = createFullLoader();
  const notes = fullLoader.notes.loadAll();
  const tasks = fullLoader.tasks.loadPending();
  console.log('Notes:', notes.length, 'Tasks:', tasks.length);
}

// ==================== 示例 5: 使用 LangSmith 追踪 ====================

async function exampleObservability() {
  // 初始化 LangSmith
  await initializeLangSmith();

  // 检查追踪状态
  const status = getTracingStatus();
  console.log('Tracing enabled:', status.enabled);

  // 追踪 Agent 执行
  const result = await traceAgentExecution(
    'note_search_agent',
    { query: 'React' },
    async () => {
      return await chatWithAgent('搜索关于 React 的笔记');
    }
  );
  console.log('Result:', result);
}

// ==================== 示例 6: 完整 RAG 流程 ====================

async function exampleRAG() {
  // 1. 加载文档
  const loader = createNotesLoader();
  const documents = loader.loadAll();

  console.log('Loaded documents:', documents.length);

  // 2. 创建 Retriever
  const retriever = createNotesRetriever();

  // 3. 检索相关文档
  const relevantDocs = await retriever.getRelevantDocuments('React best practices');
  console.log('Relevant docs:', relevantDocs.length);

  // 4. 构建上下文
  const context = relevantDocs
    .map(doc => doc.pageContent)
    .join('\n\n');

  // 5. 使用 LLM 生成答案
  const model = getFastModel();
  const response = await model.invoke(
    `根据以下上下文回答问题：\n\n${context}\n\n问题：React 最佳实践有哪些？`
  );

  console.log('Answer:', response.content);
}

// ==================== 运行示例 ====================

async function runExamples() {
  console.log('=== LangChain Examples ===\n');

  // await exampleModels();
  // await exampleRetrievers();
  // await exampleMemory();
  // await exampleLoaders();
  // await exampleObservability();
  // await exampleRAG();

  console.log('\nExamples completed!');
}

runExamples().catch(console.error);
