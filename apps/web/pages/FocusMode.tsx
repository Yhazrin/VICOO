import React, { useState, useEffect, useRef } from 'react';
import { Mascot } from '../components/Mascot';
import { useLanguage } from '../contexts/LanguageContext';

interface Track {
    id: string;
    title: string;
    artist: string;
    color1: string; // Primary gradient color
    color2: string; // Secondary gradient color
    cover: string; // Emoji or Image URL
    url: string; // Audio URL
}

const PLAYLIST: Track[] = [
    { 
        id: '1', title: 'Lofi Loft', artist: 'Vicoo Beats', 
        color1: '#EF476F', color2: '#FFD166', 
        cover: '☕️', 
        url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3' 
    },
    { 
        id: '2', title: 'Deep Space', artist: 'Neural Network', 
        color1: '#118AB2', color2: '#073B4C', 
        cover: '🌌', 
        url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_077dc81646.mp3?filename=ambient-piano-amp-drone-10781.mp3' 
    },
    { 
        id: '3', title: 'Forest Rain', artist: 'Nature Sounds', 
        color1: '#06D6A0', color2: '#118AB2', 
        cover: '🌿', 
        url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_04d8081699.mp3?filename=forest-lullaby-110624.mp3' 
    },
    { 
        id: '4', title: 'Neon Drive', artist: 'Synthwave Boy', 
        color1: '#FF006E', color2: '#8338EC', 
        cover: '🏎️', 
        url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=retro-city-14099.mp3' 
    }
];

interface FocusModeProps {
    onExit?: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ onExit }) => {
    const { t } = useLanguage();
    // Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60); 
    const [isActive, setIsActive] = useState(false);
    const [task, setTask] = useState("Drafting the React Architecture Doc");

    // Audio Player State
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement>(null);
    const currentTrack = PLAYLIST[currentTrackIndex];

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Audio Logic
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Audio play failed (interaction needed first):", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, volume, currentTrackIndex]);

    const handleTrackChange = (direction: 'next' | 'prev') => {
        let newIndex = direction === 'next' ? currentTrackIndex + 1 : currentTrackIndex - 1;
        if (newIndex >= PLAYLIST.length) newIndex = 0;
        if (newIndex < 0) newIndex = PLAYLIST.length - 1;
        setCurrentTrackIndex(newIndex);
        if (isActive) setIsPlaying(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
        if (!isActive && !isPlaying) setIsPlaying(true);
    };

    return (
        <div className="h-full w-full text-white relative flex flex-col items-center justify-center overflow-hidden">
            {/* 
                NOTE: The main background color and blur are handled by the parent transition layer 
                to ensure the glass effect works seamlessly during expansion.
                This component is transparent by default.
            */}
            
            <audio 
                ref={audioRef} 
                src={currentTrack.url} 
                loop 
                onEnded={() => handleTrackChange('next')}
            />

            {/* Dynamic Ambient Background Blobs */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className={`
                        absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen filter blur-[80px] opacity-40
                        transition-all duration-[2000ms] ease-in-out
                        ${isPlaying ? 'animate-orbit' : ''}
                    `}
                    style={{ 
                        backgroundColor: currentTrack.color1,
                        animationDuration: '15s' 
                    }}
                ></div>

                <div 
                    className={`
                        absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full mix-blend-screen filter blur-[100px] opacity-30
                        transition-all duration-[2000ms] ease-in-out
                        ${isPlaying ? 'animate-orbit' : ''}
                    `}
                    style={{ 
                        backgroundColor: currentTrack.color2,
                        animationDuration: '20s',
                        animationDirection: 'reverse'
                    }}
                ></div>
            </div>

            {/* Top Bar with Slide-Down Entrance */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 animate-[float_1s_ease-out_forwards] translate-y-[-100%] opacity-0" style={{ animationName: 'slideDownFade', animationFillMode: 'forwards' }}>
                <style>{`
                    @keyframes slideDownFade {
                        from { transform: translateY(-100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}</style>
                <div className="flex items-center gap-3">
                     <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                     <div className="flex flex-col">
                        <span className="font-display font-bold text-lg tracking-widest uppercase leading-none text-white drop-shadow-md">{t('focus.title')}</span>
                        <span className="text-[10px] font-bold opacity-80 text-white/80">
                            {isActive ? t('focus.session_active') : t('focus.session_paused')}
                        </span>
                     </div>
                </div>
                <button 
                    onClick={onExit}
                    className="group flex items-center gap-2 font-bold uppercase text-xs tracking-wider border-2 border-white/20 bg-black/20 backdrop-blur-xl rounded-full px-4 py-2 hover:bg-white hover:text-ink hover:border-white transition-all text-white shadow-lg will-change-transform"
                >
                    <span className="material-icons-round text-sm group-hover:rotate-180 transition-transform">close</span> {t('focus.exit')}
                </button>
            </div>

            {/* Timer */}
            <div className="relative z-20 max-w-3xl w-full px-6 flex flex-col items-center">
                <div className="mb-12 relative group cursor-pointer" onClick={toggleTimer}>
                    <div className="text-[10rem] md:text-[14rem] leading-none font-display font-black tracking-tighter tabular-nums select-none transition-all group-hover:scale-105 drop-shadow-2xl text-white">
                        {formatTime(timeLeft)}
                    </div>
                    
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="bg-white text-ink font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            {isActive ? 'Pause Timer' : 'Start Focus'}
                        </span>
                    </div>
                </div>

                <div className="w-full mb-12 relative">
                    <input 
                        type="text" 
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-2xl text-2xl md:text-3xl font-bold text-center py-6 focus:bg-white/10 focus:border-white/30 focus:ring-0 placeholder-white/30 transition-all shadow-lg text-white"
                        placeholder={t('focus.placeholder')}
                    />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-white/20 rounded-full"></div>
                </div>

                <div className="flex gap-6 items-center">
                    <button 
                        onClick={() => setTimeLeft(25 * 60)}
                        className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-white/20 bg-black/20 backdrop-blur text-white/70 hover:text-white hover:bg-white/10 hover:border-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                        title="Reset Timer"
                    >
                        <span className="material-icons-round text-2xl">restart_alt</span>
                    </button>

                    <button 
                        onClick={toggleTimer}
                        className={`
                            w-24 h-24 rounded-[2rem] flex items-center justify-center border-4 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95
                            ${isActive 
                                ? 'bg-white text-ink border-white' 
                                : 'bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white'}
                        `}
                    >
                        <span className="material-icons-round text-5xl">{isActive ? 'pause' : 'play_arrow'}</span>
                    </button>
                    
                    <button 
                         onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
                        className={`
                            w-14 h-14 rounded-full flex items-center justify-center border-2 border-white/20 bg-black/20 backdrop-blur text-white/70 hover:text-white hover:bg-white/10 hover:border-white transition-all hover:scale-110 active:scale-95 shadow-lg
                            ${isPlaying ? 'animate-pulse border-primary/50 text-primary' : ''}
                        `}
                        title="Music Controls"
                    >
                        <span className="material-icons-round text-2xl">music_note</span>
                    </button>
                </div>
            </div>

            {/* PLAYER CONTAINER with Slide-Up Entrance */}
            <div className={`
                absolute bottom-8 left-1/2 -translate-x-1/2 z-50 
                transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1)
                max-w-md animate-[float_1s_ease-out_forwards] translate-y-[100%] opacity-0
                ${isPlayerExpanded ? 'w-[90%]' : 'w-[320px]'}
            `}
            style={{ animationName: 'slideUpFade', animationFillMode: 'forwards', animationDelay: '0.1s' }}
            >
                <style>{`
                    @keyframes slideUpFade {
                        from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                        to { transform: translateX(-50%) translateY(0); opacity: 1; }
                    }
                `}</style>
                <div className={`
                    relative bg-black/40 backdrop-blur-xl border-2 border-white/20 shadow-neo-lg overflow-hidden 
                    transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1) will-change-transform
                    ${isPlayerExpanded ? 'rounded-[32px]' : 'rounded-[36px] cursor-pointer hover:bg-black/60'}
                `}
                style={{
                    height: isPlayerExpanded ? '500px' : '72px'
                }}
                onClick={() => !isPlayerExpanded && setIsPlayerExpanded(true)}
                >
                    {/* Collapsed View */}
                    <div className={`
                        absolute inset-0 flex items-center px-4 gap-4 transition-all duration-500
                        ${isPlayerExpanded ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0 delay-200'}
                    `}>
                        <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-inner shrink-0 transition-transform duration-300 group-hover:scale-105" 
                            style={{ backgroundColor: currentTrack.color1 }}
                        >
                            {currentTrack.cover}
                        </div>
                        
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold leading-none truncate text-white">{currentTrack.title}</span>
                            <span className="text-[10px] font-bold opacity-60 leading-none mt-1 truncate text-white/80">{currentTrack.artist}</span>
                        </div>

                        <div className="flex items-end gap-1 h-4 shrink-0 px-2">
                            <div className={`w-1 bg-white rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-1'}`}></div>
                            <div className={`w-1 bg-white rounded-full ${isPlaying ? 'animate-[bounce_1.2s_infinite]' : 'h-2'}`}></div>
                            <div className={`w-1 bg-white rounded-full ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : 'h-1.5'}`}></div>
                        </div>
                    </div>

                    {/* Expanded View */}
                    <div className={`
                        absolute inset-0 p-6 flex flex-col transition-all duration-500
                        ${isPlayerExpanded ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 -translate-y-4 pointer-events-none'}
                    `}>
                        {/* Header (Fixed Top) */}
                        <div className="flex justify-between items-center shrink-0 mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-1 text-white">
                                <span className="material-icons-round text-sm">surround_sound</span> {t('focus.spatial_audio')}
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsPlayerExpanded(false); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
                            >
                                <span className="material-icons-round">expand_more</span>
                            </button>
                        </div>

                        {/* Main Content (Vertically Centered Space) */}
                        <div className="flex-1 flex flex-col justify-center gap-6">
                            {/* Artwork & Info */}
                            <div className="flex items-center gap-5 shrink-0">
                                <div 
                                    className={`
                                        w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-2xl border-2 border-white/10
                                        ${isPlaying ? 'animate-float' : ''}
                                    `}
                                    style={{ background: `linear-gradient(135deg, ${currentTrack.color1}, ${currentTrack.color2})` }}
                                >
                                    {currentTrack.cover}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold font-display truncate text-white">{currentTrack.title}</h3>
                                    <p className="text-sm font-bold opacity-60 truncate text-white">{currentTrack.artist}</p>
                                    
                                    <div className="mt-4 flex items-center gap-2 group text-white">
                                        <span className="material-icons-round text-xs opacity-50">volume_down</span>
                                        <input 
                                            type="range" 
                                            min="0" max="1" step="0.1" 
                                            value={volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-150"
                                        />
                                        <span className="material-icons-round text-xs opacity-50">volume_up</span>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between px-2 shrink-0">
                                <button onClick={() => handleTrackChange('prev')} className="text-white/60 hover:text-white transition-colors">
                                    <span className="material-icons-round text-3xl">skip_previous</span>
                                </button>
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-16 h-16 rounded-full bg-white text-ink flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <span className="material-icons-round text-4xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                                </button>
                                <button onClick={() => handleTrackChange('next')} className="text-white/60 hover:text-white transition-colors">
                                    <span className="material-icons-round text-3xl">skip_next</span>
                                </button>
                            </div>
                        </div>

                        {/* Playlist Scroller (Fixed Bottom) */}
                        <div className="border-t border-white/10 pt-4 mt-4 shrink-0">
                            <p className="text-[10px] font-bold uppercase opacity-40 mb-2 text-white">{t('focus.up_next')}</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {PLAYLIST.map((track, i) => (
                                    <button 
                                        key={track.id}
                                        onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }}
                                        className={`
                                            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg border-2 transition-all
                                            ${currentTrackIndex === i ? 'border-white bg-white/20 scale-110' : 'border-transparent bg-white/5 hover:bg-white/10 text-white'}
                                        `}
                                        title={track.title}
                                    >
                                        {track.cover}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`absolute right-10 bottom-32 md:bottom-10 opacity-30 transition-all duration-1000 ${isActive ? 'scale-100' : 'scale-75 opacity-10'}`}>
                 <Mascot state={isActive ? 'working' : 'idle'} className="w-32 h-32 grayscale invert mix-blend-overlay" />
            </div>

        </div>
    );
};