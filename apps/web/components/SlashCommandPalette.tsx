/**
 * SlashCommandPalette - 斜杠命令面板
 * 提供快捷命令输入功能
 * 支持 /task、/code、/ai-expand、/template 等命令
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: (input: string) => CommandResult;
  category: 'block' | 'ai' | 'insert' | 'format';
}

export interface CommandResult {
  insertText: string;
  shouldClose: boolean;
}

// 内置命令定义
export const builtInCommands: SlashCommand[] = [
  {
    id: 'task',
    name: 'Task',
    description: 'Create a task item with checkbox',
    icon: 'check_box',
    category: 'block',
    action: (input: string) => ({
      insertText: `\n- [ ] ${input.replace(/^\/task\s*/, '')}\n`,
      shouldClose: true,
    }),
  },
  {
    id: 'code',
    name: 'Code Block',
    description: 'Insert a code block',
    icon: 'code',
    category: 'block',
    action: (input: string) => ({
      insertText: `\n\`\`\`javascript\n${input.replace(/^\/code\s*/, '')}\n\`\`\`\n`,
      shouldClose: true,
    }),
  },
  {
    id: 'heading1',
    name: 'Heading 1',
    description: 'Large heading',
    icon: 'title',
    category: 'format',
    action: () => ({
      insertText: `\n# `,
      shouldClose: true,
    }),
  },
  {
    id: 'heading2',
    name: 'Heading 2',
    description: 'Medium heading',
    icon: 'title',
    category: 'format',
    action: () => ({
      insertText: `\n## `,
      shouldClose: true,
    }),
  },
  {
    id: 'heading3',
    name: 'Heading 3',
    description: 'Small heading',
    icon: 'title',
    category: 'format',
    action: () => ({
      insertText: `\n### `,
      shouldClose: true,
    }),
  },
  {
    id: 'bullet',
    name: 'Bullet List',
    description: 'Create a bullet list',
    icon: 'format_list_bulleted',
    category: 'format',
    action: () => ({
      insertText: `\n- `,
      shouldClose: true,
    }),
  },
  {
    id: 'numbered',
    name: 'Numbered List',
    description: 'Create a numbered list',
    icon: 'format_list_numbered',
    category: 'format',
    action: () => ({
      insertText: `\n1. `,
      shouldClose: true,
    }),
  },
  {
    id: 'quote',
    name: 'Quote',
    description: 'Create a blockquote',
    icon: 'format_quote',
    category: 'format',
    action: () => ({
      insertText: `\n> `,
      shouldClose: true,
    }),
  },
  {
    id: 'divider',
    name: 'Divider',
    description: 'Insert a horizontal divider',
    icon: 'horizontal_rule',
    category: 'insert',
    action: () => ({
      insertText: `\n---\n`,
      shouldClose: true,
    }),
  },
  {
    id: 'ai-expand',
    name: 'AI Expand',
    description: 'Expand text with AI',
    icon: 'auto_awesome',
    category: 'ai',
    action: (input) => ({
      insertText: `[[AI_EXPAND:${input}]]`,
      shouldClose: false,
    }),
  },
  {
    id: 'ai-summarize',
    name: 'AI Summarize',
    description: 'Summarize selected text',
    icon: 'summarize',
    category: 'ai',
    action: () => ({
      insertText: `[[AI_SUMMARIZE]]`,
      shouldClose: false,
    }),
  },
  {
    id: 'ai-translate',
    name: 'AI Translate',
    description: 'Translate text',
    icon: 'translate',
    category: 'ai',
    action: () => ({
      insertText: `[[AI_TRANSLATE:]]`,
      shouldClose: false,
    }),
  },
  {
    id: 'template',
    name: 'Template',
    description: 'Insert from template',
    icon: 'file_copy',
    category: 'insert',
    action: () => ({
      insertText: '',
      shouldClose: false,
    }),
  },
  {
    id: 'link',
    name: 'Link',
    description: 'Insert a link',
    icon: 'link',
    category: 'insert',
    action: () => ({
      insertText: '[](url)',
      shouldClose: true,
    }),
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Insert an image',
    icon: 'image',
    category: 'insert',
    action: () => ({
      insertText: '![alt text](image-url)',
      shouldClose: true,
    }),
  },
  {
    id: 'table',
    name: 'Table',
    description: 'Insert a table',
    icon: 'table_chart',
    category: 'insert',
    action: () => ({
      insertText: `\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n`,
      shouldClose: true,
    }),
  },
];

interface SlashCommandPaletteProps {
  isOpen: boolean;
  position: { top: number; left: number };
  query: string;
  onSelect: (command: SlashCommand, input: string) => void;
  onClose: () => void;
  commands?: SlashCommand[];
}

export const SlashCommandPalette: React.FC<SlashCommandPaletteProps> = ({
  isOpen,
  position,
  query,
  onSelect,
  onClose,
  commands = builtInCommands,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // 过滤命令
  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery) ||
        cmd.id.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // 按类别分组
  const groupedCommands = useMemo(() => {
    const groups: Record<string, SlashCommand[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // 重置选中索引
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen, query]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex], query);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, query, onSelect, onClose]);

  // 滚动到选中项
  useEffect(() => {
    const menu = menuRef.current;
    const selected = menu?.querySelector('.selected');
    if (selected && menu) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // 类别标签
  const categoryLabels: Record<string, string> = {
    block: 'Blocks',
    ai: 'AI Commands',
    insert: 'Insert',
    format: 'Formatting',
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[280px] max-w-[360px] bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-xl shadow-neo-lg overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {query ? `Searching: "${query}"` : 'Commands'}
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {Object.entries(groupedCommands).map(([category, cmds]) => (
          <div key={category}>
            <div className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 sticky top-0">
              {categoryLabels[category] || category}
            </div>
            {cmds.map((cmd, idx) => {
              const globalIndex = filteredCommands.indexOf(cmd);
              const isSelected = globalIndex === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  className={`
                    w-full px-3 py-2 flex items-center gap-3 text-left transition-colors
                    ${isSelected ? 'selected bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                  onClick={() => onSelect(cmd, query)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                >
                  <span className="material-icons-round text-xl text-gray-500 dark:text-gray-400">
                    {cmd.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-ink dark:text-white truncate">
                      {cmd.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {cmd.description}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-gray-400">Enter</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {filteredCommands.length === 0 && (
        <div className="p-4 text-center text-gray-400 text-sm">
          No commands found
        </div>
      )}
    </div>
  );
};

// 解析文本中的斜杠命令
export function parseSlashCommand(text: string): { command: string; query: string } | null {
  const match = text.match(/^\/(\w+)\s*(.*)$/);
  if (match) {
    return {
      command: match[1],
      query: match[2],
    };
  }
  return null;
}

export default SlashCommandPalette;
