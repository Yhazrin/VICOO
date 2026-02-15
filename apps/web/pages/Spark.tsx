import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { Note } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// Mock Data Source (In a real app, this comes from context/store)
const MOCK_DB: Note[] = [
    { id: '1', title: 'React Server Components', category: 'code', tags: ['Performance', 'Next.js'], timestamp: '1', content: 'RSC allows rendering on the server...' },
    { id: '2', title: 'Neubrutalism Design', category: 'design', tags: ['UI', 'Trends'], timestamp: '2', content: 'High contrast, bold typography, raw layout...' },
    { id: '3', title: 'Startups & AI', category: 'idea', tags: ['Business', 'LLM'], timestamp: '3', content: 'The barrier to entry is lower, but retention is harder...' },
    { id: '4', title: 'Gardening Metaphor', category: 'idea', tags: ['Philosophy', 'Systems'], timestamp: '4', content: 'Tend to your notes like a garden, prune the dead leaves...' },
    { id: '5', title: 'CSS Grid Layouts', category: 'code', tags: ['CSS', 'Layout'], timestamp: '5', content: 'Grid area names make layouts semantic...' },
    { id: '6', title: 'Color Theory', category: 'design', tags: ['UI', 'Art'], timestamp: '6', content: 'Complementary colors create vibration...' },
];

export const Spark: React.FC = () => {
    const { t } = useLanguage();
    const [dealtCards, setDealtCards] = useState<Note[]>([]);
    const [isShuffling, setIsShuffling] = useState(false);
    const [connectionInput, setConnectionInput] = useState('');
    const [isFused, setIsFused] = useState(false);

    // Initial Deal
    useEffect(() => {
        dealCards();
    }, []);

    const dealCards = () => {
        if (isShuffling) return;
        setIsShuffling(true);
        setIsFused(false);
        setConnectionInput('');
        
        // Simulate shuffle animation time
        setTimeout(() => {
            const shuffled = [...MOCK_DB].sort(() => 0.5 - Math.random());
            setDealtCards(shuffled.slice(0, 3)); // Pick 3 random
            setIsShuffling(false);
        }, 800);
    };

    const handleFuse = () => {
        if (!connectionInput.trim()) return;
        setIsFused(true);
        // In real app: Save this new connection node
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 h-full flex flex-col">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2 flex items-center gap-2">
                        <span className="material-icons-round text-4xl text-primary animate-pulse">auto_awesome</span>
                        {t('spark.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{t('spark.subtitle')}</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-400 uppercase">{t('spark.streak')}</p>
                    <p className="text-2xl font-black text-ink dark:text-white">3 {t('spark.days')} 🔥</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col justify-center items-center relative min-h-[500px]">
                
                {/* The "Table" Surface */}
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-3xl border-3 border-dashed border-gray-300 dark:border-gray-700 -z-10"></div>

                {isFused ? (
                    // SUCCESS STATE: FUSED CARD
                    <div className="animate-pop flex flex-col items-center">
                        <Mascot state="happy" className="w-32 h-32 mb-6" />
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary blur-2xl opacity-50 animate-pulse"></div>
                            <NeoCard className="p-8 max-w-lg relative z-10 text-center border-primary ring-4 ring-primary/30">
                                <h2 className="text-2xl font-bold mb-4">{t('spark.success_title')}</h2>
                                <p className="text-lg font-medium text-gray-600 dark:text-gray-300 italic mb-6">
                                    "{connectionInput}"
                                </p>
                                <div className="flex gap-2 justify-center mb-6">
                                    {dealtCards.map(c => (
                                        <span key={c.id} className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-300">
                                            {c.title}
                                        </span>
                                    ))}
                                </div>
                                <NeoButton onClick={dealCards} size="lg" className="w-full animate-bounce-slow">
                                    {t('spark.spark_again')} <span className="material-icons-round ml-2">restart_alt</span>
                                </NeoButton>
                            </NeoCard>
                        </div>
                    </div>
                ) : (
                    // DEALING STATE
                    <div className="w-full max-w-5xl flex flex-col items-center gap-10">
                        
                        {/* The Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full perspective-1000">
                            {dealtCards.map((card, index) => (
                                <div 
                                    key={card.id}
                                    className={`
                                        transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                                        ${isShuffling 
                                            ? 'opacity-0 translate-y-20 rotate-12 scale-50' 
                                            : 'opacity-100 translate-y-0 rotate-0 scale-100'}
                                    `}
                                    style={{ transitionDelay: `${index * 150}ms` }}
                                >
                                    <NeoCard 
                                        color={
                                            card.category === 'code' ? 'info' : 
                                            card.category === 'design' ? 'accent' : 
                                            card.category === 'idea' ? 'secondary' : 'white'
                                        } 
                                        className="h-64 flex flex-col p-6 hover:-translate-y-2 cursor-grab active:cursor-grabbing relative overflow-hidden group"
                                    >
                                        <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/20 rounded-full group-hover:scale-150 transition-transform"></div>
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-white/90 dark:bg-black/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border-2 border-transparent group-hover:border-ink/20">
                                                {card.category}
                                            </span>
                                            <span className="material-icons-round text-ink/20 text-3xl group-hover:text-ink/50 transition-colors">
                                                {card.category === 'code' ? 'code' : card.category === 'design' ? 'palette' : 'lightbulb'}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-2xl font-bold leading-tight mb-2 group-hover:underline decoration-2">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm font-medium opacity-80 line-clamp-4 leading-relaxed">
                                            {card.content}
                                        </p>
                                    </NeoCard>
                                </div>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className={`
                            flex flex-col md:flex-row gap-4 w-full max-w-2xl bg-white dark:bg-gray-800 p-2 rounded-2xl border-3 border-ink dark:border-gray-500 shadow-neo-lg transition-all duration-500
                            ${isShuffling ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}
                        `}>
                            <input 
                                type="text" 
                                value={connectionInput}
                                onChange={(e) => setConnectionInput(e.target.value)}
                                placeholder={t('spark.input_placeholder')}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold placeholder-gray-400 px-4 text-ink dark:text-white"
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={dealCards}
                                    className="px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-ink dark:text-gray-400 transition-colors"
                                    title="Reshuffle"
                                >
                                    <span className="material-icons-round text-2xl">refresh</span>
                                </button>
                                <NeoButton 
                                    onClick={handleFuse}
                                    disabled={!connectionInput}
                                    className={`transition-all ${!connectionInput ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {t('spark.fuse')} <span className="material-icons-round ml-1">merge</span>
                                </NeoButton>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};