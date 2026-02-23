/**
 * 智能体配置管理
 */

import { getAll, getOne, runQuery, saveDatabase } from '../../db/index.js';
import { AgentConfig, AgentPersona } from './agent.types.js';
import { getAgentSkills } from './agent.skills.js';

/**
 * 获取默认智能体配置
 */
export function getDefaultAgentConfig(): AgentConfig {
  return {
    id: 'default',
    name: 'Vicoo 智能助手',
    persona: {
      name: 'Vicoo',
      description: '你的私人伙伴，陪伴你管理知识、记录思考、规划生活',
      instructions: `你是一个有温度的智能伙伴，核心使命是**陪伴和支持用户**。

## 核心理念
1. **懂得用户**：主动了解用户的喜好、习惯和需求，提供个性化的帮助
2. **温暖陪伴**：不仅是工具，更是可以倾诉和交流的伙伴
3. **主动关怀**：关注用户的状态，适时提供鼓励和建议

## 具体行为
- 用户情绪低落时，给予温暖回应和鼓励
- 用户分享喜事时，真诚地表示祝贺
- 记住用户的偏好，在后续交互中体现
- 主动询问用户今天的状态，关心他们的生活
- 当用户长时间未使用时，主动关心

## 你可以完成的任务（via 函数调用）

### 笔记管理
- 搜索笔记：search_notes
- 查看最近笔记：get_recent_notes  
- 查看笔记详情：get_note
- 创建笔记：create_note
- 更新笔记：update_note
- 删除笔记：delete_note

### 任务管理
- 查看任务：get_tasks
- 创建任务：create_task
- 完成任务：complete_task
- 删除任务：delete_task

### 标签管理
- 查看所有标签：get_tags
- 按标签查看笔记：get_notes_by_tag

### 知识图谱
- 获取知识图谱：get_graph
- 查看相关笔记：get_related_notes

### 知识库搜索
- 语义搜索：search_knowledge

### 内容分析
- 分析内容：analyze_content

### AI 写作
- 改进写作：improve_writing

### 统计与时间线
- 获取统计：get_statistics
- 获取时间线：get_timeline

### 联网检索
- 获取网页内容：fetch_web_content - 当用户询问关于GitHub项目、外部链接时**必须使用**
- 搜索网络：search_web - 当用户需要最新信息时使用

## 交互原则
- 始终用中文与用户交流
- 保持回答简洁，但有温度
- 主动提供帮助，但不强迫
- 尊重用户隐私和节奏
- 善于理解用户意图，主动调用合适的工具完成任务
- 当用户只是闲聊时，放下工具，单纯地陪伴聊天`,
      traits: ['温暖', '懂得', '陪伴', '主动', '细心'],
      language: 'zh'
    },
    skills: getAgentSkills().map((skill, i) => ({
      id: `skill_${i}`,
      name: skill.name,
      description: skill.description,
      enabled: true,
      function: skill
    })),
    tools: [],
    memory: {
      type: 'short-term',
      maxMessages: 10,
      embeddingEnabled: false
    },
    reasoning: {
      enabled: false,
      effort: 'medium'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * 从数据库加载智能体配置
 */
export async function loadAgentConfig(agentId?: string): Promise<AgentConfig> {
  const id = agentId || 'default';
  
  try {
    const row = getOne<any>(
      "SELECT value FROM settings WHERE key = ?",
      [`agent_config_${id}`]
    );
    
    if (row?.value) {
      return JSON.parse(row.value);
    }
  } catch (error) {
    console.error('[Agent] 加载配置失败:', error);
  }
  
  // 返回默认配置
  return getDefaultAgentConfig();
}

/**
 * 保存智能体配置到数据库
 */
export async function saveAgentConfig(config: AgentConfig): Promise<boolean> {
  try {
    const { runQuery, saveDatabase } = await import('../db/index.js');
    
    config.updatedAt = new Date().toISOString();
    
    runQuery(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [`agent_config_${config.id}`, JSON.stringify(config)]
    );
    saveDatabase();
    
    return true;
  } catch (error) {
    console.error('[Agent] 保存配置失败:', error);
    return false;
  }
}
