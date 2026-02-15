import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicGatewayProps {
    onLogin: () => void;
}

// Mock Published Data
const PUBLISHED_POSTS = [
    { 
        id: '1', title: 'Why I Switched to Vibe Coding', excerpt: 'Stop overthinking architectures. Just build, iterate, and let the AI refactor later.', 
        tag: 'Philosophy', date: 'Oct 24, 2023', color: 'primary', readTime: '5 min' 
    },
    { 
        id: '2', title: 'React Server Components: A Deep Dive', excerpt: 'Based on my research of 15 YouTube tutorials, here is the mental model you actually need.', 
        tag: 'Research', date: 'Oct 20, 2023', color: 'info', readTime: '12 min' 
    },
    { 
        id: '3', title: 'Neubrutalism Design Token System', excerpt: 'Sharing my Figma variables and CSS snippets for this exact blog theme.', 
        tag: 'Design', date: 'Oct 15, 2023', color: 'accent', readTime: '3 min' 
    }
];

export const PublicGateway: React.FC<PublicGatewayProps> = ({ onLogin }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="min-h-screen bg-light overflow-y-auto">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b-3 border-ink px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10">
                        <AnimatedLogo />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display font-black text-xl tracking-tight leading-none">vicoo</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase">{t('public.nav_subtitle')}</span>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <a href="#" className="font-bold hover:underline hidden md:block">RSS</a>
                    <a href="#" className="font-bold hover:underline hidden md:block">About</a>
                    <NeoButton size="sm" onClick={onLogin}>{t('public.login')}</NeoButton>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="px-6 py-20 max-w-5xl mx-auto text-center relative">
                <div className="absolute top-10 right-10 hidden lg:block opacity-20 hover:opacity-100 transition-opacity">
                    <Mascot state="happy" className="w-40 h-40" />
                </div>
                
                <h1 className="text-5xl md:text-8xl font-display font-black mb-6 text-ink leading-tight tracking-tight">
                    {t('public.hero_title_1')}<br/>
                    <span className="bg-primary px-4 border-4 border-ink text-ink inline-block transform -rotate-2 shadow-neo-lg">{t('public.hero_title_2')}</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto mb-10">
                    {t('public.hero_desc')}
                </p>

                {/* Search Bar */}
                <div className="max-w-xl mx-auto relative group">
                    <div className="absolute inset-0 bg-ink translate-x-2 translate-y-2 rounded-2xl transition-transform group-hover:translate-x-3 group-hover:translate-y-3"></div>
                    <input 
                        type="text" 
                        placeholder={t('public.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-6 pr-14 rounded-2xl border-3 border-ink text-lg font-bold shadow-none relative z-10 focus:ring-0 focus:outline-none bg-white"
                    />
                    <button className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-lg bg-ink text-white hover:bg-gray-800 z-20">
                        <span className="material-icons-round text-lg">search</span>
                    </button>
                </div>
            </header>

            {/* Content Grid */}
            <main className="max-w-6xl mx-auto px-6 pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold font-display uppercase tracking-wider">{t('public.latest_vibes')}</h2>
                    <div className="flex-1 h-px bg-ink/10"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PUBLISHED_POSTS.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((post) => (
                        <div key={post.id} className="group">
                            <NeoCard 
                                color={post.color as any} 
                                className="h-full flex flex-col p-6 hover:-translate-y-2 transition-transform cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-white border-2 border-ink px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                        {post.tag}
                                    </span>
                                    <span className="text-xs font-bold opacity-60">{post.readTime}</span>
                                </div>
                                
                                <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:underline">{post.title}</h3>
                                <p className="text-sm font-medium opacity-80 mb-6 leading-relaxed flex-1">
                                    {post.excerpt}
                                </p>

                                <div className="pt-4 border-t-2 border-black/10 flex justify-between items-center">
                                    <span className="text-xs font-bold">{post.date}</span>
                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-ink flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors">
                                        <span className="material-icons-round text-sm">arrow_forward</span>
                                    </div>
                                </div>
                            </NeoCard>
                        </div>
                    ))}
                </div>

                {/* Newsletter / CTA */}
                <div className="mt-24">
                    <NeoCard className="p-12 text-center bg-gray-900 text-white border-ink relative overflow-hidden">
                        <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-4xl font-display font-black mb-4 uppercase italic">{t('public.newsletter_title')}</h2>
                            <p className="text-gray-400 mb-8">{t('public.newsletter_desc')}</p>
                            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                <input type="email" placeholder="your@email.com" className="flex-1 bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 font-bold focus:border-primary focus:outline-none" />
                                <NeoButton variant="primary">{t('public.subscribe')}</NeoButton>
                            </div>
                        </div>
                    </NeoCard>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t-3 border-ink py-12 px-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all">
                    <AnimatedLogo />
                </div>
                <p className="font-bold text-gray-500">{t('public.footer')} • 2024</p>
                <div className="flex justify-center gap-6 mt-4 text-sm font-bold underline">
                    <a href="#">Twitter</a>
                    <a href="#">GitHub</a>
                    <a href="#">YouTube</a>
                </div>
            </footer>
        </div>
    );
};