import React from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';

export const Analytics: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-8">
         <h1 className="text-4xl font-display font-bold text-ink mb-2">Brain Analytics</h1>
         <p className="text-gray-600 font-medium">Quantify your cognitive throughput.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {[
            { label: 'Total Notes', value: '1,248', icon: 'article', color: 'bg-primary' },
            { label: 'Words Written', value: '450k', icon: 'edit', color: 'bg-secondary' },
            { label: 'Connections', value: '3,402', icon: 'hub', color: 'bg-accent' },
            { label: 'Input Streak', value: '12 Days', icon: 'local_fire_department', color: 'bg-info' },
         ].map((stat, i) => (
            <NeoCard key={i} className="p-4 flex items-center gap-4">
               <div className={`w-12 h-12 ${stat.color} border-2 border-ink rounded-xl flex items-center justify-center shadow-neo-sm`}>
                  <span className="material-icons-round text-2xl">{stat.icon}</span>
               </div>
               <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
               </div>
            </NeoCard>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Activity Chart (Mock) */}
         <div className="lg:col-span-2">
            <NeoCard className="p-6 h-[400px] flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl">Activity Volume</h3>
                  <select className="bg-white border-2 border-ink rounded-lg px-2 py-1 font-bold text-sm">
                     <option>Last 30 Days</option>
                     <option>Last Year</option>
                  </select>
               </div>
               <div className="flex-1 flex items-end justify-between gap-2 px-4 border-b-2 border-l-2 border-ink/10 pb-2">
                  {[40, 65, 30, 80, 55, 90, 45, 70, 50, 60, 85, 95].map((h, i) => (
                     <div key={i} className="w-full bg-primary/20 border-2 border-primary rounded-t-lg relative group hover:bg-primary transition-colors cursor-pointer" style={{ height: `${h}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                           {h * 10} inputs
                        </div>
                     </div>
                  ))}
               </div>
               <div className="flex justify-between px-4 mt-2 text-xs font-bold text-gray-400 uppercase">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
               </div>
            </NeoCard>
         </div>

         {/* Category Distribution */}
         <div>
            <NeoCard className="p-6 h-[400px] flex flex-col">
               <h3 className="font-bold text-xl mb-6">Taxonomy Breakdown</h3>
               <div className="flex-1 flex items-center justify-center relative">
                  {/* CSS Pie Chart */}
                  <div className="w-48 h-48 rounded-full border-4 border-ink shadow-neo relative overflow-hidden" style={{ background: 'conic-gradient(#0df259 0% 35%, #FFD166 35% 60%, #EF476F 60% 85%, #118AB2 85% 100%)' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-16 h-16 bg-white border-3 border-ink rounded-full"></div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-6">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary border border-ink rounded-full"></div><span className="font-bold text-sm">Code (35%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-secondary border border-ink rounded-full"></div><span className="font-bold text-sm">Meeting (25%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-accent border border-ink rounded-full"></div><span className="font-bold text-sm">Design (25%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-info border border-ink rounded-full"></div><span className="font-bold text-sm">Idea (15%)</span></div>
               </div>
            </NeoCard>
         </div>
      </div>
    </div>
  );
};