/**
 * PublicGateway — Vicoo Knowledge Blog
 *
 * Parallax: CSS 3D perspective on the scroll container.
 *   - `perspective: 1px` on the outer wrapper
 *   - Decorative layers use `translateZ(-Npx) scale(N+1)` → move slower
 *   - Content sits at `translateZ(0)` → normal scroll
 *   All composited on the GPU, zero JS scroll listeners.
 *
 * Reveal: CSS `animation-timeline: view()` for cards entering viewport.
 */

import React, { useState, useEffect } from 'react';
import { NeoButton } from '../components/NeoButton';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { AnimatedPlanet } from '../components/AnimatedPlanet';
import { VicooIcon } from '../components/VicooIcon';

/* ─── types ─── */
interface Props { onLogin: () => void }
interface Post {
  id: string; title: string; category: string; snippet: string;
  content: string; summary?: string; timestamp: string; color?: string;
}

const CAT: Record<string, { label: string; bg: string; text: string }> = {
  code:    { label: '技术', bg: 'bg-blue-500',    text: 'text-white'  },
  design:  { label: '设计', bg: 'bg-fuchsia-500', text: 'text-white'  },
  meeting: { label: '协作', bg: 'bg-amber-400',   text: 'text-ink'    },
  idea:    { label: '灵感', bg: 'bg-emerald-500',  text: 'text-white'  },
};

function timeAgo(ts: string) {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  if (d > 30) return `${Math.floor(d / 30)}月前`;
  if (d > 0) return `${d}天前`;
  return '今天';
}

/* ─── inline critical styles for parallax + reveal ─── */
const PARALLAX_CSS = `
/* 3-D perspective scroll container */
.plx-root {
  perspective: 1px;
  perspective-origin: center top;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
  -webkit-overflow-scrolling: touch;
}

/* Layer behind content — moves slower */
.plx-back {
  transform-origin: center top;
  transform: translateZ(-2px) scale(3);
  pointer-events: none;
  position: absolute;
  inset: 0;
}
.plx-mid {
  transform-origin: center top;
  transform: translateZ(-1px) scale(2);
  pointer-events: none;
  position: absolute;
  inset: 0;
}

/* Normal-speed content layer */
.plx-front {
  transform: translateZ(0);
  position: relative;
}

/* Each "section" must re-establish stacking */
.plx-group {
  position: relative;
  transform-style: preserve-3d;
}

/* Scroll-driven reveal for cards */
@supports (animation-timeline: view()) {
  .reveal-card {
    animation: revealUp linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }
  @keyframes revealUp {
    from { opacity: 0; transform: translateY(60px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
}

/* Fallback: cards always visible when scroll-driven not supported */
@supports not (animation-timeline: view()) {
  .reveal-card { opacity: 1; }
}

/* Respect user motion preference */
@media (prefers-reduced-motion: reduce) {
  .plx-back, .plx-mid { transform: none !important; }
  .reveal-card { animation: none !important; opacity: 1 !important; }
}
`;

/* ─── component ─── */
export const PublicGateway: React.FC<Props> = ({ onLogin }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/published?limit=50').then(r => r.json())
      .then(d => { setPosts(d.data || []); setTotal(d.meta?.total || 0); })
      .catch(() => {});
  }, []);

  const featured = posts[0];
  const grid = posts.slice(1);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PARALLAX_CSS }} />

      <div className="plx-root">

        {/* ═══════════════════════════════════════════
            SECTION 1 — HERO  (dark, full viewport)
            ═══════════════════════════════════════════ */}
        <section className="plx-group min-h-[110vh] bg-ink text-white overflow-hidden">

          {/* ── Parallax back layer: gradient blobs ── */}
          <div className="plx-back" aria-hidden>
            <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-600/25 blur-[100px]" />
            <div className="absolute top-[30%] right-[5%]  w-[30vw] h-[30vw] rounded-full bg-fuchsia-500/20 blur-[80px]" />
            <div className="absolute bottom-[5%] left-[20%] w-[35vw] h-[25vw] rounded-full bg-primary/15 blur-[90px]" />
          </div>

          {/* ── Parallax mid layer: grid + planets ── */}
          <div className="plx-mid" aria-hidden>
            {/* Subtle grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:80px_80px]" />
            {/* Planets at different positions */}
            <div className="absolute top-[15%] right-[12%]"><AnimatedPlanet color="#3B82F6" icon="code" size={100} /></div>
            <div className="absolute top-[35%] right-[32%]"><AnimatedPlanet color="#D946EF" icon="palette" size={70} /></div>
            <div className="absolute top-[55%] right-[8%]"><AnimatedPlanet color="#10B981" icon="bolt" size={85} /></div>
            <div className="absolute top-[48%] right-[25%]"><AnimatedPlanet color="#FBBF24" icon="auto_awesome" size={55} /></div>
          </div>

          {/* ── Front layer: text (normal scroll) ── */}
          <div className="plx-front">
            {/* Nav */}
            <nav className="flex items-center justify-between px-8 md:px-12 py-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9"><AnimatedLogo /></div>
                <span className="font-display font-black text-xl tracking-tight">vicoo</span>
              </div>
              <div className="flex items-center gap-6 text-sm font-bold">
                <a href="#articles" className="opacity-50 hover:opacity-100 transition-opacity hidden md:block">文章</a>
                <a href="#about" className="opacity-50 hover:opacity-100 transition-opacity hidden md:block">关于</a>
                <button onClick={onLogin}
                  className="px-5 py-2 bg-primary text-ink border-2 border-white/80 rounded-xl font-black shadow-[3px_3px_0_#fff] hover:shadow-[5px_5px_0_#fff] hover:-translate-y-0.5 active:shadow-none active:translate-y-0 transition-all">
                  进入工作台
                </button>
              </div>
            </nav>

            {/* Hero copy */}
            <div className="px-8 md:px-12 max-w-4xl pt-[18vh] pb-[22vh]">
              <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
                <span className="text-primary text-[11px] font-black tracking-[0.25em] uppercase">Knowledge · AI · Galaxy</span>
              </div>
              <h1 className="text-[clamp(3rem,8vw,7rem)] font-display font-black leading-[0.88] tracking-tighter mb-7">
                构建你的
                <span className="block mt-1">
                  <span className="relative inline-block">
                    <span className="relative z-10">知识宇宙</span>
                    <span className="absolute bottom-[0.12em] left-0 right-0 h-[0.22em] bg-primary/80 -z-0 -skew-x-3 rounded-sm" />
                  </span>
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/50 font-medium max-w-xl mb-10 leading-relaxed">
                从碎片笔记到结构化知识图谱。AI 摘要、语义关联、跨平台发布——打造属于你的第二大脑。
              </p>
              <div className="flex items-center gap-8">
                <div><p className="text-3xl font-black text-primary">{total || posts.length}</p><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Published</p></div>
                <div className="w-px h-10 bg-white/10" />
                <div><p className="text-3xl font-black text-blue-400">{[...new Set(posts.map(p => p.category))].length}</p><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Categories</p></div>
                <div className="w-px h-10 bg-white/10" />
                <div><p className="text-3xl font-black text-fuchsia-400">AI</p><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Powered</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 2 — FEATURED (primary / yellow)
            ═══════════════════════════════════════════ */}
        {featured && (
          <section className="plx-group bg-primary overflow-hidden">
            {/* Diagonal stripe back layer */}
            <div className="plx-back" aria-hidden>
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,.03),rgba(0,0,0,.03)_10px,transparent_10px,transparent_30px)]" />
            </div>

            <div className="plx-front max-w-6xl mx-auto px-8 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-ink text-white rounded-lg text-[11px] font-black uppercase tracking-wider mb-5">★ Featured</span>
                <h2 className="text-4xl md:text-5xl font-black text-ink leading-[0.95] mb-5">{featured.title}</h2>
                <p className="text-ink/60 font-medium text-base leading-relaxed mb-6 max-w-lg">
                  {featured.summary || featured.snippet || featured.content?.slice(0, 260)}
                </p>
                <div className="flex items-center gap-3 mb-6">
                  {CAT[featured.category] && (
                    <span className={`px-3 py-1 ${CAT[featured.category].bg} ${CAT[featured.category].text} rounded-lg text-xs font-black`}>
                      {CAT[featured.category].label}
                    </span>
                  )}
                  <span className="text-xs font-bold text-ink/40">{timeAgo(featured.timestamp)}</span>
                </div>
                <button onClick={() => setExpanded(expanded === featured.id ? null : featured.id)}
                  className="px-6 py-3 bg-ink text-white font-black rounded-xl border-2 border-ink shadow-[4px_4px_0_rgba(0,0,0,.25)] hover:shadow-[6px_6px_0_rgba(0,0,0,.25)] hover:-translate-y-0.5 transition-all">
                  {expanded === featured.id ? '收起 ↑' : '阅读全文 →'}
                </button>
                {expanded === featured.id && (
                  <div className="mt-6 p-6 bg-white rounded-xl border-3 border-ink shadow-neo text-sm leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {featured.content}
                  </div>
                )}
              </div>
              <div className="hidden md:flex items-center justify-center">
                <AnimatedPlanet color={featured.color || '#1a1a1a'} icon="article" size={200} />
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            SECTION 3 — ARTICLES (white)
            ═══════════════════════════════════════════ */}
        <section id="articles" className="plx-group bg-white py-20 md:py-28">
          <div className="plx-front max-w-6xl mx-auto px-8 md:px-12">
            <div className="flex items-end gap-4 mb-14">
              <h2 className="text-4xl md:text-5xl font-display font-black text-ink uppercase tracking-tight leading-none">最新文章</h2>
              <div className="flex-1 h-[3px] bg-ink/8 mb-2" />
              <span className="text-sm font-black text-ink/20 mb-2">{posts.length} 篇</span>
            </div>

            {grid.length === 0 && !featured ? (
              <div className="text-center py-24 border-3 border-dashed border-ink/15 rounded-2xl">
                <p className="text-2xl font-black text-ink/15 mb-2">暂无文章</p>
                <p className="text-ink/25 font-medium mb-6">在编辑器中将笔记标记为「已发布」</p>
                <NeoButton onClick={onLogin}>去写第一篇 →</NeoButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {grid.map((post) => {
                  const c = CAT[post.category] || CAT.idea;
                  const isOpen = expanded === post.id;
                  return (
                    <article key={post.id} className="reveal-card group relative">
                      {/* Offset shadow */}
                      <div className="absolute inset-0 bg-ink translate-x-[5px] translate-y-[5px] rounded-2xl group-hover:translate-x-[7px] group-hover:translate-y-[7px] transition-transform" />
                      <div className="relative bg-white border-3 border-ink rounded-2xl overflow-hidden flex flex-col h-full">
                        <div className={`${c.bg} px-5 py-3 flex items-center justify-between`}>
                          <span className={`${c.text} text-[11px] font-black uppercase tracking-wider`}>{c.label}</span>
                          <span className={`${c.text} text-[11px] font-bold opacity-70`}>{timeAgo(post.timestamp)}</span>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-lg font-black text-ink mb-3 leading-snug group-hover:text-blue-600 transition-colors">{post.title}</h3>
                          <p className="text-sm text-ink/40 font-medium leading-relaxed mb-4 flex-1">{post.summary || post.snippet || post.content?.slice(0, 140)}</p>
                          {isOpen && (
                            <div className="mb-4 p-4 bg-gray-50 border-2 border-ink/8 rounded-xl text-sm leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">{post.content}</div>
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

        {/* ═══════════════════════════════════════════
            SECTION 4 — ABOUT (blue)
            ═══════════════════════════════════════════ */}
        <section id="about" className="plx-group bg-blue-600 text-white overflow-hidden">
          {/* Glow back layer */}
          <div className="plx-back" aria-hidden>
            <div className="absolute top-[20%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-white/5 blur-[80px]" />
          </div>

          <div className="plx-front max-w-6xl mx-auto px-8 md:px-12 py-24 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-black leading-tight mb-6">
                AI 驱动的<br/>知识管理
              </h2>
              <p className="text-white/60 text-base font-medium leading-relaxed mb-4">
                Vicoo 将 AI 深度集成到知识管理的每一个环节：智能摘要、语义标签、知识图谱、跨平台发布。
              </p>
              <p className="text-white/60 text-base font-medium leading-relaxed mb-8">
                通过 Galaxy View 识别「基础→进阶」「对比」「依赖」等语义关系，帮你理清学习脉络。
              </p>
              <div className="flex flex-wrap gap-2">
                {['React','TypeScript','Vue.js','Node.js','Python','LangChain','Tailwind','Vite'].map(t => (
                  <span key={t} className="px-4 py-1.5 bg-white/8 border border-white/15 rounded-xl text-sm font-bold">{t}</span>
                ))}
              </div>
            </div>
            <div className="hidden md:flex justify-center reveal-card">
              <AnimatedPlanet color="#93C5FD" icon="auto_awesome" size={220} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 5 — CTA (dark)
            ═══════════════════════════════════════════ */}
        <section className="bg-ink text-white py-28">
          <div className="max-w-3xl mx-auto px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4 leading-tight">开始构建<br/>知识宇宙</h2>
            <p className="text-white/30 font-medium mb-10">免费使用 · AI 驱动 · 开源</p>
            <button onClick={onLogin}
              className="px-10 py-4 bg-primary text-ink text-lg font-black rounded-2xl border-3 border-primary shadow-[5px_5px_0_#fff] hover:shadow-[8px_8px_0_#fff] hover:-translate-y-1 active:shadow-none active:translate-y-0 transition-all">
              进入工作台 →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-ink border-t border-white/5 py-8 px-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 opacity-40"><AnimatedLogo /></div>
              <span className="text-white/25 text-sm font-bold">Vicoo © 2024</span>
            </div>
            <div className="flex gap-6 text-sm font-bold text-white/25">
              <a href="#" className="hover:text-white/60 transition-colors">Twitter</a>
              <a href="#" className="hover:text-white/60 transition-colors">GitHub</a>
              <a href="#" className="hover:text-white/60 transition-colors">YouTube</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
