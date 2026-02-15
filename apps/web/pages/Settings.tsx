import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { useTheme, MascotSkin } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Mascot } from '../components/Mascot';

type Tab = 'general' | 'integration' | 'ai';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { theme, toggleTheme, mascotSkin, setMascotSkin } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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
            { id: 'integration', label: t('settings.tab.integration'), icon: 'terminal' },
            { id: 'ai', label: t('settings.tab.ai'), icon: 'psychology' },
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
               <span className="material-icons-round">{tab.icon}</span>
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
                            <span className="material-icons-round text-gray-500 dark:text-gray-300">dark_mode</span>
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
                                             <span className="material-icons-round text-sm">check</span>
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
                <NeoCard className="p-8 bg-white dark:bg-gray-900 relative overflow-hidden">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="bg-primary border-3 border-ink rounded-xl p-3 shadow-neo-sm">
                         <span className="material-icons-round text-3xl text-ink">terminal</span>
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold">CLI Integration</h2>
                         <p className="text-gray-500 font-bold text-sm">v1.2.0 • Installed</p>
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

                <NeoCard className="p-6 opacity-60 grayscale">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="bg-white border-3 border-ink rounded-xl p-3 shadow-neo-sm">
                         <span className="material-icons-round text-3xl text-ink">extension</span>
                      </div>
                      <div>
                         <h2 className="text-xl font-bold">VS Code Extension</h2>
                         <p className="text-gray-500 font-bold text-sm">Coming Soon</p>
                      </div>
                   </div>
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
        </div>

      </div>
    </div>
  );
};