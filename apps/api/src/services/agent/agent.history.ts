/**
 * 会话历史管理
 */

interface SessionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 简单的内存会话存储（生产环境应该用数据库）
const sessionHistory = new Map<string, SessionMessage[]>();

const MAX_HISTORY = 10; // 最多保存 10 轮对话

/**
 * 获取会话历史
 */
export function getSessionHistory(sessionId: string): SessionMessage[] {
  if (!sessionHistory.has(sessionId)) {
    sessionHistory.set(sessionId, []);
  }
  return sessionHistory.get(sessionId)!;
}

/**
 * 添加消息到历史
 */
export function addToHistory(sessionId: string, role: 'user' | 'assistant', content: string) {
  const history = getSessionHistory(sessionId);
  history.push({ role, content });
  // 保持历史记录在限制内
  if (history.length > MAX_HISTORY * 2) { // user + assistant = 2
    history.splice(0, 2);
  }
}

/**
 * 清除会话历史
 */
export function clearHistory(sessionId: string) {
  sessionHistory.delete(sessionId);
}
