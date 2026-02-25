import React, { useState, useEffect, useRef } from 'react';
import { NeoButton } from '../components/NeoButton';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { AnimatedPlanet } from '../components/AnimatedPlanet';
import { VicooIcon } from '../components/VicooIcon';

interface PublicGatewayProps { onLogin: () => void; }

interface Post {
  id: string; title: string; category: string; snippet: string;
  content: string; summary?: string; timestamp: string; color?: string;
}

const CAT: Record<string, { label: string; bg: string; text: string; accent: string }> = {
  code:    { label: '技术', bg: 'bg-blue-500',   text: 'text-white', accent: '#3B82F6' },
  design:  { label: '设计', bg: 'bg-fuchsia-500', text: 'text-white', accent: '#D946EF' },
  meeting: { label: '协作', bg: 'bg-amber-400',  text: 'text-ink',   accent: '#FBBF24' },
  idea:    { label: '灵感', bg: 'bg-emerald-500', text: 'text-white', accent: '#10B981' },
};

function timeAgo(ts: string) {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  if (d > 30) return `${Math.floor(d / 30)}月前`;
  if (d > 0) return `${d}天前`;
  return '今天';
}

export const PublicGateway: React.FC<PublicGatewayProps> = ({ onLogin }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/published?limit=50').then(r => r.json())
      .then(d => { setPosts(d.data || []); setTotal(d.meta?.total || 0); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const featured = posts[0];
  const grid = posts.slice(1);

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }}>

      {/* ╔══════════════════════════════════════╗
          ║  S1 — HERO: Full-bleed color block   ║
          ╚══════════════════════════════════════╝ */}
      <section className="relative min-h-screen bg-ink text-white overflow-hidden flex flex-col">
        {/* Parallax background shapes */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-3xl"
               style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-500/15 blur-3xl"
               style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] rounded-full bg-primary/10 blur-3xl"
               style={{ transform: `translateY(${scrollY * -0.08}px)` }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10"><AnimatedLogo /></div>
            <span className="font-display font-black text-2xl tracking-tight">vicoo</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold">
            <a href="#articles" className="opacity-60 hover:opacity-100 transition-opacity hidden md:block">文章</a>
            <a href="#about" className="opacity-60 hover:opacity-100 transition-opacity hidden md:block">关于</a>
            <button onClick={onLogin}
              className="px-5 py-2 bg-primary text-ink border-3 border-white rounded-xl font-black shadow-[3px_3px_0_#fff] hover:shadow-[5px_5px_0_#fff] hover:-translate-y-0.5 active:shadow-none active:translate-y-0 transition-all">
              进入工作台
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center px-8 md:px-16 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center w-full py-16">
            <div className="lg:col-span-3">
              <div className="inline-block px-4 py-1 bg-primary/20 border border-primary/40 rounded-full mb-6">
                <span className="text-primary text-xs font-black tracking-widest uppercase">Knowledge · AI · Galaxy</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-6">
                构建你的
                <span className="block mt-2 relative">
                  <span className="relative z-10">知识宇宙</span>
                  <span className="absolute bottom-2 left-0 w-full h-5 bg-primary/70 -z-0 -skew-x-2" />
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/60 font-medium max-w-xl mb-10 leading-relaxed">
                从碎片笔记到结构化知识图谱。AI 摘要、语义关联、跨平台发布——打造属于你的第二大脑。
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <p className="text-4xl font-black text-primary">{total || posts.length}</p>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider mt-1">Published</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-4xl font-black text-blue-400">{[...new Set(posts.map(p => p.category))].length}</p>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider mt-1">Categories</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-4xl font-black text-fuchsia-400">AI</p>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider mt-1">Powered</p>
                </div>
              </div>
            </div>

            {/* Floating planets with parallax */}
            <div className="lg:col-span-2 hidden lg:block relative h-[400px]">
              <div className="absolute top-0 right-12" style={{ transform: `translateY(${scrollY * -0.12}px)` }}>
                <AnimatedPlanet color="#3B82F6" icon="code" size={110} />
              </div>
              <div className="absolute top-28 left-4" style={{ transform: `translateY(${scrollY * -0.08}px)` }}>
                <AnimatedPlanet color="#D946EF" icon="palette" size={80} />
              </div>
              <div className="absolute bottom-8 right-4" style={{ transform: `translateY(${scrollY * -0.15}px)` }}>
                <AnimatedPlanet color="#10B981" icon="bolt" size={90} />
              </div>
              <div className="absolute bottom-20 left-20" style={{ transform: `translateY(${scrollY * -0.06}px)` }}>
                <AnimatedPlanet color="#FBBF24" icon="auto_awesome" size={65} />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 text-center pb-8 animate-bounce">
          <VicooIcon name="expand_more" size={28} className="text-white/30" />
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║  S2 — FEATURED: Accent color block   ║
          ╚══════════════════════════════════════╝ */}
      {featured && (
        <section className="relative bg-primary overflow-hidden"
                 style={{ transform: `translateY(${Math.max(0, 100 - scrollY * 0.08)}px)` }}>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,.04)_25%,transparent_25%,transparent_50%,rgba(0,0,0,.04)_50%,rgba(0,0,0,.04)_75%,transparent_75%)] bg-[size:40px_40px]" />
          <div className="relative max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-ink text-white rounded-lg text-xs font-black uppercase tracking-wider mb-4">
                ★ Featured
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-ink leading-[1] mb-4">{featured.title}</h2>
              <p className="text-ink/70 font-medium text-lg leading-relaxed mb-6">
                {featured.summary || featured.snippet || featured.content?.slice(0, 250)}
              </p>
              <div className="flex items-center gap-4 mb-6">
                {CAT[featured.category] && (
                  <span className={`px-3 py-1 ${CAT[featured.category].bg} ${CAT[featured.category].text} rounded-lg text-xs font-black`}>
                    {CAT[featured.category].label}
                  </span>
                )}
                <span className="text-xs font-bold text-ink/50">{timeAgo(featured.timestamp)}</span>
              </div>
              <button
                onClick={() => setExpanded(expanded === featured.id ? null : featured.id)}
                className="px-6 py-3 bg-ink text-white font-black rounded-xl border-3 border-ink shadow-[4px_4px_0_rgba(0,0,0,.3)] hover:shadow-[6px_6px_0_rgba(0,0,0,.3)] hover:-translate-y-0.5 transition-all"
              >
                {expanded === featured.id ? '收起 ↑' : '阅读全文 →'}
              </button>
              {expanded === featured.id && (
                <div className="mt-6 p-6 bg-white rounded-xl border-3 border-ink shadow-neo text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {featured.content}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center"
                 style={{ transform: `translateY(${Math.max(0, (scrollY - 400) * -0.08)}px)` }}>
              <AnimatedPlanet color={featured.color || '#1a1a1a'} icon="article" size={220} />
            </div>
          </div>
        </section>
      )}

      {/* ╔══════════════════════════════════════╗
          ║  S3 — ARTICLES: White block           ║
          ╚══════════════════════════════════════╝ */}
      <section id="articles" className="relative bg-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-end gap-4 mb-12">
            <h2 className="text-5xl font-display font-black text-ink uppercase tracking-tight">最新文章</h2>
            <div className="flex-1 h-1 bg-ink/10 mb-3" />
            <span className="text-sm font-black text-ink/30 mb-3">{posts.length} 篇</span>
          </div>

          {grid.length === 0 && !featured ? (
            <div className="text-center py-24 border-3 border-dashed border-ink/20 rounded-2xl">
              <p className="text-2xl font-black text-ink/20 mb-2">暂无文章</p>
              <p className="text-ink/30 font-medium mb-6">在编辑器中将笔记标记为「已发布」</p>
              <NeoButton onClick={onLogin}>去写第一篇 →</NeoButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {grid.map((post, i) => {
                const c = CAT[post.category] || CAT.idea;
                const isOpen = expanded === post.id;
                return (
                  <article key={post.id} className="group relative"
                           style={{ transform: `translateY(${Math.max(0, (scrollY - 800 - i * 60) * -0.03)}px)` }}>
                    {/* Shadow layer */}
                    <div className="absolute inset-0 bg-ink translate-x-2 translate-y-2 rounded-2xl transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                    <div className="relative bg-white border-3 border-ink rounded-2xl overflow-hidden flex flex-col h-full">
                      {/* Bold color header */}
                      <div className={`${c.bg} px-6 py-4 flex items-center justify-between`}>
                        <span className={`${c.text} text-xs font-black uppercase tracking-wider`}>{c.label}</span>
                        <span className={`${c.text} text-xs font-bold opacity-70`}>{timeAgo(post.timestamp)}</span>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-black text-ink mb-3 leading-snug group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-ink/50 font-medium leading-relaxed mb-4 flex-1">
                          {post.summary || post.snippet || post.content?.slice(0, 140)}
                        </p>
                        {isOpen && (
                          <div className="mb-4 p-4 bg-gray-50 border-2 border-ink/10 rounded-xl text-sm leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                            {post.content}
                          </div>
                        )}
                        <button onClick={() => setExpanded(isOpen ? null : post.id)}
                          className="self-start text-xs font-black text-ink border-2 border-ink px-4 py-2 rounded-lg hover:bg-ink hover:text-white transition-all">
                          {isOpen ? '收起' : '展开阅读 →'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║  S4 — ABOUT: Blue color block         ║
          ╚══════════════════════════════════════╝ */}
      <section id="about" className="relative bg-blue-600 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-10 right-10 w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl"
               style={{ transform: `translateY(${(scrollY - 1200) * 0.1}px)` }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl font-display font-black leading-tight mb-6">
              AI 驱动的<br/>知识管理
            </h2>
            <p className="text-white/70 text-lg font-medium leading-relaxed mb-4">
              Vicoo 将 AI 深度集成到知识管理的每一个环节：智能摘要、语义标签、知识图谱、跨平台发布。
            </p>
            <p className="text-white/70 text-lg font-medium leading-relaxed mb-8">
              通过 Galaxy View 可视化知识关联，识别「基础→进阶」「对比」「依赖」等语义关系，帮你理清学习脉络。
            </p>
            <div className="flex flex-wrap gap-3">
              {['React', 'TypeScript', 'Vue.js', 'Node.js', 'Python', 'LangChain', 'Tailwind', 'Vite'].map(t => (
                <span key={t} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-bold">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center" style={{ transform: `translateY(${(scrollY - 1200) * -0.08}px)` }}>
            <AnimatedPlanet color="#60A5FA" icon="auto_awesome" size={240} />
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║  S5 — CTA: Ink / dark block           ║
          ╚══════════════════════════════════════╝ */}
      <section className="bg-ink text-white py-24">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-black mb-4">开始构建知识宇宙</h2>
          <p className="text-white/40 font-medium text-lg mb-10">免费使用 · AI 驱动 · 开源</p>
          <button onClick={onLogin}
            className="px-10 py-4 bg-primary text-ink text-lg font-black rounded-2xl border-3 border-primary shadow-[5px_5px_0_#fff] hover:shadow-[8px_8px_0_#fff] hover:-translate-y-1 active:shadow-none active:translate-y-0 transition-all">
            进入工作台 →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-white/10 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 opacity-50"><AnimatedLogo /></div>
            <span className="text-white/30 text-sm font-bold">Vicoo © 2024</span>
          </div>
          <div className="flex gap-6 text-sm font-bold text-white/30">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
