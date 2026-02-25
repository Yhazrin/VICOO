/**
 * Claude Code 服务模块
 * 用于本地执行 Claude Code 并获取结构化输出
 */

import { spawn } from 'child_process';

export interface ClaudeCodeNode {
  label: string;
  description: string;
  color: string;
}

export interface ClaudeCodeLink {
  source: string;
  target: string;
  reason: string;
}

export interface ClaudeCodeGraphResult {
  nodes: ClaudeCodeNode[];
  links: ClaudeCodeLink[];
}

export interface ClaudeCodeOptions {
  workingDir?: string;
  timeout?: number;
}

/**
 * 调用 Claude Code 分析文本并返回结构化结果
 * @param prompt - 要发送给 Claude 的提示词
 * @param options - 可选配置
 * @returns Promise<ClaudeCodeGraphResult>
 */
export async function callClaudeCode(
  prompt: string,
  options: ClaudeCodeOptions = {}
): Promise<ClaudeCodeGraphResult> {
  const { workingDir = process.cwd(), timeout = 5 * 60 * 1000 } = options;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Claude Code 执行超时'));
    }, timeout);

    // 使用 PowerShell 执行 claude 命令
    const psArgs = [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      `Set-Location '${workingDir.replace(/'/g, "''")}'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [Console]::OutputEncoding; claude -p --output-format json -- "${prompt.replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`
    ];

    console.log(`[ClaudeCode Service] Spawning Claude Code...`);

    const claude = spawn('powershell.exe', psArgs, {
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`[ClaudeCode Service] stderr: ${data.toString()}`);
    });

    claude.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code !== 0 && !stdout) {
        console.error(`[ClaudeCode Service] Error: ${stderr}`);
        reject(new Error(`Claude Code 执行失败: ${stderr || `退出码 ${code}`}`));
        return;
      }

      try {
        // 尝试解析 JSON 输出
        const result = parseClaudeOutput(stdout);
        resolve(result);
      } catch (error) {
        console.error(`[ClaudeCode Service] Parse error: ${error}`);
        reject(new Error(`解析 Claude 输出失败: ${error}`));
      }
    });

    claude.on('error', (err) => {
      clearTimeout(timeoutId);
      console.error(`[ClaudeCode Service] Spawn error: ${err.message}`);
      reject(err);
    });
  });
}

/**
 * 解析 Claude Code 的输出，提取 JSON
 */
function parseClaudeOutput(output: string): ClaudeCodeGraphResult {
  // 尝试提取 JSON 块
  const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // 尝试直接解析（如果输出本身就是 JSON）
  try {
    const trimmed = output.trim();
    // 查找 JSON 对象的开始和结束
    const startIdx = trimmed.indexOf('{');
    const endIdx = trimmed.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = trimmed.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    }
  } catch {
    // 继续尝试其他方式
  }

  // 如果都无法解析，返回默认空结果
  console.warn('[ClaudeCode Service] Could not parse JSON, returning empty result');
  return { nodes: [], links: [] };
}

/**
 * 生成知识点提取的提示词
 */
export function generateKnowledgeGraphPrompt(notes: Array<{
  id: string;
  title: string;
  content: string;
  tags?: string[];
}>): string {
  const notesList = notes
    .map((n, i) => {
      const tags = n.tags?.length ? ` [标签: ${n.tags.join(', ')}]` : '';
      const content = n.content.substring(0, 500);
      return `${i + 1}. 标题: ${n.title}${tags}\n   内容: ${content}${content.length >= 500 ? '...' : ''}`;
    })
    .join('\n\n');

  return `你是一个知识图谱分析助手。请深度分析以下笔记，提取知识点并识别它们之间的**语义关系**，帮助用户构建有条理的知识体系。

## 笔记列表：
${notesList}

## 任务要求：
1. 提取 **核心知识点** 作为节点（避免过于泛化或重复）
2. 识别知识点之间的 **语义关系类型**，从以下类型中选择：
   - \`foundation\` — A 是 B 的基础/前置知识（如"JavaScript"是"React"的基础）
   - \`contains\` — A 包含/属于 B（如"Hooks"属于"React"）
   - \`extends\` — A 扩展/增强了 B（如"TypeScript"扩展了"JavaScript"）
   - \`contrasts\` — A 与 B 形成对比（如"Vue"对比"React"）
   - \`depends\` — A 依赖 B（如"组件化"依赖"虚拟DOM"）
   - \`implements\` — A 实现了 B（如"Redux"实现了"状态管理"）
   - \`relates\` — 一般性关联
3. 为每条关系添加简短的中文标签（2-6字，如"是基础"、"包含"、"对比"、"扩展"）
4. 评估关系强度 0.3-1.0（1.0=核心关系，0.5=一般关系，0.3=弱关联）
5. 为节点选择语义化配色（同类知识用相近色系）

## 输出格式（严格 JSON）：
\`\`\`json
{
  "nodes": [
    {
      "label": "知识点名称",
      "description": "一句话描述",
      "color": "#十六进制颜色"
    }
  ],
  "links": [
    {
      "source": "源节点名称",
      "target": "目标节点名称",
      "relation": "foundation|contains|extends|contrasts|depends|implements|relates",
      "label": "中文关系标签(2-6字)",
      "strength": 0.8
    }
  ]
}
\`\`\`

注意：
- 节点名称≤15字，描述≤40字
- 关系要体现知识的层次和脉络，不要随意关联
- 优先建立有学习价值的关系（"先学什么再学什么"）
- 同一对节点只建一条最重要的关系
- 直接返回 JSON`;
}

/**
 * 使用 MiniMax-M2.5 生成知识图谱（替代 Claude Code）
 */
export async function generateGraphWithMiniMax(
  prompt: string,
  _options: ClaudeCodeOptions = {}
): Promise<ClaudeCodeGraphResult> {
  const { MiniMaxProvider } = await import('./minimax.js');

  const apiKey = process.env.MINIMAX_API_KEY || '';
  if (!apiKey) {
    console.error('[GraphGen] MiniMax API Key 未配置');
    return { nodes: [], links: [] };
  }

  const provider = new MiniMaxProvider({
    apiKey,
    baseUrl: process.env.MINIMAX_BASE_URL,
    model: 'MiniMax-M2.5',
  });

  try {
    // Use raw fetch with 90s timeout for complex graph generation
    const config = provider.getConfig();
    const baseUrl = config.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
    const url = `${baseUrl}/v1/text/chatcompletion_v2`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    const resp = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });
    clearTimeout(timer);

    const data = await resp.json() as any;
    const rawContent = data?.choices?.[0]?.message?.content || '';
    const content = rawContent.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();

    if (!content) {
      console.error('[GraphGen] Empty response from MiniMax');
      return { nodes: [], links: [] };
    }

    return parseClaudeOutput(content);
  } catch (error: any) {
    console.error('[GraphGen] Error:', error.message);
    return { nodes: [], links: [] };
  }
}

export default {
  callClaudeCode,
  generateGraphWithMiniMax,
  generateKnowledgeGraphPrompt,
};
