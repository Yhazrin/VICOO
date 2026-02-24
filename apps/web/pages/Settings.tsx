import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { useTheme, MascotSkin } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';
import { Mascot } from '../components/Mascot';
import { VicooIcon } from '../components/VicooIcon';
import { cozeService, type CozeConfig } from '../utils/coze';

type Tab = 'general' | 'integration' | 'ai' | 'music' | 'coze' | 'skills';

interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { theme, toggleTheme, mascotSkin, setMascotSkin } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { playlist, refreshPlaylist, addToPlaylist, removeFromPlaylist } = useApi();
  
  // Coze state
  const [cozeToken, setCozeToken] = useState('');
  const [cozeBotId, setCozeBotId] = useState('');
  const [cozeBaseUrl, setCozeBaseUrl] = useState('http://localhost:8889');
  const [cozeConfigured, setCozeConfigured] = useState(false);
  const [cozeMessages, setCozeMessages] = useState<CozeMessage[]>([]);
  const [cozeInput, setCozeInput] = useState('');
  const [cozeLoading, setCozeLoading] = useState(false);
  const [cozeError, setCozeError] = useState<string | null>(null);
  
  // Load Coze config on mount
  useEffect(() => {
    const config = cozeService.getConfig();
    if (config) {
      setCozeToken(config.token);
      setCozeBotId(config.botId);
      setCozeBaseUrl(config.baseUrl || 'http://localhost:8889');
      setCozeConfigured(true);
    }
  }, []);
  
  // Save Coze config
  const saveCozeConfig = () => {
    if (!cozeToken || !cozeBotId) {
      setCozeError('请填写 Token 和 Bot ID');
      return;
    }
    cozeService.configure({
      token: cozeToken,
      botId: cozeBotId,
      baseUrl: cozeBaseUrl
    });
    setCozeConfigured(true);
    setCozeError(null);
  };
  
  // Send message to Coze
  const sendCozeMessage = async () => {
    if (!cozeInput.trim() || !cozeConfigured) return;
    
    const userMsg: CozeMessage = {
      role: 'user',
      content: cozeInput,
      timestamp: Date.now()
    };
    
    setCozeMessages(prev => [...prev, userMsg]);
    setCozeInput('');
    setCozeLoading(true);
    setCozeError(null);
    
    try {
      const result = await cozeService.chat(cozeInput);
      
      if (result.success && result.data) {
        const assistantMsg: CozeMessage = {
          role: 'assistant',
          content: result.data.messages?.[0]?.content || '',
          timestamp: Date.now()
        };
        setCozeMessages(prev => [...prev, assistantMsg]);
      } else {
        setCozeError(result.error || '调用失败');
      }
    } catch (err: any) {
      setCozeError(err.message || '调用失败');
    } finally {
      setCozeLoading(false);
    }
  };
  
  // Clear Coze config
  const clearCozeConfig = () => {
    cozeService.clearConfig();
    setCozeToken('');
    setCozeBotId('');
    setCozeConfigured(false);
    setCozeMessages([]);
    setCozeError(null);
  };

  // Claude Code connection state
  const [claudeEndpoint, setClaudeEndpoint] = useState('http://localhost:3000');
  const [claudeWorkingDir, setClaudeWorkingDir] = useState('D:\\PROJECT\\vicoo');
  const [claudeStatus, setClaudeStatus] = useState<'unknown' | 'connecting' | 'connected' | 'error'>('unknown');
  const [claudeStatusText, setClaudeStatusText] = useState('Unknown');
  
  // Test Claude Code connection via Vicoo API
  const testClaudeConnection = async () => {
    setClaudeStatus('connecting');
    setClaudeStatusText('Testing...');
    
    try {
      // First check Vicoo API
      const apiResponse = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!apiResponse.ok) {
        setClaudeStatus('error');
        setClaudeStatusText('API not running');
        return;
      }
      
      // Then check Claude Code through Vicoo API
      const response = await fetch('http://localhost:8000/api/claude/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClaudeStatus('connected');
        setClaudeStatusText(`Claude Code: ${data.version || 'OK'}`);
      } else {
        const data = await response.json();
        setClaudeStatus('error');
        setClaudeStatusText(data.message || 'Claude Code not found');
      }
    } catch (error: any) {
      setClaudeStatus('error');
      setClaudeStatusText(error.message || 'Connection failed');
    }
  };
  
  // Music form state
  const [musicForm, setMusicForm] = useState({
    title: '',
    artist: '',
    coverEmoji: '🎵',
    color1: '#FFD166',
    color2: '#EF476F'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAddingMusic, setIsAddingMusic] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">{t('settings.subtitle')}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2">
          {[
            { id: 'general', label: t('settings.tab.general'), icon: 'tune' },
            { id: 'music', label: 'Music', icon: 'music_note' },
            { id: 'integration', label: t('settings.tab.integration'), icon: 'terminal' },
            { id: 'ai', label: t('settings.tab.ai'), icon: 'psychology' },
            { id: 'coze', label: 'Coze AI', icon: 'smart_toy' },
            { id: 'skills', label: 'Skills', icon: 'construction' },
          ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as Tab)}
               className={`
                 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-bold whitespace-nowrap
                 ${activeTab === tab.id 
                   ? 'bg-ink text-white border-ink shadow-neo-sm dark:bg-white dark:text-ink' 
                   : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-200'}
               `}
             >
               <VicooIcon name={tab.icon} size={20} />
               {tab.label}
             </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
             <div className="space-y-6 animate-float" style={{ animationDuration: '0.5s', animationName: 'fadein' }}>
               <NeoCard className="p-6">
                 <h2 className="text-xl font-bold mb-4">{t('settings.profile')}</h2>
                 <div className="flex items-center gap-4">
                    <img src="https://picsum.photos/100/100" className="w-20 h-20 rounded-full border-3 border-ink dark:border-white bg-secondary" />
                    <div>
                       <NeoButton size="sm" variant="secondary" className="mb-2">{t('settings.change_avatar')}</NeoButton>
                       <p className="text-xs text-gray-500 font-bold">{t('settings.avatar_hint')}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                       <label className="block text-sm font-bold mb-1">{t('settings.display_name')}</label>
                       <input type="text" defaultValue="Alex Chen" className="w-full bg-light dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold text-ink dark:text-white" />
                    </div>
                    <div>
                       <label className="block text-sm font-bold mb-1">{t('settings.email')}</label>
                       <input type="email" defaultValue="alex@example.com" className="w-full bg-light dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold text-ink dark:text-white" />
                    </div>
                 </div>
               </NeoCard>
               <NeoCard className="p-6">
                 <h2 className="text-xl font-bold mb-6">{t('settings.appearance')}</h2>
                 
                 {/* Dark Mode Toggle */}
                 <div className="flex items-center justify-between p-3 border-2 border-ink dark:border-gray-600 rounded-xl bg-light dark:bg-gray-800 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <VicooIcon name="dark_mode" size={18} className="text-gray-500 dark:text-gray-300" />
                        </div>
                        <span className="font-bold">{t('settings.dark_mode')}</span>
                    </div>
                    <div 
                        onClick={toggleTheme}
                        className={`w-12 h-6 rounded-full border-2 border-ink dark:border-gray-400 relative cursor-pointer transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                       <div className={`w-4 h-4 bg-white border-2 border-ink rounded-full absolute top-0.5 transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                    </div>
                 </div>

                 {/* Language Selector */}
                 <div className="mb-6">
                     <label className="block text-sm font-bold mb-2">{t('settings.language')}</label>
                     <div className="flex gap-2">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${language === 'en' ? 'bg-ink text-white border-ink dark:bg-white dark:text-ink' : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-600'}`}
                        >
                            {t('settings.lang.en')}
                        </button>
                        <button 
                            onClick={() => setLanguage('zh')}
                            className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${language === 'zh' ? 'bg-ink text-white border-ink dark:bg-white dark:text-ink' : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-600'}`}
                        >
                            {t('settings.lang.zh')}
                        </button>
                     </div>
                 </div>

                 {/* Mascot Skin Selector */}
                 <div>
                     <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">{t('settings.mascot')}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {(['bot', 'cat', 'orb'] as MascotSkin[]).map(skin => (
                             <div 
                                key={skin}
                                onClick={() => setMascotSkin(skin)}
                                className={`
                                    relative border-3 rounded-2xl p-4 cursor-pointer transition-all hover:scale-105 overflow-hidden
                                    ${mascotSkin === skin 
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' 
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'}
                                `}
                             >
                                 <div className="h-24 flex items-center justify-center mb-2">
                                     <Mascot skin={skin} state={mascotSkin === skin ? 'happy' : 'idle'} className="w-20 h-20" />
                                 </div>
                                 <div className="text-center">
                                     <p className="font-bold uppercase tracking-wider text-sm">{skin}</p>
                                     {mascotSkin === skin && (
                                         <span className="absolute top-2 right-2 w-6 h-6 bg-primary border-2 border-ink rounded-full flex items-center justify-center">
                                             <VicooIcon name="check" size={14} />
                                         </span>
                                     )}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
               </NeoCard>
             </div>
          )}

          {activeTab === 'integration' && (
             <div className="space-y-6">
                {/* Claude Code Card */}
                <NeoCard className="p-8 bg-white dark:bg-gray-900 relative overflow-hidden">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="bg-gradient-to-br from-orange-400 to-orange-600 border-3 border-ink rounded-xl p-3 shadow-neo-sm">
                         <VicooIcon name="smart_toy" size={30} className="text-white" />
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold">Claude Code</h2>
                         <p className="text-gray-500 font-bold text-sm">Local AI Agent • Vibe Coding</p>
                      </div>
                      <div className="ml-auto">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full border-2 border-ink text-xs font-bold shadow-neo-sm ${
                           claudeStatus === 'connected' ? 'bg-green-100 text-green-800' :
                           claudeStatus === 'error' ? 'bg-red-100 text-red-800' :
                           claudeStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                            <span className={`w-2 h-2 rounded-full border border-ink mr-2 ${
                              claudeStatus === 'connected' ? 'bg-green-500' :
                              claudeStatus === 'error' ? 'bg-red-500' :
                              claudeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                              'bg-gray-500'
                            }`}></span>
                            {claudeStatusText}
                         </span>
                      </div>
                   </div>

                   <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 mb-6">
                      <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-gray-500">Configuration</h3>
                      <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold mb-1">API Endpoint</label>
                            <input
                               type="text"
                               value={claudeEndpoint}
                               onChange={(e) => setClaudeEndpoint(e.target.value)}
                               className="w-full bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-mono text-sm text-ink dark:text-white"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold mb-1">Working Directory</label>
                            <input
                               type="text"
                               value={claudeWorkingDir}
                               onChange={(e) => setClaudeWorkingDir(e.target.value)}
                               className="w-full bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-mono text-sm text-ink dark:text-white"
                            />
                         </div>
                         <div className="flex items-center gap-2">
                            <input
                               type="checkbox"
                               id="autoConnect"
                               defaultChecked
                               className="w-4 h-4 rounded border-2 border-ink"
                            />
                            <label htmlFor="autoConnect" className="text-sm font-bold">Auto-connect on startup</label>
                         </div>
                      </div>
                   </div>

                   <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                         <NeoButton 
                           variant="secondary" 
                           size="sm"
                           onClick={testClaudeConnection}
                           disabled={claudeStatus === 'connecting'}
                         >
                            <VicooIcon name="refresh" size={14} className="mr-1" />
                            {claudeStatus === 'connecting' ? 'Testing...' : 'Test Connection'}
                         </NeoButton>
                      </div>
                      <NeoButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          // Save config to localStorage
                          localStorage.setItem('claude_code_config', JSON.stringify({
                            endpoint: claudeEndpoint,
                            workingDir: claudeWorkingDir,
                            autoConnect: true
                          }));
                          // Dispatch custom event to navigate to Vibe Coding
                          window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: 'vibe_coding' }));
                        }}
                      >
                         <VicooIcon name="open_in_new" size={14} className="mr-1" />
                         Open Vibe Station
                      </NeoButton>
                   </div>
                </NeoCard>

                {/* CLI Integration Card */}
                <NeoCard className="p-8">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="bg-primary border-3 border-ink rounded-xl p-3 shadow-neo-sm">
                         <VicooIcon name="terminal" size={30} className="text-ink" />
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold">CLI Integration</h2>
                         <p className="text-gray-500 font-bold text-sm">v1.2.0 - Installed</p>
                      </div>
                      <div className="ml-auto">
                         <span className="inline-flex items-center px-3 py-1 rounded-full border-2 border-ink bg-green-100 text-xs font-bold shadow-neo-sm text-green-800">
                            <span className="w-2 h-2 bg-green-500 rounded-full border border-ink mr-2"></span>
                            Connected
                         </span>
                      </div>
                   </div>

                   <div className="bg-gray-900 text-gray-200 p-4 rounded-xl border-3 border-ink dark:border-gray-500 font-mono text-sm mb-6">
                      <p className="text-green-400">$ vicoo sync status</p>
                      <p className="my-2">Checking local watcher...</p>
                      <p>All systems operational. Listening on port 3000.</p>
                   </div>

                   <div className="flex justify-end gap-2">
                      <NeoButton variant="secondary" size="sm">Regenerate Token</NeoButton>
                      <NeoButton variant="primary" size="sm">Documentation</NeoButton>
                   </div>
                </NeoCard>

                {/* VS Code Extension - Coming Soon */}
                <NeoCard className="p-6 opacity-60 grayscale">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="bg-white border-3 border-ink rounded-xl p-3 shadow-neo-sm">
                         <VicooIcon name="extension" size={30} className="text-ink" />
                      </div>
                      <div>
                         <h2 className="text-xl font-bold">VS Code Extension</h2>
                         <p className="text-gray-500 font-bold text-sm">Coming Soon</p>
                      </div>
                   </div>
                </NeoCard>
             </div>
          )}

          
          {activeTab === 'music' && (
             <div className="space-y-6 animate-pop">
                <NeoCard className="p-6">
                   <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                         <VicooIcon name="music_note" size={20} className="text-primary" />
                         Focus Mode Playlist
                      </h2>
                      <NeoButton size="sm" onClick={() => setIsAddingMusic(!isAddingMusic)}>
                         <VicooIcon name="add" size={14} className="mr-1" />
                         Add Music
                      </NeoButton>
                   </div>
                   
                   {/* Add Music Form */}
                   {isAddingMusic && (
                      <div className="bg-light dark:bg-gray-800 p-4 rounded-xl border-2 border-ink dark:border-gray-600 mb-6">
                         <h3 className="font-bold mb-4">Add New Track</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                               <label className="block text-xs font-bold mb-1">Title *</label>
                               <input 
                                  type="text" 
                                  value={musicForm.title}
                                  onChange={(e) => setMusicForm({...musicForm, title: e.target.value})}
                                  placeholder="Track name"
                                  className="w-full bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold text-ink dark:text-white"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold mb-1">Artist</label>
                               <input 
                                  type="text" 
                                  value={musicForm.artist}
                                  onChange={(e) => setMusicForm({...musicForm, artist: e.target.value})}
                                  placeholder="Artist name"
                                  className="w-full bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold text-ink dark:text-white"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold mb-1">Cover Emoji</label>
                               <input 
                                  type="text" 
                                  value={musicForm.coverEmoji}
                                  onChange={(e) => setMusicForm({...musicForm, coverEmoji: e.target.value})}
                                  placeholder="🎵"
                                  className="w-full bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold text-ink dark:text-white"
                               />
                            </div>
                            <div className="md:col-span-2">
                               <label className="block text-xs font-bold mb-1">Audio File *</label>
                               <div className="relative">
                                  <input 
                                     type="file" 
                                     accept="audio/*"
                                     onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                     className="w-full bg-white dark:bg-gray-700 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold text-ink dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-ink file:font-bold file:cursor-pointer"
                                  />
                                  {selectedFile && (
                                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold">
                                        ✓ {selectedFile.name}
                                     </span>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                               <label className="block text-xs font-bold mb-1">Color 1</label>
                               <input 
                                  type="color" 
                                  value={musicForm.color1}
                                  onChange={(e) => setMusicForm({...musicForm, color1: e.target.value})}
                                  className="w-full h-10 rounded-lg border-2 border-ink cursor-pointer"
                               />
                            </div>
                            <div className="flex-1">
                               <label className="block text-xs font-bold mb-1">Color 2</label>
                               <input 
                                  type="color" 
                                  value={musicForm.color2}
                                  onChange={(e) => setMusicForm({...musicForm, color2: e.target.value})}
                                  className="w-full h-10 rounded-lg border-2 border-ink cursor-pointer"
                               />
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <NeoButton 
                               size="sm" 
                               onClick={async () => {
                                  if (!musicForm.title || (!selectedFile && !musicForm.audioUrl)) return;
                                  setIsUploading(true);
                                  try {
                                     if (selectedFile) {
                                        // Upload file using FormData
                                        const formData = new FormData();
                                        formData.append('audio', selectedFile);
                                        formData.append('title', musicForm.title);
                                        formData.append('artist', musicForm.artist);
                                        formData.append('coverEmoji', musicForm.coverEmoji);
                                        formData.append('color1', musicForm.color1);
                                        formData.append('color2', musicForm.color2);
                                        
                                        // Get token from localStorage
                                        const token = localStorage.getItem('vicoo_token') || '';
                                        
                                        const response = await fetch('http://localhost:8000/api/music', {
                                           method: 'POST',
                                           headers: {
                                              'Authorization': `Bearer ${token}`
                                           },
                                           body: formData
                                        });
                                        
                                        if (!response.ok) {
                                           throw new Error('Upload failed');
                                        }
                                        
                                        const result = await response.json();
                                        // Refresh playlist
                                        const res = await fetch('http://localhost:8000/api/music', {
                                           headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        const data = await res.json();
                                        // Update would be handled via context
                                     } else {
                                        // URL-based upload (legacy)
                                        await addToPlaylist({
                                           title: musicForm.title,
                                           artist: musicForm.artist,
                                           coverEmoji: musicForm.coverEmoji,
                                           color1: musicForm.color1,
                                           color2: musicForm.color2,
                                           audioUrl: musicForm.audioUrl
                                        });
                                     }
                                     
                                     setMusicForm({ title: '', artist: '', coverEmoji: '🎵', color1: '#FFD166', color2: '#EF476F' });
                                     setSelectedFile(null);
                                     setIsAddingMusic(false);
                                     // Refresh
                                     window.location.reload();
                                  } catch (e) {
                                     console.error('Failed to add music:', e);
                                  } finally {
                                     setIsUploading(false);
                                  }
                               }}
                            >
                               {isUploading ? 'Uploading...' : 'Save Track'}
                            </NeoButton>
                            <NeoButton size="sm" variant="secondary" onClick={() => setIsAddingMusic(false)}>
                               Cancel
                            </NeoButton>
                         </div>
                      </div>
                   )}
                   
                   {/* Playlist */}
                   {playlist.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                         <VicooIcon name="library_music" size={40} className="text-gray-300 dark:text-gray-600 mb-2" />
                         <p className="text-gray-500 font-bold">No music added yet</p>
                         <p className="text-sm text-gray-400">Add tracks to play during Focus Mode</p>
                      </div>
                   ) : (
                      <div className="space-y-3">
                         {playlist.map((track) => (
                            <div key={track.id} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-xl hover:shadow-neo-sm transition-shadow">
                               <div 
                                  className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                                  style={{ background: `linear-gradient(135deg, ${track.color1}, ${track.color2})` }}
                               >
                                  {track.coverEmoji}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate">{track.title}</p>
                                  <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                               </div>
                               <NeoButton 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => removeFromPlaylist(track.id)}
                               >
                                  <VicooIcon name="delete" size={14} />
                               </NeoButton>
                            </div>
                         ))}
                      </div>
                   )}
                </NeoCard>
                
                <NeoCard className="p-6">
                   <h3 className="font-bold mb-2">How to add music</h3>
                   <p className="text-sm text-gray-500">
                      Add audio URLs from music hosting services (SoundCloud, etc.) or use direct MP3 links.
                      The music will play during your Focus Mode sessions.
                   </p>
                </NeoCard>
             </div>
          )}

          {activeTab === 'ai' && (
             <div className="space-y-6">
                <NeoCard className="p-6">
                   <h2 className="text-xl font-bold mb-4">{t('settings.model_config')}</h2>
                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-bold mb-2">{t('settings.default_model')}</label>
                         <select className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-3 font-bold shadow-neo-sm text-ink dark:text-white">
                            <option>Gemini 1.5 Pro</option>
                            <option>Gemini 1.5 Flash</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-bold mb-2">{t('settings.summary_style')}</label>
                         <div className="grid grid-cols-3 gap-3">
                            {[t('settings.style.concise'), t('settings.style.creative'), t('settings.style.technical')].map(s => (
                               <button key={s} className={`border-2 border-ink dark:border-gray-500 rounded-lg py-2 font-bold ${s.includes('Concise') || s === '简洁' ? 'bg-primary shadow-neo-sm text-ink' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-500'}`}>{s}</button>
                            ))}
                         </div>
                      </div>
                   </div>
                </NeoCard>
                <NeoCard color="info" className="p-6">
                   <h2 className="text-xl font-bold mb-2">{t('settings.usage')}</h2>
                   <div className="w-full bg-white/30 h-4 rounded-full border-2 border-ink overflow-hidden mb-2">
                      <div className="w-[45%] h-full bg-white"></div>
                   </div>
                   <p className="text-xs font-bold text-white">45,200 / 100,000 {t('settings.tokens_used')}</p>
                </NeoCard>
             </div>
          )}

          {activeTab === 'skills' && (
            <SkillsTab />
          )}

          {activeTab === 'coze' && (
             <div className="space-y-6">
                {/* Coze 配置 */}
                <NeoCard className="p-6">
                   <h2 className="text-xl font-bold mb-4">Coze 智能体配置</h2>
                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-bold mb-2">API Token</label>
                         <input
                            type="password"
                            value={cozeToken}
                            onChange={(e) => setCozeToken(e.target.value)}
                            placeholder="pat_xxxxx"
                            className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-3 font-bold shadow-neo-sm text-ink dark:text-white"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold mb-2">Bot ID</label>
                         <input
                            type="text"
                            value={cozeBotId}
                            onChange={(e) => setCozeBotId(e.target.value)}
                            placeholder="7609016206011400192"
                            className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-3 font-bold shadow-neo-sm text-ink dark:text-white"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold mb-2">Base URL</label>
                         <input
                            type="text"
                            value={cozeBaseUrl}
                            onChange={(e) => setCozeBaseUrl(e.target.value)}
                            placeholder="http://localhost:8889"
                            className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-3 font-bold shadow-neo-sm text-ink dark:text-white"
                         />
                      </div>
                      {cozeError && (
                         <p className="text-red-500 text-sm font-bold">{cozeError}</p>
                      )}
                      <div className="flex gap-3">
                         <NeoButton onClick={saveCozeConfig}>
                            {cozeConfigured ? '更新配置' : '保存配置'}
                         </NeoButton>
                         {cozeConfigured && (
                            <NeoButton variant="secondary" onClick={clearCozeConfig}>
                               清除配置
                            </NeoButton>
                         )}
                      </div>
                   </div>
                </NeoCard>

                {/* Coze 聊天 */}
                {cozeConfigured && (
                   <NeoCard className="p-6">
                      <h2 className="text-xl font-bold mb-4">与 Coze 智能体对话</h2>
                      <div className="border-2 border-ink dark:border-gray-500 rounded-lg h-80 flex flex-col">
                         {/* Messages */}
                         <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cozeMessages.length === 0 ? (
                               <p className="text-gray-400 text-center">开始与智能体对话吧</p>
                            ) : (
                               cozeMessages.map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-[80%] p-3 rounded-lg ${
                                        msg.role === 'user' 
                                           ? 'bg-primary text-ink' 
                                           : 'bg-gray-100 dark:bg-gray-800 text-ink dark:text-white'
                                     }`}>
                                        {msg.content}
                                     </div>
                                  </div>
                               ))
                            )}
                            {cozeLoading && (
                               <div className="flex justify-start">
                                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                     <span className="animate-pulse">正在思考...</span>
                                  </div>
                               </div>
                            )}
                         </div>
                         
                         {/* Input */}
                         <div className="border-t-2 border-ink dark:border-gray-500 p-3 flex gap-2">
                            <input
                               type="text"
                               value={cozeInput}
                               onChange={(e) => setCozeInput(e.target.value)}
                               onKeyPress={(e) => e.key === 'Enter' && sendCozeMessage()}
                               placeholder="输入消息..."
                               disabled={cozeLoading}
                               className="flex-1 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold text-ink dark:text-white"
                            />
                            <NeoButton onClick={sendCozeMessage} disabled={cozeLoading || !cozeInput.trim()}>
                               发送
                            </NeoButton>
                         </div>
                      </div>
                   </NeoCard>
                )}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Skills/MCP Tab Component
const SkillsTab: React.FC = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<any>(null);

  // 加载 MCP 服务器列表
  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await fetch('/api/agent/mcp');
      const result = await response.json();
      if (result.success) {
        setServers(result.data);
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换服务器启用状态
  const toggleServer = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/agent/mcp/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      loadServers();
    } catch (error) {
      console.error('Failed to toggle server:', error);
    }
  };

  // 删除服务器
  const deleteServer = async (id: string) => {
    if (!confirm('确定要删除这个服务器吗？')) return;
    try {
      await fetch(`/api/agent/mcp/${id}`, { method: 'DELETE' });
      loadServers();
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'builtin': return '内置';
      case 'mcp': return 'MCP';
      case 'custom': return '自定义';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'builtin': return 'bg-blue-100 text-blue-800';
      case 'mcp': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">技能 & MCP</h2>
          <p className="text-gray-500">管理 AI 助手可以使用的技能和 MCP 服务器</p>
        </div>
        <NeoButton onClick={() => setShowAddModal(true)}>
          <VicooIcon name="add" size={20} className="mr-2" />
          添加服务器
        </NeoButton>
      </div>

      {/* Server List */}
      {servers.length === 0 ? (
        <NeoCard className="p-8 text-center">
          <VicooIcon name="construction" size={60} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-bold mb-2">暂无技能服务器</h3>
          <p className="text-gray-500 mb-4">添加 MCP 服务器或自定义技能来扩展 AI 能力</p>
          <NeoButton onClick={() => setShowAddModal(true)}>添加第一个服务器</NeoButton>
        </NeoCard>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <NeoCard key={server.id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
                  {server.icon || '🔌'}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{server.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTypeColor(server.type)}`}>
                      {getTypeLabel(server.type)}
                    </span>
                    {!server.enabled && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                        已禁用
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{server.description || '暂无描述'}</p>
                  {server.command && (
                    <p className="text-gray-400 text-xs font-mono mt-1">{server.command}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleServer(server.id, !server.enabled)}
                    disabled={server.type === 'builtin'}
                    className={`w-12 h-6 rounded-full border-2 border-ink relative transition-colors ${
                      server.enabled ? 'bg-green-500' : 'bg-gray-300'
                    } ${server.type === 'builtin' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`w-4 h-4 bg-white border-2 border-ink rounded-full absolute top-0.5 transition-all ${
                      server.enabled ? 'left-6' : 'left-1'
                    }`}></div>
                  </button>

                  {/* Delete Button */}
                  {server.type !== 'builtin' && (
                    <button
                      onClick={() => deleteServer(server.id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <VicooIcon name="delete" size={20} />
                    </button>
                  )}
                </div>
              </div>
            </NeoCard>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddServerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadServers();
          }}
        />
      )}
    </div>
  );
};

// Add Server Modal Component
const AddServerModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'mcp' | 'custom'>('mcp');
  const [description, setDescription] = useState('');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    try {
      const response = await fetch('/api/agent/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          description,
          command,
          args: args ? args.split(' ').filter(Boolean) : [],
          url: url || undefined
        })
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || '添加失败');
      }
    } catch (error) {
      console.error('Failed to add server:', error);
      alert('添加失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-3 border-ink w-full max-w-md mx-4 shadow-neo-lg">
        <div className="p-6 border-b-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">添加 MCP 服务器</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-2">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My MCP Server"
              required
              className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-bold mb-2">类型</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'mcp'}
                  onChange={() => setType('mcp')}
                  className="w-4 h-4"
                />
                <span className="font-bold">MCP 服务器</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'custom'}
                  onChange={() => setType('custom')}
                  className="w-4 h-4"
                />
                <span className="font-bold">自定义技能</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold mb-2">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="这个服务器提供什么功能？"
              className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-bold"
            />
          </div>

          {/* Command */}
          <div>
            <label className="block text-sm font-bold mb-2">命令</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npx 或 uvx"
              className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-mono text-sm"
            />
          </div>

          {/* Args */}
          <div>
            <label className="block text-sm font-bold mb-2">参数 (用空格分隔)</label>
            <input
              type="text"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="-y @modelcontextprotocol/server-filesystem /path"
              className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-mono text-sm"
            />
          </div>

          {/* URL (optional) */}
          <div>
            <label className="block text-sm font-bold mb-2">服务器地址 (可选)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="w-full bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-lg px-3 py-2 font-mono text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <NeoButton type="button" variant="secondary" onClick={onClose}>
              取消
            </NeoButton>
            <NeoButton type="submit" disabled={saving || !name}>
              {saving ? '保存中...' : '添加'}
            </NeoButton>
          </div>
        </form>
      </div>
    </div>
  );
};