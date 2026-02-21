
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { eventBus, Events } from '@vicoo/events';

// Types representing the Agent's internal state
type LogType = 'thought' | 'command' | 'file_read' | 'file_write' | 'error' | 'success' | 'user' | 'tool_use' | 'thinking' | 'warning' | 'diff_added' | 'diff_removed';

interface AgentLog {
    id: number;
    type: LogType;
    content: string;
    detail?: string;
    timestamp: string;
    toolName?: string;
    toolInput?: string;
    language?: string; // 代码语言
    collapsed?: boolean;
    isStreaming?: boolean; // 是否正在流式输出
}

interface ClaudeConfig {
    endpoint: string;
    workingDir: string;
    autoConnect: boolean;
}

// Retry configuration
const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_MULTIPLIER: 2
};

const DEFAULT_CONFIG: ClaudeConfig = {
    endpoint: 'http://localhost:3000',
    workingDir: 'D:\\PROJECT\\vicoo',
    autoConnect: true
};

// Generate unique ID for logs
const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

export const VibeCodingSession: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [config, setConfig] = useState<ClaudeConfig>(DEFAULT_CONFIG);
    const [logs, setLogs] = useState<AgentLog[]>([
        { id: 1, type: 'success', content: 'Vibe Station Ready', timestamp: new Date().toLocaleTimeString() }
    ]);
    // 跟踪哪些日志是展开的
    const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
    // 流式输出状态
    const streamStateRef = useRef<{
        thinkingId: number | null;
        thoughtId: number | null;
        thinkingContent: string;
        textContent: string;
    }>({
        thinkingId: null,
        thoughtId: null,
        thinkingContent: '',
        textContent: ''
    });
    // Retry state
    const [retryCount, setRetryCount] = useState(0);
    const [lastError, setLastError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentPromptRef = useRef<string>('');

    // Handle folder selection
    const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            // Get the first file's directory path
            const file = files[0];
            // @ts-ignore - webkitRelativePath exists but TypeScript doesn't know about it
            const fullPath = file.webkitRelativePath || file.name;
            // Extract directory path
            const dirPath = fullPath.substring(0, fullPath.lastIndexOf(file.name));
            // Get the root directory name from the selected folder
            const dirName = file.webkitRelativePath.split('/')[0] || file.name;
            // Use the file's path attribute as fallback
            const selectedPath = (file as any).path || file.name;
            
            // Actually we need to use a different approach - let's use the input's value
            // For webkitdirectory, we can't get full path easily, so we'll use the name
            const newWorkingDir = 'D:\\' + dirName;
            
            const newConfig = { ...config, workingDir: newWorkingDir };
            setConfig(newConfig);
            localStorage.setItem('claude_code_config', JSON.stringify(newConfig));
            
            setLogs(prev => [...prev, {
                id: generateId(),
                type: 'success',
                content: `Working directory changed to: ${dirName}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        }
        // Reset input so same folder can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Use showDirectoryPicker API if available (modern browsers)
    const handleFolderPicker = async () => {
        try {
            // @ts-ignore - showDirectoryPicker is not in TypeScript types yet
            if (window.showDirectoryPicker) {
                // @ts-ignore
                const dirHandle = await window.showDirectoryPicker();
                const newWorkingDir = 'D:\\' + dirHandle.name;
                const newConfig = { ...config, workingDir: newWorkingDir };
                setConfig(newConfig);
                localStorage.setItem('claude_code_config', JSON.stringify(newConfig));
                
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'success',
                    content: `Working directory changed to: ${dirHandle.name}`,
                    timestamp: new Date().toLocaleTimeString()
                }]);
                return;
            }
        } catch (e) {
            // Fall back to file input
        }
        
        // Fallback: trigger hidden file input
        fileInputRef.current?.click();
    };

    // Load config from localStorage
    useEffect(() => {
        const savedConfig = localStorage.getItem('claude_code_config');
        if (savedConfig) {
            try {
                setConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.error('Failed to parse config:', e);
            }
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Check connection status - now checks Vicoo API which proxies to Claude Code
    const checkConnection = useCallback(async () => {
        setIsConnecting(true);
        // Emit connecting event
        eventBus.emit(Events.MASCOT_STATE, { state: 'connecting', message: 'Connecting...', duration: 0 });

        try {
            // First check if Vicoo API is running (using proxy path)
            const apiResponse = await fetch('/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!apiResponse.ok) {
                throw new Error('API not available');
            }

            // Then check if Claude Code is available through Vicoo API (using proxy path)
            const response = await fetch('/api/claude/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setIsConnected(true);
                const data = await response.json();
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'success',
                    content: `Claude Code: ${data.version || 'Available'}`,
                    timestamp: new Date().toLocaleTimeString()
                }]);
                // Emit connected event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'connected',
                    message: 'Ready to code!',
                    duration: 3000
                });
            } else {
                setIsConnected(false);
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'error',
                    content: 'Claude Code not found',
                    detail: 'Please install Claude Code',
                    timestamp: new Date().toLocaleTimeString()
                }]);
                // Emit disconnected event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'disconnected',
                    message: 'Claude Code not found',
                    duration: 5000
                });
            }
        } catch (error) {
            setIsConnected(false);
            setLogs(prev => [...prev, {
                id: generateId(),
                type: 'error',
                content: 'Failed to connect to Vicoo API',
                detail: 'Make sure API is running on port 8000',
                timestamp: new Date().toLocaleTimeString()
            }]);
            // Emit disconnected event
            eventBus.emit(Events.MASCOT_STATE, {
                state: 'disconnected',
                message: 'Connection failed',
                duration: 5000
            });
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Connect to Claude Code SSE stream via Vicoo API (using proxy path)
    const connectToStream = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`/api/claude/execute?workingDir=${encodeURIComponent(config.workingDir)}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleStreamEvent(data);
            } catch (e) {
                console.error('Failed to parse event:', e);
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            eventSource.close();
        };

        eventSource.onopen = () => {
            setIsConnected(true);
        };
    }, [config.workingDir]);

    // 彻底清理 ANSI 转义序列的函数
    const stripAnsiCodes = (str: string): string => {
        return str
            // 清除 ANSI 转义序列 (ESC + [ + ... + 字母)
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
            // 清除 OSC 序列 (ESC ] ... BEL)
            .replace(/\x1b\][^\x07]*\x07/g, '')
            // 清除 ANSI CSI 序列 (ESC [ ?...h/l)
            .replace(/\x1b\[\?[\d;]+[hl]/g, '')
            // 清除光标移动等特殊序列
            .replace(/\x1b\[(\d+);(\d+)H/g, '')
            .replace(/\x1b\[(\d+)A/g, '')
            .replace(/\x1b\[(\d+)B/g, '')
            .replace(/\x1b\[(\d+)C/g, '')
            .replace(/\x1b\[(\d+)D/g, '')
            // 清除 SGR 序列 (颜色等)
            .replace(/\x1b\[[0-9;]*m/g, '')
            // 清除剩余的 [ 和 ? 组合
            .replace(/\[<\w+/g, '')
            .replace(/\?[\d]+[hl]/g, '')
            .replace(/\[(\d+);(\d+)H/g, '')
            .replace(/\[(\d+)J/g, '')
            .replace(/\[K/g, '')
            // 清除常见的终端控制字符
            .replace(/\[2J/g, '')
            .replace(/\[H/g, '')
            .replace(/\[m/g, '')
            .replace(/\[1C/g, '')
            .replace(/\[?25l/gi, '')
            .replace(/\[?25h/gi, '')
            .replace(/\[1;29H/gi, '')
            .trim();
    };

    // 增强的噪声过滤模式
    const filterPatterns = [
        // PowerShell/Windows 特定
        /^\[Console\]::OutputEncoding/i, /^\$OutputEncoding/i, /^chcp\s+/i,
        /^Set-Location/i, /^PS\s+[A-Z]:\\/i, /^PS>/i, /^>>$/, /^PS\s+>/i,
        // PTY 输出的命令前缀
        /^>\s*\[Console\]::OutputEncoding/i, /^>\s*\$OutputEncoding/i,
        /^>\s*chcp\s+/i, /^>\s*Set-Location/i, /^>\s*claude\s+/i,
        // Claude Code CLI 提示
        /^claude\s+-p\s+/i, /^Where-Object/i,
        // 完全空白
        /^$/, /^\s+$/,
    ];

    // 更智能的过滤函数
    const shouldFilter = (line: string): boolean => {
        const t = line.trim();
        if (!t) return true;
        // 过滤纯 ANSI 残留模式 [?数字h 或 [数字;数字H 等
        if (/^\[?\??\d+[;hlR]?$/.test(t)) return true;
        if (/^\[\?\d+[hl]$/.test(t)) return true;
        if (/^\[\d+;\d+[HL]$/.test(t)) return true;
        if (/^\[?\d+J$/.test(t)) return true;
        if (/^\[K$/.test(t)) return true;
        // 过滤混合的残留如 [?9001h=[?1004h=[?25l
        if (/^\[?\?[\d;]+h=\[?\?[\d;]+h=\[?\?[\d;]+l?$/.test(t)) return true;
        if (/^\[?\?\d+[hl]/.test(t)) return true;
        // 过滤 > 符号开头的残留
        if (/^>?\[.+$/.test(t)) return true;
        // 过滤 PTY 命令回显 (如 "> Set-Location ...")
        if (/^>\s+\S/.test(t)) {
            const cmdPart = t.replace(/^>\s+/, '');
            // 如果是命令回显，过滤掉
            if (/^(Set-Location|chcp|claude|\[Console\]::|\$OutputEncoding)/i.test(cmdPart)) {
                return true;
            }
        }
        // 匹配噪声模式
        return filterPatterns.some(p => p.test(t));
    };

    // 解析 Claude Code 的 JSON 响应
    const parseClaudeResponse = (data: any): AgentLog[] => {
        const logs: AgentLog[] = [];
        const timestamp = new Date().toLocaleTimeString();

        // System 消息 - 初始化信息
        if (data.type === 'system') {
            logs.push({
                id: generateId(),
                type: 'success',
                content: '🟢 Session initialized',
                detail: `Model: ${data.model || 'unknown'} | Tools: ${data.tools?.join(', ') || 'none'}`,
                timestamp
            });
            return logs;
        }

        // Assistant 消息 - AI 的响应
        if (data.type === 'assistant' && data.message) {
            const content = data.message.content;
            if (!Array.isArray(content)) return logs;

            for (const block of content) {
                // 思考过程
                if (block.type === 'thinking') {
                    const text = block.thinking || '';
                    if (text) {
                        streamStateRef.current.thinkingContent += text;
                        logs.push({
                            id: generateId(),
                            type: 'thinking',
                            content: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                            detail: text,
                            timestamp,
                            isStreaming: true
                        });
                    }
                }
                // 文本回复
                else if (block.type === 'text') {
                    const text = block.text || '';
                    if (text) {
                        streamStateRef.current.textContent += text;
                        logs.push({
                            id: generateId(),
                            type: 'thought',
                            content: text,
                            timestamp,
                            isStreaming: true
                        });
                    }
                }
                // 工具调用
                else if (block.type === 'tool_use') {
                    const toolName = block.name || 'unknown';
                    const toolInput = block.input || {};
                    logs.push({
                        id: generateId(),
                        type: 'tool_use',
                        content: `⚡ Using ${toolName}`,
                        toolName,
                        toolInput: JSON.stringify(toolInput, null, 2),
                        detail: `Executing ${toolName}...`,
                        timestamp
                    });
                }
            }
        }

        // Result 消息 - 工具执行结果
        if (data.type === 'result' && data.result) {
            // 尝试解析为 JSON 格式化显示
            try {
                const result = JSON.parse(data.result);
                logs.push({
                    id: generateId(),
                    type: 'thought',
                    content: '📥 Tool result',
                    detail: JSON.stringify(result, null, 2),
                    language: 'json',
                    timestamp
                });
            } catch {
                logs.push({
                    id: generateId(),
                    type: 'thought',
                    content: '📥 Result',
                    detail: data.result.substring(0, 500),
                    timestamp
                });
            }
        }

        return logs;
    };

    // 改进的 chunk 处理 - 直接处理 PTY 输出
    const handleClaudeChunk = useCallback((chunkData: string, timestamp: string) => {
        // 先彻底清理 ANSI 转义序列
        let cleanData = stripAnsiCodes(chunkData);

        if (!cleanData || cleanData.length === 0) return;

        // 再次应用过滤函数确保彻底清理
        const filtered = cleanData.split('\n')
            .map(line => line.trim())
            .filter(line => !shouldFilter(line))
            .join('\n');

        if (!filtered) return;

        cleanData = filtered;

        // 尝试解析 JSON
        try {
            // 找到 JSON 数组的开始
            const jsonMatch = cleanData.match(/^\[.*\]$/s);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const items = Array.isArray(parsed) ? parsed : [parsed];

                // 处理每个 JSON 项
                setLogs(prevLogs => {
                    const newLogs = [...prevLogs];

                    for (const item of items) {
                        if (item.type === 'system') continue;

                        if (item.type === 'assistant' && item.message?.content) {
                            const content = item.message.content;
                            if (!Array.isArray(content)) continue;

                            for (const block of content) {
                                if (block.type === 'thinking') {
                                    const text = block.thinking || '';
                                    if (text) {
                                        // 查找已有的流式思考
                                        const existingThinking = newLogs.find(l => l.type === 'thinking' && l.isStreaming);
                                        if (existingThinking) {
                                            // 更新现有
                                            const idx = newLogs.findIndex(l => l.id === existingThinking.id);
                                            newLogs[idx] = {
                                                ...existingThinking,
                                                content: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                                                detail: text
                                            };
                                        } else {
                                            // 创建新的
                                            newLogs.push({
                                                id: generateId(),
                                                type: 'thinking',
                                                content: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                                                detail: text,
                                                timestamp,
                                                isStreaming: true
                                            });
                                        }
                                    }
                                } else if (block.type === 'text') {
                                    const text = block.text || '';
                                    if (text) {
                                        // 查找已有的流式响应
                                        const existingThought = newLogs.find(l => l.type === 'thought' && l.isStreaming);
                                        if (existingThought) {
                                            const idx = newLogs.findIndex(l => l.id === existingThought.id);
                                            newLogs[idx] = {
                                                ...existingThought,
                                                content: existingThought.content + text
                                            };
                                        } else {
                                            newLogs.push({
                                                id: generateId(),
                                                type: 'thought',
                                                content: text,
                                                timestamp,
                                                isStreaming: true
                                            });
                                        }
                                    }
                                } else if (block.type === 'tool_use') {
                                    const toolName = block.name || 'unknown';
                                    const toolInput = block.input || {};
                                    newLogs.push({
                                        id: generateId(),
                                        type: 'tool_use',
                                        content: `⚡ ${toolName}`,
                                        toolName,
                                        toolInput: JSON.stringify(toolInput, null, 2),
                                        detail: `Executing ${toolName}...`,
                                        language: 'json',
                                        timestamp
                                    });
                                }
                            }
                        }
                    }

                    return newLogs;
                });
                return;
            }
        } catch {
            // 不是 JSON，处理原始文本
        }

        // 处理非 JSON 的普通输出
        const lines = cleanData.split('\n').filter(line => !shouldFilter(line));

        for (const line of lines) {
            if (!line.trim()) continue;
            if (line.length < 2) continue;

            // 检测是否是命令输出
            if (line.startsWith('$ ') || line.startsWith('> ')) {
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'command',
                    content: line,
                    timestamp
                }]);
                continue;
            }

            // 检测文件 diff
            if (line.startsWith('+') && !line.startsWith('+++')) {
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'diff_added',
                    content: line,
                    timestamp
                }]);
                continue;
            }
            if (line.startsWith('-') && !line.startsWith('---')) {
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'diff_removed',
                    content: line,
                    timestamp
                }]);
                continue;
            }

            // 普通文本 - 追加到最后一个 thought
            setLogs(prev => {
                const lastThought = prev[prev.length - 1];
                if (lastThought && lastThought.type === 'thought' && lastThought.isStreaming) {
                    return prev.map(l =>
                        l.id === lastThought.id
                            ? { ...l, content: l.content + '\n' + line }
                            : l
                    );
                }
                return [...prev, {
                    id: generateId(),
                    type: 'thought',
                    content: line,
                    timestamp,
                    isStreaming: true
                }];
            });
        }
    }, []);

    // Handle SSE events from Claude Code
    const handleStreamEvent = (data: any) => {
        const timestamp = new Date().toLocaleTimeString();

        switch (data.type) {
            case 'chunk':
                handleClaudeChunk(data.data, timestamp);
                break;
            case 'thinking':
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'thinking',
                    content: data.content || 'Thinking...',
                    detail: data.detail,
                    timestamp,
                    isStreaming: true
                }]);
                // Emit mascot thinking event
                eventBus.emit(Events.MASCOT_STATE, { state: 'thinking', message: 'Thinking...', duration: 0 });
                break;
            case 'tool_use':
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'tool_use',
                    content: `⚡ ${data.toolName}`,
                    detail: typeof data.input === 'string' ? data.input : JSON.stringify(data.input, null, 2),
                    toolName: data.toolName,
                    toolInput: JSON.stringify(data.input, null, 2),
                    language: 'json',
                    timestamp
                }]);
                // Emit mascot tool using event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'tool_using',
                    message: `Using ${data.toolName}...`,
                    duration: 2000
                });
                break;
            case 'command':
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'command',
                    content: `$ ${data.content}`,
                    detail: data.output,
                    timestamp
                }]);
                // Emit mascot command running event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'command_running',
                    message: 'Running command...',
                    duration: 2000
                });
                break;
            case 'file_read':
                // 检测语言
                const readLang = data.filePath?.match(/\.(\w+)$/)?.[1] || 'text';
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'file_read',
                    content: `📄 ${data.filePath}`,
                    detail: data.content,
                    language: readLang,
                    timestamp
                }]);
                // Emit mascot file reading event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'file_reading',
                    message: `Reading ${data.filePath}...`,
                    duration: 2000
                });
                break;
            case 'file_write':
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'file_write',
                    content: `✏️ ${data.filePath}`,
                    detail: data.diff,
                    timestamp
                }]);
                // Emit mascot file writing event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'file_writing',
                    message: `Writing ${data.filePath}...`,
                    duration: 2000
                });
                break;
            case 'error':
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'error',
                    content: `❌ ${data.content}`,
                    detail: data.detail,
                    timestamp
                }]);
                // Emit mascot error event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'error',
                    message: 'Oops! Something went wrong',
                    duration: 5000
                });
                break;
            case 'warning':
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'warning',
                    content: `⚠️ ${data.content}`,
                    detail: data.detail,
                    timestamp
                }]);
                break;
            case 'keepalive':
                break;
            case 'exit':
                setIsRunning(false);
                streamStateRef.current = { thinkingId: null, thoughtId: null, thinkingContent: '', textContent: '' };
                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'success',
                    content: '✅ Session completed',
                    detail: `Exit code: ${data.exitCode}`,
                    timestamp
                }]);
                // Emit mascot completed event
                eventBus.emit(Events.MASCOT_STATE, {
                    state: 'completed',
                    message: 'Task complete!',
                    duration: 3000
                });
                break;
            case 'connected':
                break;
            case 'done':
                setIsRunning(false);
                // 标记所有流式日志为完成
                setLogs(prev => prev.map(log =>
                    log.isStreaming ? { ...log, isStreaming: false } : log
                ));
                break;
            default:
                if (data.content || data.message) {
                    setLogs(prev => [...prev, {
                        id: generateId(),
                        type: 'thought',
                        content: data.content || data.message,
                        timestamp
                    }]);
                }
        }
    };

    // Initial connection
    useEffect(() => {
        if (config.autoConnect) {
            checkConnection();
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [config.autoConnect, checkConnection]);

    const handleSend = async () => {
        if (!prompt.trim()) return;

        const userLog: AgentLog = {
            id: generateId(),
            type: 'user',
            content: prompt,
            timestamp: new Date().toLocaleTimeString()
        };

        setLogs(prev => [...prev, userLog]);
        setPrompt('');
        setIsRunning(true);
        setRetryCount(0);
        setLastError(null);

        // Emit thinking event to mascot
        eventBus.emit(Events.MASCOT_STATE, { state: 'thinking', message: 'Analyzing request...', duration: 0 });

        // Save prompt for potential retry
        const promptToSend = prompt;
        currentPromptRef.current = promptToSend;

        // Send request to Vicoo API (which proxies to Claude Code)
        try {
            console.log('[VibeCoding] Sending request to API...');

            await executeWithRetry(promptToSend, 0);

            console.log('[VibeCoding] Request completed successfully');
        } catch (error: any) {
            console.error('[VibeCoding] Error:', error.name, error.message, error.stack);
            setIsRunning(false);
            setRetryCount(0);

            let errorMessage = error.message;
            let errorDetail = '';

            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out';
                errorDetail = 'The request took too long. Try a simpler task or check your network.';
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to API';
                errorDetail = 'Make sure the API server is running on port 8000.';
            } else if (error.message.includes('CONNECTION_ERROR')) {
                errorMessage = 'Connection interrupted';
                errorDetail = 'The connection was lost during execution. Please try again.';
            }

            setLastError(errorMessage);

            setLogs(prev => [...prev, {
                id: generateId(),
                type: 'error',
                content: errorMessage,
                detail: errorDetail || `Error: ${error.message}\n\nCheck console for details.`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        }
    };

    // Fallback simulation (when Claude Code is not available)
    const simulateAgentRun = () => {
        const sequence: Partial<AgentLog>[] = [
            { type: 'thinking', content: 'Analyzing your request...', detail: 'Understanding the intent and context.' },
            { type: 'thought', content: 'Breaking down the task...', detail: 'Identifying required tools and files.' },
            { type: 'tool_use', content: 'Reading project structure', toolName: 'ReadDirectory', toolInput: '{\n  "path": "src/",\n  "recursive": true\n}' },
            { type: 'tool_use', content: 'Searching for relevant files', toolName: 'GrepSearch', toolInput: '{\n  "pattern": "VibeCoding"\n}' },
            { type: 'file_read', content: 'Analyzing existing code', detail: 'src/pages/VibeCodingSession.tsx' },
            { type: 'thought', content: 'Planning implementation...', detail: 'Found 3 related files that need updates.' },
            { type: 'tool_use', content: 'Applying changes', toolName: 'EditFile', toolInput: '{\n  "file": "src/pages/VibeCodingSession.tsx",\n  "changes": "Added new state management"\n}' },
            { type: 'command', content: 'npm run build', detail: '✓ Build successful\n✓ All tests passed' },
            { type: 'success', content: 'Task Completed successfully!', detail: 'Changes applied and verified.' }
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i >= sequence.length) {
                clearInterval(interval);
                setIsRunning(false);
                return;
            }

            const step = sequence[i];
            setLogs(prev => [...prev, {
                id: generateId() + i,
                type: step.type as LogType,
                content: step.content || '',
                detail: step.detail,
                toolName: step.toolName,
                toolInput: step.toolInput,
                timestamp: new Date().toLocaleTimeString()
            }]);
            i++;
        }, 1200);
    };

    const handleQuickCommand = (cmd: string) => {
        setPrompt(cmd);
        handleSend();
    };

    // Calculate retry delay with exponential backoff
    const getRetryDelay = (attempt: number) => {
        const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
        return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
    };

    // Execute request with retry logic
    const executeWithRetry = async (promptToSend: string, attempt: number = 0): Promise<boolean> => {
        console.log(`[VibeCoding] Attempt ${attempt + 1}/${RETRY_CONFIG.MAX_RETRIES + 1}`);

        const controller = new AbortController();
        // Increase timeout for each retry attempt
        const timeoutDuration = 30000 + (attempt * 15000);
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        try {
            const response = await fetch('/api/claude/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    prompt: promptToSend,
                    workingDir: config.workingDir
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Read SSE stream
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            console.log('[VibeCoding] Reading stream...');

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
                            console.log('[VibeCoding] Received event:', data.type, data);

                            // Handle different event types
                            if (data.type === 'error' || data.type === 'warning') {
                                // Check if it's a connection error that might benefit from retry
                                const errorContent = data.content || '';
                                if (attempt < RETRY_CONFIG.MAX_RETRIES &&
                                    (errorContent.includes('disconnected') ||
                                     errorContent.includes('terminated') ||
                                     errorContent.includes('timeout') ||
                                     response.status === 0)) {
                                    console.log('[VibeCoding] Connection error detected, will retry...');
                                    throw new Error('CONNECTION_ERROR');
                                }
                            }

                            handleStreamEvent(data);
                        } catch (e) {
                            const rawData = line.slice(6);
                            console.log('[VibeCoding] Raw event:', rawData);
                            handleStreamEvent({ type: 'message', content: rawData });
                        }
                    }
                }
            }

            console.log('[VibeCoding] Stream complete');
            setRetryCount(0); // Reset retry count on success
            setLastError(null);
            return true;

        } catch (error: any) {
            clearTimeout(timeoutId);

            console.error(`[VibeCoding] Attempt ${attempt + 1} failed:`, error.name, error.message);

            // Check if we should retry
            const shouldRetry =
                attempt < RETRY_CONFIG.MAX_RETRIES &&
                (error.name === 'CONNECTION_ERROR' ||
                 error.name === 'AbortError' ||
                 error.name === 'TypeError' ||
                 error.message.includes('Failed to fetch') ||
                 error.message.includes('network') ||
                 error.message.includes('disconnected'));

            if (shouldRetry) {
                const delay = getRetryDelay(attempt);
                console.log(`[VibeCoding] Retrying in ${delay}ms...`);

                setLogs(prev => [...prev, {
                    id: generateId(),
                    type: 'warning',
                    content: `Connection interrupted. Retrying (${attempt + 1}/${RETRY_CONFIG.MAX_RETRIES})...`,
                    detail: `Waiting ${delay / 1000} seconds before retry.`,
                    timestamp: new Date().toLocaleTimeString()
                }]);

                await new Promise(resolve => setTimeout(resolve, delay));
                return executeWithRetry(promptToSend, attempt + 1);
            }

            throw error; // Re-throw if no retry
        }
    };

    const saveConfig = (newConfig: ClaudeConfig) => {
        setConfig(newConfig);
        localStorage.setItem('claude_code_config', JSON.stringify(newConfig));
    };

    // 切换日志展开/折叠状态
    const toggleLogExpand = (logId: number) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    // NeoBrutalism 风格 - 粗边框高对比度
    const getLogColor = (type: LogType) => {
        switch (type) {
            case 'thinking':
                return 'bg-purple-100 border-3 border-purple-600 dark:bg-purple-900 dark:border-purple-400';
            case 'thought':
                return 'bg-white border-3 border-ink dark:bg-gray-800 dark:border-gray-400 shadow-neo-sm';
            case 'command':
                return 'bg-gray-900 border-3 border-black text-green-400';
            case 'file_read':
                return 'bg-info/20 border-3 border-info';
            case 'file_write':
                return 'bg-secondary/20 border-3 border-secondary';
            case 'tool_use':
                return 'bg-orange-100 border-3 border-orange-500 dark:bg-orange-900 dark:border-orange-400';
            case 'error':
                return 'bg-red-100 border-3 border-red-600 dark:bg-red-900 dark:border-red-400';
            case 'success':
                return 'bg-green-100 border-3 border-green-600 dark:bg-green-900 dark:border-green-400';
            case 'user':
                return 'bg-primary border-3 border-ink shadow-neo';
            case 'diff_added':
                return 'bg-green-200 border-3 border-green-600 dark:bg-green-800 dark:border-green-400';
            case 'diff_removed':
                return 'bg-red-200 border-3 border-red-600 dark:bg-red-800 dark:border-red-400';
            case 'warning':
                return 'bg-yellow-100 border-3 border-yellow-500 dark:bg-yellow-900 dark:border-yellow-400';
            default:
                return 'bg-white border-3 border-ink dark:bg-gray-800 dark:border-gray-400';
        }
    };

    const getLogIcon = (type: LogType) => {
        switch (type) {
            case 'thinking': return 'psychology';
            case 'thought': return 'smart_toy';
            case 'command': return 'terminal';
            case 'file_read': return 'description';
            case 'file_write': return 'edit_document';
            case 'tool_use': return 'build';
            case 'error': return 'error';
            case 'success': return 'check_circle';
            case 'user': return 'person';
            case 'diff_added': return 'add_circle';
            case 'diff_removed': return 'remove_circle';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    const getTypeLabel = (type: LogType) => {
        switch (type) {
            case 'thinking': return 'THINKING';
            case 'thought': return 'RESPONSE';
            case 'command': return 'TERMINAL';
            case 'file_read': return 'READ';
            case 'file_write': return 'WRITE';
            case 'tool_use': return 'TOOL';
            case 'error': return 'ERROR';
            case 'success': return 'DONE';
            case 'user': return 'YOU';
            case 'diff_added': return 'ADDED';
            case 'diff_removed': return 'REMOVED';
            case 'warning': return 'WARNING';
            default: return 'INFO';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 h-full flex flex-col relative">

            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-display font-bold text-ink dark:text-white flex items-center gap-3">
                        <span className="material-icons-round text-4xl text-orange-500">smart_toy</span>
                        Vibe Station
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                        Claude Code Interface • {config.endpoint}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isConnecting ? (
                        <span className="text-xs font-bold text-gray-500 animate-pulse">Connecting...</span>
                    ) : (
                        <>
                            <span className={`flex h-3 w-3 relative ${isConnected ? '' : 'opacity-50'}`}>
                                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            </span>
                            <span className={`text-xs font-bold ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                            {retryCount > 0 && (
                                <span className="text-xs font-bold text-orange-500 animate-pulse">
                                    Retry {retryCount}/{RETRY_CONFIG.MAX_RETRIES}
                                </span>
                            )}
                            {lastError && (
                                <span className="text-xs font-bold text-red-500" title={lastError}>
                                    <span className="material-icons-round text-sm">error</span>
                                </span>
                            )}
                            <NeoButton
                                variant="secondary"
                                size="sm"
                                onClick={checkConnection}
                            >
                                <span className="material-icons-round text-sm">refresh</span>
                            </NeoButton>
                        </>
                    )}
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">

                {/* LEFT: The Stream (Terminal Visualization) */}
                <div className="flex-1 flex flex-col relative">
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto pr-4 pb-32 space-y-4 relative"
                    >
                        {logs.map((log) => (
                            <div key={log.id} className={`flex ${log.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop`}>
                                <div className={`
                                    relative p-4 rounded-2xl border-3 max-w-[90%] w-full
                                    ${getLogColor(log.type)}
                                    ${log.type !== 'user' && log.type !== 'command' ? 'shadow-neo-sm' : ''}
                                    ${log.isStreaming ? 'animate-pulse-subtle' : ''}
                                `}>
                                    <div className="flex items-start gap-3">
                                        {/* NeoBrutalism 风格图标 */}
                                        <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border-2 border-black dark:border-gray-400
                                            ${log.type === 'command' ? 'bg-gray-900 text-green-400' :
                                              log.type === 'tool_use' ? 'bg-orange-400 text-white' :
                                              log.type === 'thinking' ? 'bg-purple-500 text-white' :
                                              log.type === 'file_read' ? 'bg-info text-white' :
                                              log.type === 'file_write' ? 'bg-secondary text-white' :
                                              log.type === 'error' ? 'bg-red-500 text-white' :
                                              log.type === 'success' ? 'bg-green-500 text-white' :
                                              log.type === 'user' ? 'bg-primary text-ink' :
                                              log.type === 'diff_added' ? 'bg-green-500 text-white' :
                                              log.type === 'diff_removed' ? 'bg-red-500 text-white' :
                                              'bg-white dark:bg-gray-700 text-ink dark:text-white'}
                                        `}>
                                            <span className="material-icons-round text-xl">{getLogIcon(log.type)}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold uppercase tracking-widest ${
                                                        log.type === 'thinking' ? 'text-purple-700 dark:text-purple-300' :
                                                        log.type === 'tool_use' ? 'text-orange-700 dark:text-orange-300' :
                                                        log.type === 'error' ? 'text-red-700 dark:text-red-300' :
                                                        log.type === 'success' ? 'text-green-700 dark:text-green-300' :
                                                        'text-gray-600 dark:text-gray-300'
                                                    }`}>
                                                        {getTypeLabel(log.type)}
                                                    </span>
                                                    {log.toolName && (
                                                        <span className="text-xs font-mono font-bold bg-black text-white px-2 py-0.5 rounded">
                                                            {log.toolName}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-mono opacity-50">{log.timestamp}</span>
                                            </div>

                                            {/* 主内容 */}
                                            {log.type === 'diff_added' && (
                                                <pre className="font-mono text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{log.content}</pre>
                                            )}
                                            {log.type === 'diff_removed' && (
                                                <pre className="font-mono text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">{log.content}</pre>
                                            )}
                                            {(log.type !== 'diff_added' && log.type !== 'diff_removed') && (
                                                <p className={`font-bold leading-relaxed ${
                                                    log.type === 'command' ? 'font-mono text-sm text-green-400' :
                                                    log.type === 'tool_use' ? 'text-orange-800 dark:text-orange-200' :
                                                    log.type === 'thinking' ? 'text-purple-800 dark:text-purple-200 italic' :
                                                    'text-ink dark:text-white'
                                                }`}>
                                                    {log.content}
                                                </p>
                                            )}

                                            {/* 详情区域 */}
                                            {(log.detail || log.toolInput) && (
                                                <div className="mt-3">
                                                    {log.type === 'thinking' && log.detail ? (
                                                        <div
                                                            className="rounded-lg bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-600 overflow-hidden cursor-pointer"
                                                            onClick={() => toggleLogExpand(log.id)}
                                                        >
                                                            <div className="flex items-center justify-between px-3 py-2 bg-purple-100 dark:bg-purple-800/50">
                                                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                                                    <span className="material-icons-round text-xs">
                                                                        {expandedLogs.has(log.id) ? 'expand_less' : 'expand_more'}
                                                                    </span>
                                                                    {expandedLogs.has(log.id) ? 'HIDE' : 'SHOW'}
                                                                </span>
                                                                <span className="text-[10px] text-purple-500">{log.detail.length} chars</span>
                                                            </div>
                                                            {expandedLogs.has(log.id) && (
                                                                <div className="p-3">
                                                                    <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap font-mono leading-relaxed">
                                                                        {log.detail}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                                            onClick={() => toggleLogExpand(log.id)}
                                                        >
                                                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                                                                <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                                                    <span className="material-icons-round text-xs">
                                                                        {expandedLogs.has(log.id) ? 'expand_less' : 'expand_more'}
                                                                    </span>
                                                                    {expandedLogs.has(log.id) ? 'COLLAPSE' : 'EXPAND'}
                                                                </span>
                                                                {log.language && (
                                                                    <span className="text-[10px] font-mono font-bold uppercase bg-black text-white px-2 py-0.5 rounded">
                                                                        {log.language}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {(!log.type.includes('thought') || expandedLogs.has(log.id)) && (
                                                                <div className="max-h-80 overflow-auto">
                                                                    <SyntaxHighlighter
                                                                        language={log.language || 'text'}
                                                                        style={vscDarkPlus}
                                                                        customStyle={{
                                                                            margin: 0,
                                                                            padding: '12px',
                                                                            fontSize: '12px',
                                                                            background: log.type === 'command' ? '#1e1e1e' : 'transparent',
                                                                        }}
                                                                        showLineNumbers={false}
                                                                    >
                                                                        {log.toolInput || log.detail}
                                                                    </SyntaxHighlighter>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 流式指示器 */}
                                            {log.isStreaming && (
                                                <div className="mt-2 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                                                    <span className="text-[10px] text-purple-500 animate-pulse">Streaming...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator at bottom */}
                        {isRunning && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl border-3 border-purple-500 shadow-neo-sm flex items-center gap-2">
                                    <Mascot state="thinking" className="w-8 h-8" />
                                    <span className="text-xs font-bold text-purple-700">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fixed Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-light via-light to-transparent dark:from-dark dark:via-dark">
                        <NeoCard className="p-2 flex items-center gap-2 bg-white dark:bg-gray-900">
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <span className="material-icons-round text-gray-400">chevron_right</span>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder="Describe what you want to build (e.g., 'Create a new button component')..."
                                className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-lg text-ink dark:text-white placeholder-gray-400"
                                disabled={isRunning}
                            />
                            <NeoButton
                                onClick={handleSend}
                                disabled={isRunning || !prompt.trim()}
                                className={isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                <span className="material-icons-round">send</span>
                            </NeoButton>
                        </NeoCard>
                    </div>
                </div>

                {/* RIGHT: Context & Stats Panel */}
                <div className="w-80 hidden lg:flex flex-col gap-6">
                    {/* Mascot Status */}
                    <NeoCard className="p-6 flex flex-col items-center text-center bg-white dark:bg-gray-800">
                        <div className="mb-4 relative">
                            {isRunning && <div className="absolute inset-0 bg-secondary/30 rounded-full animate-ping"></div>}
                            <Mascot state={isRunning ? 'working' : 'idle'} className="w-32 h-32" />
                        </div>
                        <h3 className="font-bold text-xl mb-1 dark:text-white">
                            {isRunning ? 'Agent Working' : isConnected ? 'Ready' : 'Disconnected'}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                            {isRunning ? 'Executing your request...' : isConnected ? 'Waiting for instructions.' : 'Check settings to connect'}
                        </p>
                    </NeoCard>

                    {/* Connection Status */}
                    <NeoCard className="p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Endpoint</span>
                            <span className="text-xs font-mono text-gray-400">{config.endpoint}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Working Dir</span>
                            <button
                                onClick={handleFolderPicker}
                                className="flex items-center gap-1 text-xs font-mono text-primary hover:text-secondary transition-colors"
                                title="Click to select a different folder"
                            >
                                <span className="material-icons-round text-sm">folder_open</span>
                                <span className="truncate max-w-[120px]">{config.workingDir.split('\\').pop() || config.workingDir}</span>
                            </button>
                        </div>
                        {/* Hidden file input for folder selection */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            webkitdirectory=""
                            directory=""
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFolderSelect}
                        />
                        <button
                            onClick={() => window.location.href = '#/settings'}
                            className="w-full text-xs font-bold text-primary hover:underline"
                        >
                            Configure in Settings →
                        </button>
                    </NeoCard>

                    {/* Active Context */}
                    <NeoCard className="p-0 overflow-hidden bg-white dark:bg-gray-800 flex-1">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b-2 border-ink dark:border-gray-600 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">Active Context</span>
                            <span className="material-icons-round text-sm text-gray-400">folder_open</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-ink dark:text-gray-200">
                                <span className="material-icons-round text-info text-base">folder</span>
                                {config.workingDir.split('\\').pop() || 'Project'}
                            </div>
                            <div className="pl-6 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded border border-yellow-200 dark:border-yellow-700">
                                    <span className="material-icons-round text-sm">description</span>
                                    <span className="truncate">VibeCodingSession.tsx</span>
                                    <span className="ml-auto text-[10px] uppercase font-bold text-yellow-600">Active</span>
                                </div>
                            </div>
                        </div>
                    </NeoCard>

                    {/* Quick Commands */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Commands</span>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { cmd: 'Explain this code', icon: 'info' },
                                { cmd: 'Fix lint errors', icon: 'bug_report' },
                                { cmd: 'Run tests', icon: 'science' },
                                { cmd: 'Build project', icon: 'build' }
                            ].map(({ cmd, icon }) => (
                                <button
                                    key={cmd}
                                    onClick={() => handleQuickCommand(cmd)}
                                    disabled={isRunning}
                                    className="p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-500 hover:text-ink dark:hover:text-white hover:border-ink dark:hover:border-white transition-all bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <span className="material-icons-round text-sm">{icon}</span>
                                    {cmd.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
