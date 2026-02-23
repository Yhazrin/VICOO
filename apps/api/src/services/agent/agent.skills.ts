/**
 * 智能体技能定义
 */

import { AgentSkillFunction } from './agent.types.js';

/**
 * 获取智能体可用的技能定义（用于函数调用）
 */
export function getAgentSkills(): AgentSkillFunction[] {
  return [
    // ========== 笔记管理 ==========
    {
      name: 'search_notes',
      description: '搜索用户的笔记内容。当用户想要查找特定笔记或相关内容时使用。',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          limit: { type: 'number', description: '返回数量限制，默认5' }
        },
        required: ['query']
      }
    },
    {
      name: 'get_recent_notes',
      description: '获取用户最近创建的笔记列表。',
      input_schema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '返回数量限制，默认10' },
          category: { type: 'string', description: '可选，按分类筛选(idea/code/design/meeting/todo)' }
        }
      }
    },
    {
      name: 'get_note',
      description: '获取指定笔记的详细内容。',
      input_schema: {
        type: 'object',
        properties: {
          noteId: { type: 'string', description: '笔记ID' }
        },
        required: ['noteId']
      }
    },
    {
      name: 'create_note',
      description: '创建新的笔记。当用户想要保存或记录内容时使用。',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '笔记标题' },
          content: { type: 'string', description: '笔记内容（支持 Markdown）' },
          category: { type: 'string', description: '分类：idea/code/design/meeting/todo' },
          tags: { type: 'string', description: '标签，逗号分隔' }
        },
        required: ['title', 'content']
      }
    },
    {
      name: 'update_note',
      description: '更新现有笔记的内容。',
      input_schema: {
        type: 'object',
        properties: {
          noteId: { type: 'string', description: '笔记ID' },
          title: { type: 'string', description: '新标题' },
          content: { type: 'string', description: '新内容' },
          category: { type: 'string', description: '新分类' }
        },
        required: ['noteId']
      }
    },
    {
      name: 'delete_note',
      description: '删除指定的笔记。',
      input_schema: {
        type: 'object',
        properties: {
          noteId: { type: 'string', description: '笔记ID' }
        },
        required: ['noteId']
      }
    },
    // ========== 任务管理 ==========
    {
      name: 'get_tasks',
      description: '获取用户的任务列表。',
      input_schema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '筛选状态：pending/completed/all，默认 pending' }
        }
      }
    },
    {
      name: 'create_task',
      description: '创建新的任务。',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '任务标题' },
          description: { type: 'string', description: '任务描述' },
          priority: { type: 'string', description: '优先级：low/medium/high，默认 medium' }
        },
        required: ['title']
      }
    },
    {
      name: 'complete_task',
      description: '标记任务为完成状态。',
      input_schema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: '任务ID' }
        },
        required: ['taskId']
      }
    },
    {
      name: 'delete_task',
      description: '删除指定的任务。',
      input_schema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: '任务ID' }
        },
        required: ['taskId']
      }
    },
    // ========== 标签管理 ==========
    {
      name: 'get_tags',
      description: '获取用户所有的标签列表。',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_notes_by_tag',
      description: '获取指定标签下的所有笔记。',
      input_schema: {
        type: 'object',
        properties: {
          tag: { type: 'string', description: '标签名称' }
        },
        required: ['tag']
      }
    },
    // ========== 知识图谱 ==========
    {
      name: 'get_graph',
      description: '获取用户的知识图谱，了解笔记之间的关联。',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_related_notes',
      description: '获取与指定笔记相关的其他笔记。',
      input_schema: {
        type: 'object',
        properties: {
          noteId: { type: 'string', description: '笔记ID' }
        },
        required: ['noteId']
      }
    },
    // ========== 知识库搜索 ==========
    {
      name: 'search_knowledge',
      description: '在知识库中进行语义搜索，获取相关文档。适合深入理解某主题。',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索查询' },
          topK: { type: 'number', description: '返回数量，默认3' }
        },
        required: ['query']
      }
    },
    // ========== 内容分析 ==========
    {
      name: 'analyze_content',
      description: '分析内容并生成摘要、标签、分类建议。',
      input_schema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '要分析的内容' }
        },
        required: ['content']
      }
    },
    // ========== AI 写作 ==========
    {
      name: 'improve_writing',
      description: '使用 AI 改进写作质量。',
      input_schema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '需要改进的内容' },
          style: { type: 'string', description: '改进风格：formal/casual/creative/business' }
        },
        required: ['content']
      }
    },
    // ========== 统计信息 ==========
    {
      name: 'get_statistics',
      description: '获取用户的笔记和任务统计信息。',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },
    // ========== 时间线 ==========
    {
      name: 'get_timeline',
      description: '获取笔记的时间线，按日期查看历史。',
      input_schema: {
        type: 'object',
        properties: {
          days: { type: 'number', description: '查看最近多少天，默认30' }
        }
      }
    },
    // ========== 联网检索 ==========
    {
      name: 'fetch_web_content',
      description: '获取指定URL的网页内容。当用户询问外部链接、GitHub项目或其他网页内容时使用。',
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '要获取的URL地址' },
          type: { type: 'string', description: '内容类型：github/readme/general，默认 general' }
        },
        required: ['url']
      }
    },
    {
      name: 'search_web',
      description: '使用搜索引擎搜索相关信息。当需要查找最新信息、新闻、技术文档时使用。',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          limit: { type: 'number', description: '返回结果数量，默认5' }
        },
        required: ['query']
      }
    },
    // ========== 社交媒体发布 ==========
    {
      name: 'publish_to_social',
      description: '将视频发布到社交媒体平台（抖音、小红书、B站、快手、视频号等）。需要用户提供视频文件路径。',
      input_schema: {
        type: 'object',
        properties: {
          video_path: { type: 'string', description: '视频文件的完整路径' },
          platforms: { type: 'array', items: { type: 'string' }, description: '目标平台列表：douyin/xhs/bilibili/ks/tencent/baijiahao/tiktok' },
          title: { type: 'string', description: '视频标题' },
          tags: { type: 'array', items: { type: 'string' }, description: '视频标签列表' },
          schedule: { type: 'string', description: '定时发布时间，ISO格式日期字符串（如2024-01-15T10:00:00Z）' }
        },
        required: ['video_path', 'platforms']
      }
    },
    {
      name: 'get_publish_accounts',
      description: '获取用户已绑定的社交媒体账号列表。',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_supported_platforms',
      description: '获取支持的社交媒体平台列表。',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_publish_tasks',
      description: '获取发布任务列表，查看发布历史和状态。',
      input_schema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '筛选状态：pending/scheduled/published/failed' }
        }
      }
    }
  ];
}
