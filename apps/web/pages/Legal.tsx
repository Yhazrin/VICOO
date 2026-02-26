import React, { useState } from 'react';
import { VicooIcon } from '../components/VicooIcon';

type LegalTab = 'privacy' | 'terms';

export const Legal: React.FC = () => {
  const [tab, setTab] = useState<LegalTab>('privacy');

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex gap-4 mb-8">
        <button onClick={() => setTab('privacy')}
          className={`px-5 py-2 rounded-xl font-bold text-sm border-2 transition-all ${tab === 'privacy' ? 'bg-ink text-white border-ink' : 'bg-white text-gray-500 border-gray-200'}`}>
          隐私政策
        </button>
        <button onClick={() => setTab('terms')}
          className={`px-5 py-2 rounded-xl font-bold text-sm border-2 transition-all ${tab === 'terms' ? 'bg-ink text-white border-ink' : 'bg-white text-gray-500 border-gray-200'}`}>
          服务条款
        </button>
      </div>

      {tab === 'privacy' && (
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1>隐私政策</h1>
          <p className="text-sm text-gray-500">最后更新: 2025年2月</p>

          <h2>1. 信息收集</h2>
          <p>我们收集以下类型的信息：</p>
          <ul>
            <li><strong>账户信息</strong>：注册时的用户名、邮箱地址</li>
            <li><strong>内容数据</strong>：您创建的笔记、标签、项目等用户生成内容</li>
            <li><strong>使用数据</strong>：功能使用频率、AI 调用次数等匿名统计</li>
            <li><strong>设备信息</strong>：浏览器类型、操作系统（用于优化体验）</li>
          </ul>

          <h2>2. 信息使用</h2>
          <p>我们使用收集的信息用于：</p>
          <ul>
            <li>提供、维护和改进 Vicoo 服务</li>
            <li>处理您的订阅和支付</li>
            <li>通过 AI 功能增强您的知识管理体验</li>
            <li>发送服务相关通知</li>
          </ul>

          <h2>3. AI 数据处理</h2>
          <p>当您使用 AI 功能时：</p>
          <ul>
            <li>您的笔记内容会发送到 AI 服务商（MiniMax/OpenAI/Anthropic/Google）进行处理</li>
            <li>我们不会将您的内容用于训练 AI 模型</li>
            <li>AI 处理结果仅返回给您，不会与其他用户共享</li>
          </ul>

          <h2>4. 数据安全</h2>
          <ul>
            <li>密码使用 bcrypt 加密存储</li>
            <li>API 通信使用 HTTPS 加密</li>
            <li>JWT token 用于身份验证</li>
            <li>实施速率限制防止滥用</li>
          </ul>

          <h2>5. 数据删除</h2>
          <p>您可以随时删除您的账户和所有数据。删除后，我们将在 30 天内从服务器上彻底移除。</p>

          <h2>6. 第三方服务</h2>
          <p>我们使用以下第三方服务：</p>
          <ul>
            <li>MiniMax AI — 智能助手、摘要、标签</li>
            <li>Stripe/微信支付/支付宝 — 支付处理</li>
            <li>Google/GitHub — OAuth 登录</li>
          </ul>

          <h2>7. 联系我们</h2>
          <p>如有隐私相关问题，请联系：privacy@vicoo.app</p>
        </article>
      )}

      {tab === 'terms' && (
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1>服务条款</h1>
          <p className="text-sm text-gray-500">最后更新: 2025年2月</p>

          <h2>1. 服务描述</h2>
          <p>Vicoo 是一款 AI 驱动的个人知识管理工具，提供笔记管理、知识图谱、AI 助手、跨平台发布等功能。</p>

          <h2>2. 账户</h2>
          <ul>
            <li>您必须年满 16 周岁才能使用本服务</li>
            <li>您有责任保管好账户密码</li>
            <li>一个邮箱只能注册一个账户</li>
          </ul>

          <h2>3. 订阅与付费</h2>
          <ul>
            <li><strong>免费版</strong>：基础功能，有用量限制</li>
            <li><strong>专业版（¥29/月）</strong>：扩展用量和全平台发布</li>
            <li><strong>团队版（¥99/月）</strong>：无限用量和团队协作</li>
            <li>订阅自动续费，可随时取消</li>
            <li>取消后服务持续至当前周期结束</li>
          </ul>

          <h2>4. 用户内容</h2>
          <ul>
            <li>您保留您创建内容的所有权</li>
            <li>您授权我们存储和处理您的内容以提供服务</li>
            <li>您不得上传违法或侵权内容</li>
          </ul>

          <h2>5. AI 功能</h2>
          <ul>
            <li>AI 生成的内容仅供参考</li>
            <li>我们不对 AI 输出的准确性做保证</li>
            <li>您有责任审核 AI 生成的内容</li>
          </ul>

          <h2>6. 限制</h2>
          <ul>
            <li>不得滥用 API 或进行恶意请求</li>
            <li>不得逆向工程或试图访问未授权的数据</li>
            <li>不得使用自动化工具大量抓取内容</li>
          </ul>

          <h2>7. 免责声明</h2>
          <p>本服务按"现状"提供。我们不保证服务的不间断运行。对于因使用本服务造成的任何间接损失，我们不承担责任。</p>

          <h2>8. 变更</h2>
          <p>我们保留修改这些条款的权利。重大变更将通过邮件通知。</p>

          <h2>9. 联系</h2>
          <p>legal@vicoo.app</p>
        </article>
      )}
    </div>
  );
};

export default Legal;
