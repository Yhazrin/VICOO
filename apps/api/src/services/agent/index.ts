/**
 * 智能体服务入口
 * 
 * 模块拆分：
 * - agent.types.ts    - 类型定义
 * - agent.skills.ts   - 技能定义
 * - agent.skill-executor.ts - 技能执行
 * - agent.config.ts   - 配置管理
 * - agent.prompt.ts   - 系统提示词
 * - agent.history.ts  - 会话历史
 * - agent.web-parser.ts - 网页解析
 * - agent.core.ts     - 核心对话逻辑
 */

// 重新导出所有类型
export * from './agent.types.js';

// 重新导出所有函数
export { getAgentSkills } from './agent.skills.js';
export { executeSkill } from './agent.skill-executor.js';
export { getDefaultAgentConfig, loadAgentConfig, saveAgentConfig } from './agent.config.js';
export { buildSystemPrompt } from './agent.prompt.js';
export { getSessionHistory, addToHistory, clearHistory } from './agent.history.js';
export { runAgent, type RunAgentOptions, type RunAgentResult } from './agent.core.js';
