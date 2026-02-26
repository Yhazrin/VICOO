import React, { useState, useRef } from 'react';
import { View, NavItem } from '../types';
import { AnimatedLogo } from './AnimatedLogo';
import { VicooIcon } from './VicooIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  onEnterFocusMode?: (rect: DOMRect) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onEnterFocusMode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const focusButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useLanguage();

  const handleFocusClick = () => {
      if (focusButtonRef.current && onEnterFocusMode) {
          const rect = focusButtonRef.current.getBoundingClientRect();
          onEnterFocusMode(rect);
      } else {
          onChangeView(View.FOCUS);
      }
  };

  // Move nav items definition inside component to access `t`
  const navItems: { groupKey: string; items: NavItem[] }[] = [
    {
      groupKey: 'nav.group_create',
      items: [
        { id: View.FOCUS, labelKey: 'nav.focus', icon: 'focus' },
        { id: View.ASK_AI, labelKey: 'nav.ai_assistant', icon: 'ai_assistant' },
        { id: View.EDITOR, labelKey: 'nav.write', icon: 'write' },
        { id: View.VIBE_CODING, labelKey: 'nav.vibe_coding', icon: 'vibe_coding' },
      ]
    },
    {
      groupKey: 'nav.group_organize',
      items: [
        { id: View.INBOX, labelKey: 'nav.inbox', icon: 'inbox' },
        { id: View.LIBRARY, labelKey: 'nav.library', icon: 'library' },
        { id: View.PROJECTS, labelKey: 'nav.projects', icon: 'project' },
        { id: View.GALAXY, labelKey: 'nav.galaxy', icon: 'graph' },
        { id: View.TAXONOMY, labelKey: 'nav.taxonomy', icon: 'category' },
      ]
    },
    {
      groupKey: 'nav.group_publish',
      items: [
        { id: View.PUBLISH, labelKey: 'nav.publish_center', icon: 'publish_center' },
      ]
    },
    {
      groupKey: 'nav.group_system',
      items: [
        { id: View.TIMELINE, labelKey: 'nav.timeline', icon: 'timeline' },
        { id: View.ANALYTICS, labelKey: 'nav.analytics', icon: 'analytics' },
        { id: View.SETTINGS, labelKey: 'nav.settings', icon: 'settings' },
      ]
    }
  ];

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
    {/* Mobile hamburger */}
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      className="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-xl shadow-neo-sm flex items-center justify-center"
    >
      <VicooIcon name={mobileOpen ? 'close' : 'menu'} size={20} className="text-ink dark:text-white" />
    </button>

    {/* Mobile overlay */}
    {mobileOpen && (
      <div className="lg:hidden fixed inset-0 bg-black/40 z-[55] backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
    )}

    <aside 
      className={`
        h-screen bg-white dark:bg-gray-900 border-r-3 border-ink dark:border-gray-700 flex flex-col sticky top-0 z-[56]
        transition-all duration-300 ease-in-out relative
        ${mobileOpen ? 'fixed inset-y-0 left-0 w-64' : 'hidden lg:flex w-20'} ${isExpanded ? 'lg:w-64' : 'lg:w-24'}
      `}
    >
      {/* Collapse Toggle Button (Desktop only) */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="hidden lg:flex absolute -right-4 top-10 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-500 rounded-full w-8 h-8 items-center justify-center shadow-neo-sm dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] z-50 hover:scale-110 transition-transform hover:bg-gray-50 dark:hover:bg-gray-700"
        title={isExpanded ? t('nav.collapse') : t('nav.expand')}
      >
        <VicooIcon name={isExpanded ? 'chevron_left' : 'chevron_right'} size={20} className="text-ink dark:text-white font-bold" />
      </button>

      {/* Header - vicoo BRANDING */}
      <div className={`p-6 flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} gap-3 overflow-hidden whitespace-nowrap`}>
        <div className="w-10 h-10 flex-shrink-0">
           <AnimatedLogo />
        </div>
        <div 
          className={`
            hidden lg:flex flex-col transition-all duration-300
            ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 hidden'}
          `}
        >
          <span className="font-display font-black text-3xl tracking-tight leading-none text-ink dark:text-white">vicoo</span>
          <span className="text-[10px] font-bold text-gray-400 leading-tight">visual coordinator</span>
        </div>
      </div>

      {/* Focus Mode Call to Action */}
      <div className={`px-2 lg:px-4 mb-6 transition-all duration-300 ${!isExpanded ? 'lg:items-center flex flex-col' : ''}`}>
         <button
            ref={focusButtonRef}
            onClick={handleFocusClick}
            className={`
               w-full bg-ink dark:bg-gray-100 text-white dark:text-ink border-2 border-transparent rounded-xl p-3 shadow-neo hover:shadow-neo-lg dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 transition-all flex items-center gap-3 group
               ${!isExpanded ? 'lg:w-12 lg:h-12 lg:p-0 lg:justify-center' : ''}
               ${currentView === View.FOCUS ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' : ''}
            `}
            title={!isExpanded ? t('nav.focus') : t('nav.focus_tooltip')}
         >
            <VicooIcon name="focus" className="group-hover:animate-spin" size={20} />
            {isExpanded && <span className="font-bold">{t('nav.focus')}</span>}
         </button>
      </div>

      {/* Nav with hidden scrollbar */}
      <nav 
        className="flex-1 px-2 lg:px-4 space-y-6 overflow-y-auto sidebar-nav pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .sidebar-nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {navItems.map((group, groupIdx) => (
          <div key={groupIdx}>
             {isExpanded && (
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-3">
                 {t(group.groupKey)}
               </h3>
             )}
             <div className="space-y-1">
               {group.items.map((item) => {
                  const isActive = currentView === item.id;
                  const label = item.labelKey ? t(item.labelKey) : item.label;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onChangeView(item.id); setMobileOpen(false); }}
                      className={`
                        w-full flex items-center gap-4 p-3 rounded-xl border-3 transition-all duration-200 group
                        ${isActive
                          ? 'bg-primary border-ink dark:border-white shadow-neo dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] translate-x-1'
                          : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'}
                        ${!isExpanded ? 'lg:w-12 lg:h-12 lg:p-0 lg:justify-center' : ''}
                      `}
                      title={!isExpanded ? label : ''}
                    >
                      <VicooIcon
                        name={item.icon}
                        className={`flex-shrink-0 transition-transform ${isActive ? 'text-ink' : 'text-gray-500 dark:text-gray-400'} ${!isActive && 'group-hover:scale-110'}`}
                        size={24}
                      />
                      <span
                        className={`
                          hidden lg:block font-bold whitespace-nowrap overflow-hidden transition-all duration-300
                          ${isActive ? 'text-ink' : 'text-gray-500 dark:text-gray-400'}
                          ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}
                        `}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
             </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t-3 border-ink/10 dark:border-white/10 mt-auto overflow-hidden">
        <div 
          onClick={() => { onChangeView(View.PROFILE); setMobileOpen(false); }}
          className={`
            flex items-center gap-3 p-2 rounded-xl border-2 border-transparent hover:border-ink dark:hover:border-white hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer relative group
            ${!isExpanded ? 'justify-center' : ''}
          `}
        >
          <div className="w-10 h-10 rounded-full border-2 border-ink dark:border-white bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
            <VicooIcon name="person" size={20} className="text-ink" />
          </div>
          <div 
             className={`
               hidden lg:block text-left whitespace-nowrap transition-all duration-300
               ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}
             `}
          >
            <p className="text-sm font-bold text-ink dark:text-white">个人中心</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t('nav.user_role')}</p>
          </div>

          {/* Mini Public Site Link (appears on hover) */}
          <button 
             onClick={(e) => { e.stopPropagation(); onChangeView(View.PUBLIC_GATEWAY); }}
             className={`
                absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 border-2 border-ink dark:border-white rounded-lg p-1.5 shadow-sm hover:bg-primary transition-all
                ${isExpanded ? 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0' : 'hidden'}
             `}
             title={t('nav.public')}
          >
              <VicooIcon name="public" size={14} className="dark:text-white" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};