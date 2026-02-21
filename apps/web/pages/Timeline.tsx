import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { useApi } from '../contexts/ApiContext';
import type { TimelineEvent as ApiTimelineEvent } from '@vicoo/types';

// Enhanced Types for Complex Timeline
type EventType = 'Code' | 'Design' | 'Meeting' | 'Idea' | 'Milestone';
type EventStatus = 'done' | 'in-progress' | 'blocked' | 'planned';

interface SubTask {
  label: string;
  isCompleted: boolean;
}

interface TimelineEvent {
  id: string;
  date: string;
  fullDate: string; // e.g., "Oct 26, 2023"
  title: string;
  type: EventType;
  status: EventStatus;
  description?: string;
  progress?: number; // 0-100
  subtasks?: SubTask[];
  tags: string[];
  blockerReason?: string;
}

// Grouping Helper
interface TimelineGroup {
    month: string;
    year: string;
    events: TimelineEvent[];
}

export const Timeline: React.FC = () => {
  const [filterType, setFilterType] = useState<EventType | 'All'>('All');
  const { timelineEvents, refreshTimeline } = useApi();
  
  // Local state for timeline events
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  
  // Load events from API
  useEffect(() => {
    refreshTimeline();
  }, [refreshTimeline]);
  
  // Transform API events to TimelineEvent format
  useEffect(() => {
    if (timelineEvents.length > 0) {
      const transformed: TimelineEvent[] = timelineEvents.map(e => ({
        id: e.id,
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: e.title,
        type: (e.type as EventType) || 'Idea',
        status: (e.status as EventStatus) || 'planned',
        description: e.description,
        progress: e.progress,
        tags: e.tags || [],
        blockerReason: e.blockerReason
      }));
      setEvents(transformed);
    }
  }, [timelineEvents]);

  // Group events by Month if no API data
  const rawEvents: TimelineEvent[] = events.length > 0 ? events : [
    {
        id: '1', date: 'Today', fullDate: 'Oct 26, 2023', title: 'MindVault v2.0 Release', type: 'Milestone', status: 'in-progress',
        description: 'Finalizing the public gateway and timeline refactor. Preparing for Product Hunt launch.',
        progress: 85,
        subtasks: [
            { label: 'Refactor Timeline Component', isCompleted: true },
            { label: 'Connect Public API', isCompleted: false },
            { label: 'E2E Testing', isCompleted: false }
        ],
        tags: ['Release', 'Product']
    },
    {
        id: '2', date: 'Yesterday', fullDate: 'Oct 25, 2023', title: 'React Server Actions Audit', type: 'Code', status: 'blocked',
        description: 'Investigating hydration errors in the new dashboard widget when streaming data.',
        blockerReason: 'Waiting for Next.js 14.1 patch regarding server action closures.',
        tags: ['Bugfix', 'Next.js']
    },
    {
        id: '3', date: 'Oct 22', fullDate: 'Oct 22, 2023', title: 'Neubrutalism Design System', type: 'Design', status: 'done',
        description: 'Defined primary color palette, shadows, and border radius tokens in Figma.',
        progress: 100,
        subtasks: [
            { label: 'Figma Library', isCompleted: true },
            { label: 'Tailwind Config', isCompleted: true },
            { label: 'Icon Set Selection', isCompleted: true }
        ],
        tags: ['UI', 'Figma']
    },
    {
        id: '4', date: 'Oct 15', fullDate: 'Oct 15, 2023', title: 'Q4 Roadmap Planning', type: 'Meeting', status: 'done',
        description: 'Aligned on key objectives: 1. AI Integration, 2. Mobile View, 3. Performance.',
        tags: ['Strategy']
    },
    {
        id: '5', date: 'Sep 28', fullDate: 'Sep 28, 2023', title: 'Concept: AI Cat Feeder', type: 'Idea', status: 'planned',
        description: 'Sketching out the hardware requirements for the raspberry pi module.',
        tags: ['Hardware', 'Fun']
    },
    {
        id: '6', date: 'Sep 10', fullDate: 'Sep 10, 2023', title: 'Database Migration', type: 'Code', status: 'done',
        description: 'Moved from local JSON files to SQLite for better query performance.',
        progress: 100,
        tags: ['Backend', 'SQL']
    }
  ];

  // Group events by Month
  const groupedEvents: TimelineGroup[] = [
      { month: 'October', year: '2023', events: rawEvents.filter(e => e.fullDate.includes('Oct')) },
      { month: 'September', year: '2023', events: rawEvents.filter(e => e.fullDate.includes('Sep')) }
  ];

  // Visual Helpers
  const getStatusColor = (status: EventStatus) => {
      switch(status) {
          case 'done': return 'bg-green-500 border-green-700';
          case 'in-progress': return 'bg-yellow-400 border-yellow-600';
          case 'blocked': return 'bg-red-500 border-red-700';
          case 'planned': return 'bg-gray-300 border-gray-500';
      }
  };

  const getTypeIcon = (type: EventType) => {
      switch(type) {
          case 'Code': return 'code';
          case 'Design': return 'palette';
          case 'Meeting': return 'groups';
          case 'Idea': return 'lightbulb';
          case 'Milestone': return 'flag';
      }
  };

  const getTypeColor = (type: EventType) => {
      switch(type) {
          case 'Code': return 'info';
          case 'Design': return 'accent';
          case 'Meeting': return 'secondary';
          case 'Idea': return 'white';
          case 'Milestone': return 'primary';
      }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 h-full flex flex-col">
      {/* Header & Filters */}
      <header className="mb-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
                <h1 className="text-4xl font-display font-bold text-ink mb-2">Project Timeline</h1>
                <p className="text-gray-600 font-medium">Engineering log, milestones, and blockers.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {(['All', 'Milestone', 'Code', 'Design', 'Meeting', 'Idea'] as const).map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilterType(f)}
                        className={`
                            px-4 py-2 rounded-xl font-bold border-2 transition-all text-sm
                            ${filterType === f 
                                ? 'bg-ink text-white border-ink shadow-neo-sm' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-ink hover:text-ink'}
                        `}
                    >
                        {f}
                    </button>
                ))}
            </div>
         </div>
      </header>

      {/* Timeline Container */}
      <div className="relative flex-1 pl-4 md:pl-0">
         {/* The "Main Cable" (Background Line) */}
         <div className="absolute left-[27px] top-4 bottom-0 w-2 bg-gray-200 rounded-full z-0 border-x border-gray-300"></div>

         <div className="space-y-16 pb-20">
             
             {/* "NOW" Indicator */}
             <div className="relative pl-20 mb-8">
                 <div className="absolute left-[18px] top-1 w-6 h-6 bg-green-500 border-3 border-ink rounded-full z-20 animate-pulse shadow-[0_0_15px_rgba(13,242,89,0.6)]"></div>
                 <div className="absolute left-[30px] w-full border-t-2 border-dashed border-green-500 top-4 opacity-50"></div>
                 <div className="inline-flex items-center gap-2 bg-green-100 border-2 border-green-600 px-3 py-1 rounded-full text-xs font-bold text-green-800 shadow-sm">
                     <span className="material-icons-round text-sm">update</span>
                     CURRENT HEAD
                 </div>
             </div>

             {groupedEvents.map((group) => (
                 <div key={`${group.month}-${group.year}`}>
                     {/* Month Divider */}
                     <div className="relative z-10 flex items-center gap-4 mb-8">
                         <div className="w-16 h-16 bg-white border-3 border-ink rounded-xl flex flex-col items-center justify-center font-bold shadow-neo-sm -ml-1">
                             <span className="text-xs text-gray-400 uppercase tracking-widest">{group.year}</span>
                             <span className="text-lg leading-none">{group.month.substring(0,3)}</span>
                         </div>
                         <div className="h-1 flex-1 bg-gray-200 rounded-r-full border-y border-gray-300"></div>
                     </div>

                     {/* Events List */}
                     <div className="space-y-10">
                         {group.events.filter(e => filterType === 'All' || e.type === filterType).map((event) => (
                             <div key={event.id} className="relative pl-20 group">
                                 
                                 {/* Connector Node on the Line */}
                                 <div className={`
                                     absolute left-[19px] top-6 w-6 h-6 rounded-full z-20 flex items-center justify-center 
                                     border-3 border-white shadow-sm transition-transform group-hover:scale-125
                                     ${getStatusColor(event.status)}
                                 `}>
                                     {event.status === 'blocked' && <span className="material-icons-round text-white text-[10px]">close</span>}
                                     {event.status === 'done' && <span className="material-icons-round text-white text-[10px]">check</span>}
                                 </div>
                                 
                                 {/* Horizontal Connector Arm */}
                                 <div className="absolute left-[27px] top-[34px] w-12 h-[3px] bg-gray-300 group-hover:bg-ink group-hover:w-[70px] transition-all z-10 origin-left"></div>

                                 {/* The Event Card */}
                                 <NeoCard 
                                    color={getTypeColor(event.type) as any} 
                                    className={`
                                        p-0 relative transition-all duration-300 group-hover:-translate-y-1
                                        ${event.status === 'blocked' ? 'ring-4 ring-red-100 border-red-500' : ''}
                                        ${event.type === 'Milestone' ? 'border-l-8 border-l-ink' : ''}
                                    `}
                                 >
                                     {/* Card Header */}
                                     <div className="p-5 border-b-2 border-ink/10 flex flex-col md:flex-row gap-4 justify-between items-start">
                                         <div>
                                             <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide bg-white/50 px-2 py-0.5 rounded border border-ink/10">
                                                    {event.fullDate}
                                                </span>
                                                
                                                {/* Status Badge */}
                                                {event.status === 'blocked' && (
                                                    <span className="bg-red-500 text-white border-2 border-red-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                                        <span className="material-icons-round text-xs">warning</span> BLOCKED
                                                    </span>
                                                )}
                                                {event.status === 'in-progress' && (
                                                    <span className="bg-yellow-300 text-yellow-900 border-2 border-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                        <span className="material-icons-round text-xs animate-spin" style={{animationDuration: '3s'}}>sync</span> IN PROGRESS
                                                    </span>
                                                )}
                                             </div>
                                             <h3 className="text-xl font-bold flex items-center gap-2 leading-tight">
                                                 {event.title}
                                                 {event.type === 'Milestone' && <span className="material-icons-round text-amber-500 drop-shadow-sm">stars</span>}
                                             </h3>
                                         </div>
                                         
                                         {/* Type Icon */}
                                         <div className="flex items-center gap-2 self-start md:self-center">
                                             <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                                 {event.tags.map(t => (
                                                     <span key={t} className="bg-white/40 border border-ink/10 px-1.5 py-0.5 rounded text-[10px] font-bold">#{t}</span>
                                                 ))}
                                             </div>
                                             <div className={`w-10 h-10 bg-white border-2 border-ink rounded-xl flex items-center justify-center shadow-sm ml-2 shrink-0`}>
                                                 <span className="material-icons-round text-ink">{getTypeIcon(event.type)}</span>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Card Body */}
                                     <div className="p-5 bg-white/40 backdrop-blur-sm">
                                         <p className="text-ink font-medium leading-relaxed mb-5 text-sm md:text-base">
                                             {event.description}
                                         </p>

                                         {/* Critical Blocker Section */}
                                         {event.status === 'blocked' && event.blockerReason && (
                                             <div className="bg-red-50 border-3 border-red-500 rounded-xl p-3 mb-5 flex gap-3 items-start relative overflow-hidden">
                                                 <div className="absolute -right-4 -top-4 text-red-100 text-6xl opacity-50 select-none pointer-events-none material-icons-round">error</div>
                                                 <span className="material-icons-round text-red-500 mt-0.5">report_problem</span>
                                                 <div>
                                                     <p className="text-xs font-black text-red-800 uppercase mb-1">Blocker Detected</p>
                                                     <p className="text-sm font-bold text-red-900 leading-tight">{event.blockerReason}</p>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Progress Bar */}
                                         {event.progress !== undefined && (
                                             <div className="mb-5">
                                                 <div className="flex justify-between text-xs font-bold mb-1.5">
                                                     <span className="opacity-70">Completion</span>
                                                     <span>{event.progress}%</span>
                                                 </div>
                                                 <div className="w-full h-4 bg-white border-2 border-ink rounded-full overflow-hidden p-0.5 shadow-inner">
                                                     <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out border-r-2 border-ink ${event.progress === 100 ? 'bg-green-500' : 'bg-ink'}`}
                                                        style={{ width: `${event.progress}%` }}
                                                     >
                                                        {/* Stripe pattern for movement */}
                                                        {event.progress < 100 && (
                                                            <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                                                        )}
                                                     </div>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Subtasks / Checklist */}
                                         {event.subtasks && event.subtasks.length > 0 && (
                                             <div className="bg-white border-2 border-ink/10 rounded-xl p-4">
                                                 <p className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
                                                     <span className="material-icons-round text-sm">checklist</span> Subtasks
                                                 </p>
                                                 <div className="space-y-2.5">
                                                     {event.subtasks.map((task, idx) => (
                                                         <div key={idx} className="flex items-start gap-3 group/task cursor-default">
                                                             <div className={`
                                                                 w-5 h-5 border-2 border-ink rounded flex items-center justify-center transition-colors mt-0.5 shrink-0
                                                                 ${task.isCompleted ? 'bg-ink' : 'bg-white group-hover/task:bg-gray-100'}
                                                             `}>
                                                                 {task.isCompleted && <span className="material-icons-round text-white text-xs font-bold">check</span>}
                                                             </div>
                                                             <span className={`text-sm font-bold leading-tight transition-opacity ${task.isCompleted ? 'text-gray-400 line-through decoration-2 decoration-gray-300' : 'text-ink'}`}>
                                                                 {task.label}
                                                             </span>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                     </div>

                                     {/* Footer Actions */}
                                     <div className="px-5 py-3 border-t-2 border-ink/10 flex justify-end gap-3 bg-white/30">
                                         <button className="text-xs font-bold hover:bg-black/5 px-2 py-1 rounded transition-colors flex items-center gap-1 text-gray-600 hover:text-ink">
                                             <span className="material-icons-round text-sm">edit</span> Edit
                                         </button>
                                         <button className="text-xs font-bold hover:bg-black/5 px-2 py-1 rounded transition-colors flex items-center gap-1 text-gray-600 hover:text-ink">
                                             <span className="material-icons-round text-sm">link</span> Link Note
                                         </button>
                                     </div>
                                 </NeoCard>
                             </div>
                         ))}
                     </div>
                 </div>
             ))}

         </div>
      </div>
    </div>
  );
};