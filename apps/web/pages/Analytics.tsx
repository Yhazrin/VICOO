import React, { useEffect, useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { VicooIcon } from '../components/VicooIcon';
import { useApi } from '../contexts/ApiContext';

export const Analytics: React.FC = () => {
  const { token } = useApi();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    fetch('/api/analytics/overview', { headers: h })
      .then(r => r.json())
      .then(d => setStats(d.data))
      .catch(() => {});
  }, [token]);

  const cards = [
    { label: '笔记总数', value: stats?.totalNotes ?? '—', icon: 'article', color: 'bg-primary' },
    { label: '已发布', value: stats?.published ?? '—', icon: 'public', color: 'bg-green-400' },
    { label: '标签数', value: stats?.totalTags ?? '—', icon: 'tag', color: 'bg-blue-400' },
    { label: '图谱节点', value: stats?.totalNodes ?? '—', icon: 'hub', color: 'bg-fuchsia-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">Brain Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">量化你的知识产出</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((stat, i) => (
          <NeoCard key={i} className="p-5 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <VicooIcon name={stat.icon} size={24} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-ink dark:text-white">{stat.value}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          </NeoCard>
        ))}
      </div>

      <NeoCard className="p-6 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-bold mb-4">分类分布</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(stats?.categoryBreakdown || []).map((cat: any) => (
            <div key={cat.category} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
              <p className="text-2xl font-black">{cat.count}</p>
              <p className="text-sm font-bold text-gray-500">{cat.category}</p>
            </div>
          ))}
        </div>
      </NeoCard>
    </div>
  );
};

export default Analytics;
