import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { AnimatedPlanet } from '../components/AnimatedPlanet';
import { VicooIcon } from '../components/VicooIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicGatewayProps {
  onLogin: () => void;
}

interface PublishedNote {
  id: string;
  title: string;
  category: string;
  snippet: string;
  content: string;
  summary?: string;
  timestamp: string;
  color?: string;
  coverImage?: string;
}

const CATEGORY_STYLES: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  code:    { icon: 'code', color: 'text-blue-700', bg: 'bg-blue-100', label: '技术' },
  design:  { icon: 'palette', color: 'text-purple-700', bg: 'bg-purple-100', label: '设计' },
  meeting: { icon: 'group', color: 'text-amber-700', bg: 'bg-amber-100', label: '协作' },
  idea:    { icon: 'bolt', color: 'text-green-700', bg: 'bg-green-100', label: '灵感' },
};

const TECH_STACK = [
  { name: 'React', color: '#61DAFB' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'Vue.js', color: '#4FC08D' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Vite', color: '#646CFF' },
  { name: 'Tailwind', color: '#06B6D4' },
  { name: 'Python', color: '#3776AB' },
  { name: 'LangChain', color: '#1C3C3C' },
];

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 30) return `${Math.floor(d / 30)} 个月前`;
  if (d > 0) return `${d} 天前`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h} 小时前`;
  return '刚刚';
}

function readTime(content: string): string {
  const words = content.length;
  const min = Math.max(1, Math.ceil(words / 400));
  return `${min} min`;
}

export const PublicGateway: React.FC<PublicGatewayProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<PublishedNote[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real published posts
    fetch('/api/published?limit=50')
      .then(r => r.json())
      .then(data => {
        setPosts(data.data || []);
        setTotalNotes(data.meta?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Also get total note count for stats
    fetch('/health')
      .then(r => r.json())
      .catch(() => {});
  }, []);

  const filteredPosts = posts.filter(p => {
    const matchSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.snippet?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const featured = filteredPosts[0];
  const rest = filteredPosts.slice(1);
  const categories = [...new Set(posts.map(p => p.category))];

  return (
    <div className="min-h-screen bg-[#FFFCF5] overflow-y-auto">
      {/* ═══════════ Nav ═══════════ */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b-3 border-ink px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9"><AnimatedLogo /></div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-lg tracking-tight">vicoo</span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-500">Knowledge Blog</span>
          </div>
        </div>
        <div className="flex gap-5 items-center text-sm">
          <a href="#articles" className="font-bold hover:text-blue-600 transition-colors hidden md:block">文章</a>
          <a href="#about" className="font-bold hover:text-blue-600 transition-colors hidden md:block">关于</a>
          <a href="#stack" className="font-bold hover:text-blue-600 transition-colors hidden md:block">技术栈</a>
          <NeoButton size="sm" onClick={onLogin}>进入工作台</NeoButton>
        </div>
      </nav>

      {/* ═══════════ Hero ═══════════ */}
      <header className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-100 border-2 border-green-400 rounded-full px-4 py-1 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-green-700">Knowledge Builder • Online</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black text-ink leading-[0.95] tracking-tight mb-6">
              构建你的<br/>
              <span className="relative inline-block">
                <span className="relative z-10">知识宇宙</span>
                <span className="absolute bottom-1 left-0 right-0 h-4 bg-primary/60 -z-0 -rotate-1"></span>
              </span>
            </h1>
            <p className="text-lg text-gray-600 font-medium max-w-lg mb-8 leading-relaxed">
              从碎片笔记到结构化知识体系。AI 驱动的知识管理、语义图谱、跨平台发布——一站式个人知识工作台。
            </p>

            {/* Stats */}
            <div className="flex gap-6 mb-8">
              <div className="text-center">
                <p className="text-3xl font-black text-ink">{totalNotes || posts.length}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Published</p>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="text-center">
                <p className="text-3xl font-black text-ink">{categories.length}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categories</p>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="text-center">
                <p className="text-3xl font-black text-ink">AI</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Powered</p>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-md relative group">
              <div className="absolute inset-0 bg-ink translate-x-1.5 translate-y-1.5 rounded-xl"></div>
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-5 pr-12 rounded-xl border-3 border-ink text-sm font-bold relative z-10 focus:outline-none bg-white"
              />
              <button className="absolute right-2 top-1.5 w-9 h-9 rounded-lg bg-ink text-white flex items-center justify-center z-20">
                <VicooIcon name="search" size={18} />
              </button>
            </div>
          </div>

          {/* Hero visual — mini galaxy */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="relative w-80 h-80">
              <div className="absolute top-4 left-8"><AnimatedPlanet color="#3178C6" icon="code" size={70} /></div>
              <div className="absolute top-20 right-4"><AnimatedPlanet color="#4FC08D" icon="palette" size={55} /></div>
              <div className="absolute bottom-16 left-16"><AnimatedPlanet color="#EF476F" icon="bolt" size={60} /></div>
              <div className="absolute bottom-4 right-20"><AnimatedPlanet color="#FFD166" icon="auto_awesome" size={50} /></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Mascot state="happy" className="w-28 h-28 opacity-90" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ Category Filter ═══════════ */}
      <div id="articles" className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
              !selectedCategory ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-gray-300 hover:border-ink'
            }`}
          >
            全部
          </button>
          {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${
                selectedCategory === key ? 'bg-ink text-white border-ink' : `bg-white ${style.color} border-gray-300 hover:border-ink`
              }`}
            >
              <VicooIcon name={style.icon} size={14} />
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ Featured Article ═══════════ */}
      {featured && (
        <section className="max-w-6xl mx-auto px-6 mb-12">
          <NeoCard className="overflow-hidden bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  {CATEGORY_STYLES[featured.category] && (
                    <span className={`${CATEGORY_STYLES[featured.category].bg} ${CATEGORY_STYLES[featured.category].color} border-2 border-current/20 px-3 py-1 rounded-lg text-xs font-bold`}>
                      {CATEGORY_STYLES[featured.category].label}
                    </span>
                  )}
                  <span className="text-xs font-bold text-gray-400">{timeAgo(featured.timestamp)}</span>
                  <span className="text-xs font-bold text-gray-400">· {readTime(featured.content || featured.snippet || '')}</span>
                </div>
                <h2 className="text-3xl font-black text-ink mb-4 leading-tight">{featured.title}</h2>
                <p className="text-gray-600 font-medium leading-relaxed mb-6">
                  {featured.summary || featured.snippet || featured.content?.slice(0, 200)}
                </p>
                <NeoButton size="sm" onClick={() => setExpandedPost(expandedPost === featured.id ? null : featured.id)}>
                  {expandedPost === featured.id ? '收起' : '阅读全文'} →
                </NeoButton>
                {expandedPost === featured.id && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200 prose max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                    {featured.content || '暂无详细内容'}
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-br from-primary/20 via-amber-100 to-orange-100 p-10 flex items-center justify-center min-h-[300px]">
                <AnimatedPlanet
                  color={featured.color || '#FFD166'}
                  icon={CATEGORY_STYLES[featured.category]?.icon || 'article'}
                  size={160}
                />
              </div>
            </div>
          </NeoCard>
        </section>
      )}

      {/* ═══════════ Article Grid ═══════════ */}
      <main className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black font-display uppercase tracking-wider">最新文章</h2>
          <div className="flex-1 h-0.5 bg-ink/10"></div>
          <span className="text-sm font-bold text-gray-400">{filteredPosts.length} 篇</span>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <VicooIcon name="sync" size={40} className="text-gray-300 animate-spin mx-auto" />
            <p className="text-gray-500 mt-4 font-bold">加载中...</p>
          </div>
        ) : rest.length === 0 && !featured ? (
          <NeoCard className="p-16 text-center bg-white">
            <Mascot state="thinking" className="w-24 h-24 mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">暂无已发布的文章</h3>
            <p className="text-sm text-gray-400 mb-6">在编辑器中将笔记标记为"已发布"即可在这里展示</p>
            <NeoButton onClick={onLogin}>去发布第一篇 →</NeoButton>
          </NeoCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(post => {
              const cs = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.idea;
              const isExpanded = expandedPost === post.id;
              return (
                <div key={post.id} className="group">
                  <NeoCard className="h-full flex flex-col bg-white hover:-translate-y-1.5 hover:shadow-neo-lg transition-all">
                    {/* Color strip */}
                    <div className={`h-1.5 ${cs.bg} rounded-t-xl`} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`${cs.bg} ${cs.color} px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1`}>
                          <VicooIcon name={cs.icon} size={12} />
                          {cs.label}
                        </span>
                        <span className="text-xs font-bold text-gray-400">{readTime(post.content || post.snippet || '')}</span>
                      </div>
                      <h3 className="text-lg font-bold text-ink mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4 flex-1">
                        {post.summary || post.snippet || post.content?.slice(0, 120) || ''}
                      </p>

                      {isExpanded && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {post.content || '暂无详细内容'}
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">{timeAgo(post.timestamp)}</span>
                        <button
                          onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          {isExpanded ? '收起' : '展开阅读'}
                        </button>
                      </div>
                    </div>
                  </NeoCard>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ═══════════ Tech Stack ═══════════ */}
      <section id="stack" className="bg-white border-y-3 border-ink py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-black font-display uppercase tracking-wider mb-8 text-center">技术栈</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {TECH_STACK.map(tech => (
              <div
                key={tech.name}
                className="group px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-ink hover:-translate-y-1 hover:shadow-neo-sm transition-all flex items-center gap-3 cursor-default"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tech.color }} />
                <span className="font-bold text-sm">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ About ═══════════ */}
      <section id="about" className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black font-display mb-6">关于 Vicoo</h2>
            <p className="text-gray-600 font-medium leading-relaxed mb-4">
              Vicoo 是一个 AI 驱动的个人知识管理工作台。将碎片化的笔记、想法和研究成果转化为结构化的知识体系。
            </p>
            <p className="text-gray-600 font-medium leading-relaxed mb-6">
              通过语义知识图谱、AI 摘要、智能标签和跨平台发布，帮助你更好地学习、思考和分享。
            </p>
            <div className="flex gap-4">
              <NeoButton onClick={onLogin}>开始使用</NeoButton>
              <a href="https://github.com" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-ink rounded-xl font-bold text-sm hover:bg-ink hover:text-white transition-colors">
                <VicooIcon name="code" size={16} /> GitHub
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <Mascot state="celebrating" className="w-40 h-40 opacity-80" />
          </div>
        </div>
      </section>

      {/* ═══════════ Newsletter CTA ═══════════ */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <NeoCard className="p-10 md:p-14 bg-ink text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">订阅知识更新</h2>
            <p className="text-gray-400 mb-8 font-medium">每周精选笔记和技术洞察，直达你的收件箱。</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 font-bold focus:border-primary focus:outline-none"
              />
              <NeoButton variant="primary">订阅</NeoButton>
            </div>
          </div>
        </NeoCard>
      </section>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="bg-white border-t-3 border-ink py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all">
              <AnimatedLogo />
            </div>
            <p className="font-bold text-gray-500 text-sm">Vicoo • Visual Coordinator © 2024</p>
          </div>
          <div className="flex gap-6 text-sm font-bold">
            <a href="#" className="text-gray-500 hover:text-ink transition-colors">Twitter</a>
            <a href="#" className="text-gray-500 hover:text-ink transition-colors">GitHub</a>
            <a href="#" className="text-gray-500 hover:text-ink transition-colors">YouTube</a>
            <a href="#" className="text-gray-500 hover:text-ink transition-colors">RSS</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
