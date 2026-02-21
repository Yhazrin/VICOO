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

  return `你是一个知识图谱分析助手。请分析以下笔记列表，提取知识点并建立它们之间的关联。

## 笔记列表：
${notesList}

## 任务要求：
1. 从笔记内容中提取关键知识点作为节点
2. 分析知识点之间的关系，建立边（links）
3. 为每个节点分配一个合适的颜色（使用十六进制颜色代码）

## 输出格式：
请返回 JSON 格式的结果，包含 nodes 和 links 两部分：

\`\`\`json
{
  "nodes": [
    {
      "label": "知识点名称",
      "description": "知识点的简要描述",
      "color": "#颜色代码"
    }
  ],
  "links": [
    {
      "source": "源节点名称",
      "target": "目标节点名称",
      "reason": "建立关联的原因"
    }
  ]
}
\`\`\`

请确保：
- 节点名称简洁明了，不超过 20 个字符
- 描述不超过 50 个字符
- 颜色选择有意义的配色方案
- 关联关系合理，有明确的逻辑

请直接返回 JSON，不要包含其他内容。`;
}

export default {
  callClaudeCode,
  generateKnowledgeGraphPrompt,
};
