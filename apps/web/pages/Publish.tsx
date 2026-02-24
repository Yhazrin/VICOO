import React, { useState, useEffect } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { VicooIcon } from '../components/VicooIcon';

interface Platform {
  id: string;
  name: string;
  icon: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  status: number;
  cookiePath?: string;
}

interface PublishTask {
  id: string;
  videoPath: string;
  title: string;
  platforms: string[];
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  result?: any;
}

interface Note {
  id: string;
  title: string;
  content: string;
  snippet?: string;
  category: string;
}

const API_BASE = 'http://localhost:8000/api/publish';
const NOTES_API = 'http://localhost:8000/api/notes';

// Platform icons and colors (使用自定义图标 slug)
const PLATFORM_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  douyin: { icon: 'platform_douyin', color: '#000000', bgColor: 'bg-black' },
  xhs: { icon: 'platform_xhs', color: '#FF2442', bgColor: 'bg-red-500' },
  bilibili: { icon: 'platform_bilibili', color: '#00A1D6', bgColor: 'bg-blue-400' },
  ks: { icon: 'platform_kuaishou', color: '#FF4906', bgColor: 'bg-orange-500' },
  tencent: { icon: 'platform_shipinhao', color: '#07C160', bgColor: 'bg-green-500' },
  baijiahao: { icon: 'platform_baijiahao', color: '#3060FF', bgColor: 'bg-blue-600' },
  tiktok: { icon: 'platform_tiktok', color: '#000000', bgColor: 'bg-gray-900' },
};

export const Publish: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'publish' | 'tasks' | 'workflow'>('workflow');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Publish form state
  const [videoPath, setVideoPath] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Workflow state
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{ title: string; content: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Add account form state
  const [newPlatform, setNewPlatform] = useState('');
  const [newAccountName, setNewAccountName] = useState('');

  // Fetch platforms
  useEffect(() => {
    fetch(`${API_BASE}/platforms`)
      .then(res => res.json())
      .then(data => setPlatforms(data.data || []))
      .catch(err => console.error('Failed to load platforms:', err));

    // Fetch notes for workflow
    fetch(`${NOTES_API}`)
      .then(res => res.json())
      .then(data => setNotes(data.data?.slice(0, 10) || []))
      .catch(err => console.error('Failed to load notes:', err));
  }, []);

  // Fetch accounts
  useEffect(() => {
    if (activeTab === 'accounts' || activeTab === 'workflow') {
      fetchAccounts();
    }
  }, [activeTab]);

  // Fetch tasks
  useEffect(() => {
    if (activeTab === 'tasks' || activeTab === 'workflow') {
      fetchTasks();
    }
  }, [activeTab]);

  const fetchAccounts = () => {
    setLoading(true);
    fetch(`${API_BASE}/accounts`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load accounts');
        setLoading(false);
      });
  };

  const fetchTasks = () => {
    setLoading(true);
    fetch(`${API_BASE}/tasks`)
      .then(res => res.json())
      .then(data => {
        setTasks(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load tasks');
        setLoading(false);
      });
  };

  const handleAddAccount = async () => {
    if (!newPlatform || !newAccountName) {
      setError('Please select platform and enter account name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newPlatform,
          accountName: newAccountName
        })
      });
      const data = await res.json();
      if (data.id) {
        fetchAccounts();
        setNewPlatform('');
        setNewAccountName('');
      }
    } catch (err) {
      setError('Failed to add account');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const handleLogin = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/accounts/${id}/login`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchAccounts();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Failed to login');
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!videoPath || selectedPlatforms.length === 0) {
      setError('Please select video and at least one platform');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath,
          title,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          platforms: selectedPlatforms,
          scheduledAt: scheduledAt || undefined
        })
      });
      const data = await res.json();
      if (data.id) {
        setVideoPath('');
        setTitle('');
        setTags('');
        setSelectedPlatforms([]);
        setScheduledAt('');
        fetchTasks();
        setActiveTab('tasks');
      } else {
        setError(data.error || 'Publish failed');
      }
    } catch (err) {
      setError('Failed to publish');
    }
    setPublishing(false);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // AI Generate content from note
  const handleGenerateContent = async () => {
    if (!selectedNote) return;

    setGenerating(true);
    try {
      // Call AI to generate social media content from note
      const res = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on the following note, generate a social media post. Create an engaging title and content suitable for posting on social platforms like Douyin, Xiaohongshu, and Bilibili.\n\nNote title: ${selectedNote.title}\nNote content: ${selectedNote.content}\n\nReturn the response in JSON format: { "title": "generated title", "content": "generated content" }`
        })
      });
      const data = await res.json();
      if (data.response) {
        try {
          const parsed = JSON.parse(data.response);
          setGeneratedContent({
            title: parsed.title || selectedNote.title,
            content: parsed.content || selectedNote.content
          });
          setTitle(parsed.title || selectedNote.title);
          setContent(parsed.content || '');
        } catch {
          // If not JSON, use the whole response
          setGeneratedContent({
            title: selectedNote.title,
            content: data.response
          });
          setTitle(selectedNote.title);
          setContent(data.response);
        }
      }
    } catch (err) {
      setError('Failed to generate content');
    }
    setGenerating(false);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const getPlatformIcon = (platformId: string) => {
    const iconName = PLATFORM_CONFIG[platformId]?.icon || 'platform_douyin';
    return <VicooIcon name={iconName} size={20} />;
  };

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || platformId;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'published':
        return { label: 'Published', color: 'bg-green-100 text-green-700 border-green-300', icon: 'check_circle' };
      case 'failed':
        return { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-300', icon: 'error' };
      case 'scheduled':
        return { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: 'schedule' };
      case 'publishing':
        return { label: 'Publishing', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: 'sync' };
      default:
        return { label: 'Pending', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: 'hourglass_empty' };
    }
  };

  const tabs = [
    { id: 'workflow', label: 'AI Workflow', icon: 'auto_awesome' },
    { id: 'accounts', label: 'Accounts', icon: 'account_circle' },
    { id: 'publish', label: 'Publish', icon: 'upload' },
    { id: 'tasks', label: 'Tasks', icon: 'history' },
  ];

  // Stats for the workflow tab
  const connectedAccounts = accounts.filter(a => a.status === 1).length;
  const totalTasks = tasks.length;
  const publishedTasks = tasks.filter(t => t.status === 'published').length;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-display font-bold text-ink dark:text-white mb-2">
            Publish Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            AI-powered content pipeline: Research → Note → Post → Publish
          </p>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-icons-round text-blue-600">people</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{connectedAccounts}</p>
              <p className="text-sm text-gray-500">Connected Accounts</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="material-icons-round text-purple-600">schedule</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-icons-round text-green-600">check_circle</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedTasks}</p>
              <p className="text-sm text-gray-500">Published</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-bold whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-ink text-white border-ink shadow-neo-sm dark:bg-white dark:text-ink'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-200'
                  }
                `}
              >
                <span className="material-icons-round">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* AI Workflow Tab - The main feature */}
            {activeTab === 'workflow' && (
              <div className="space-y-6 animate-float" style={{ animationDuration: '0.3s', animationName: 'fadein' }}>

                {/* Workflow Overview */}
                <NeoCard className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center">
                      <span className="material-icons-round text-white text-2xl">auto_awesome</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Content Pipeline</h2>
                      <p className="text-sm text-gray-600">From AI research to social media posts</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</span>
                      <span className="font-medium">Ask AI</span>
                    </div>
                    <span className="material-icons-round text-gray-400">arrow_forward</span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">2</span>
                      <span className="font-medium">Select Note</span>
                    </div>
                    <span className="material-icons-round text-gray-400">arrow_forward</span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">3</span>
                      <span className="font-medium">Generate Post</span>
                    </div>
                    <span className="material-icons-round text-gray-400">arrow_forward</span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">4</span>
                      <span className="font-medium">Publish</span>
                    </div>
                  </div>
                </NeoCard>

                {/* Step 1: Select Note */}
                <NeoCard className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                    <h3 className="text-lg font-bold">Select a Note</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Choose a note to generate social media content from</p>

                  {notes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <span className="material-icons-round text-4xl text-gray-300">note_add</span>
                      <p className="text-gray-500 mt-2">No notes available</p>
                      <p className="text-sm text-gray-400">Create a note first using Ask AI or Editor</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {notes.map(note => (
                        <div
                          key={note.id}
                          onClick={() => {
                            setSelectedNote(note);
                            setGeneratedContent(null);
                          }}
                          className={`
                            p-3 rounded-xl border-2 cursor-pointer transition-all
                            ${selectedNote?.id === note.id
                              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          <p className="font-bold truncate">{note.title}</p>
                          <p className="text-sm text-gray-500 truncate">{note.snippet || note.content.slice(0, 50)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </NeoCard>

                {/* Step 2: Generate Content */}
                {selectedNote && (
                  <NeoCard className="p-6 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">2</div>
                        <h3 className="text-lg font-bold">AI Generate Content</h3>
                      </div>
                      <NeoButton
                        onClick={handleGenerateContent}
                        disabled={generating}
                      >
                        {generating ? (
                          <>
                            <span className="material-icons-round animate-spin mr-2">sync</span>
                            Generating...
                          </>
                        ) : (
                          <>
                            <span className="material-icons-round mr-2">auto_awesome</span>
                            Generate Post
                          </>
                        )}
                      </NeoButton>
                    </div>

                    {generatedContent ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold mb-2">Generated Title</label>
                          <input
                            type="text"
                            value={title || generatedContent.title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2">Generated Content</label>
                          <textarea
                            value={content || generatedContent.content}
                            onChange={e => setContent(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium focus:border-amber-400 focus:outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <NeoButton
                            variant="secondary"
                            onClick={() => {
                              setGeneratedContent(null);
                              setTitle('');
                              setContent('');
                            }}
                          >
                            Regenerate
                          </NeoButton>
                          <NeoButton
                            onClick={() => {
                              setActiveTab('publish');
                            }}
                          >
                            Continue to Publish
                          </NeoButton>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <span className="material-icons-round text-4xl text-gray-300">edit_note</span>
                        <p className="text-gray-500 mt-2">Click "Generate Post" to create social media content</p>
                      </div>
                    )}
                  </NeoCard>
                )}

                {/* Quick Access to Recent Tasks */}
                <NeoCard className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Recent Tasks</h3>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-sm text-amber-600 hover:underline"
                    >
                      View All →
                    </button>
                  </div>
                  {tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tasks yet</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.slice(0, 3).map(task => {
                        const statusConfig = getStatusConfig(task.status);
                        return (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1">
                                {task.platforms.slice(0, 2).map(p => (
                                  <span key={p} className="text-lg">{getPlatformIcon(p)}</span>
                                ))}
                              </div>
                              <span className="font-medium truncate">{task.title || 'Untitled'}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </NeoCard>
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
              <div className="space-y-6 animate-float" style={{ animationDuration: '0.3s', animationName: 'fadein' }}>

                {/* Add Account Card */}
                <NeoCard className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <span className="material-icons-round text-amber-600">add_circle</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Add Account</h2>
                      <p className="text-sm text-gray-500">Connect a new social media account</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Platform</label>
                      <select
                        value={newPlatform}
                        onChange={e => setNewPlatform(e.target.value)}
                        className="w-full bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-ink dark:text-white focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">Select platform</option>
                        {platforms.map(p => (
                          <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Account Name</label>
                      <input
                        type="text"
                        value={newAccountName}
                        onChange={e => setNewAccountName(e.target.value)}
                        placeholder="Your account name"
                        className="w-full bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-ink dark:text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <NeoButton onClick={handleAddAccount} disabled={loading} className="w-full">
                        Add Account
                      </NeoButton>
                    </div>
                  </div>
                </NeoCard>

                {/* Connected Accounts */}
                <NeoCard className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="material-icons-round text-blue-600">people</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Connected Accounts</h2>
                        <p className="text-sm text-gray-500">{accounts.length} account(s) linked</p>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <span className="material-icons-round text-4xl text-gray-300 animate-spin">sync</span>
                      <p className="text-gray-500 mt-2">Loading accounts...</p>
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <span className="material-icons-round text-6xl text-gray-300">account_circle</span>
                      <p className="text-gray-500 mt-4 font-medium">No accounts connected yet</p>
                      <p className="text-sm text-gray-400">Add your first account above to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accounts.map(account => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-2xl border-2 border-gray-200 dark:border-gray-600">
                              {getPlatformIcon(account.platform)}
                            </div>
                            <div>
                              <p className="font-bold">{account.accountName}</p>
                              <p className="text-sm text-gray-500">{getPlatformName(account.platform)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                              account.status === 1
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                            }`}>
                              {account.status === 1 ? 'Active' : 'Inactive'}
                            </span>
                            <NeoButton size="sm" variant="secondary" onClick={() => handleLogin(account.id)}>
                              <span className="material-icons-round text-sm">qr_code</span>
                            </NeoButton>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <span className="material-icons-round text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </NeoCard>
              </div>
            )}

            {/* Publish Tab */}
            {activeTab === 'publish' && (
              <div className="space-y-6 animate-float" style={{ animationDuration: '0.3s', animationName: 'fadein' }}>

                <NeoCard className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="material-icons-round text-green-600">upload_file</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Publish Video</h2>
                      <p className="text-sm text-gray-500">Upload video to multiple platforms</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Video Path */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Video File Path</label>
                      <div className="relative">
                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">video_file</span>
                        <input
                          type="text"
                          value={videoPath}
                          onChange={e => setVideoPath(e.target.value)}
                          placeholder="C:\Videos\my-video.mp4"
                          className="w-full pl-12 pr-4 py-3 bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-ink dark:text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Title - pre-filled from AI generation */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Enter video title"
                        className="w-full px-4 py-3 bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-ink dark:text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    {/* Content/Description */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Description</label>
                      <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={4}
                        placeholder="Enter video description"
                        className="w-full px-4 py-3 bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-ink dark:text-white focus:border-amber-400 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="tag1, tag2, tag3"
                        className="w-full px-4 py-3 bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-ink dark:text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm font-bold mb-3">Select Platforms</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {platforms.map(platform => {
                          const isSelected = selectedPlatforms.includes(platform.id);
                          const config = PLATFORM_CONFIG[platform.id];
                          return (
                            <button
                              key={platform.id}
                              onClick={() => togglePlatform(platform.id)}
                              className={`
                                relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                ${isSelected
                                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300'
                                }
                              `}
                            >
                              {isSelected && (
                                <span className="absolute top-2 right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                                  <span className="material-icons-round text-white text-sm">check</span>
                                </span>
                              )}
                              <span className="text-3xl">{config?.icon || platform.icon}</span>
                              <span className="font-bold text-sm">{platform.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      {selectedPlatforms.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">Select at least one platform</p>
                      )}
                    </div>

                    {/* Scheduled Time */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Schedule (Optional)</label>
                      <div className="relative">
                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">schedule</span>
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-light dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-ink dark:text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {scheduledAt ? `Will publish at ${new Date(scheduledAt).toLocaleString()}` : 'Leave empty for immediate publish'}
                      </p>
                    </div>

                    {/* Publish Button */}
                    <NeoButton
                      onClick={handlePublish}
                      disabled={publishing || !videoPath || selectedPlatforms.length === 0}
                      className="w-full py-4 text-lg"
                    >
                      {publishing ? (
                        <>
                          <span className="material-icons-round animate-spin mr-2">sync</span>
                          Publishing...
                        </>
                      ) : scheduledAt ? (
                        <>
                          <span className="material-icons-round mr-2">schedule</span>
                          Schedule Publish
                        </>
                      ) : (
                        <>
                          <span className="material-icons-round mr-2">rocket_launch</span>
                          Publish Now
                        </>
                      )}
                    </NeoButton>
                  </div>
                </NeoCard>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-6 animate-float" style={{ animationDuration: '0.3s', animationName: 'fadein' }}>

                <NeoCard className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="material-icons-round text-purple-600">history</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Publish History</h2>
                        <p className="text-sm text-gray-500">{tasks.length} task(s)</p>
                      </div>
                    </div>
                    <button
                      onClick={fetchTasks}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span className="material-icons-round">refresh</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <span className="material-icons-round text-4xl text-gray-300 animate-spin">sync</span>
                      <p className="text-gray-500 mt-2">Loading tasks...</p>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <span className="material-icons-round text-6xl text-gray-300">inbox</span>
                      <p className="text-gray-500 mt-4 font-medium">No publish tasks yet</p>
                      <p className="text-sm text-gray-400">Create your first publish task in the Workflow tab</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map(task => {
                        const statusConfig = getStatusConfig(task.status);
                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="flex gap-1">
                                {task.platforms.slice(0, 3).map(p => (
                                  <span key={p} className="text-xl">{getPlatformIcon(p)}</span>
                                ))}
                                {task.platforms.length > 3 && (
                                  <span className="text-sm text-gray-500">+{task.platforms.length - 3}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{task.title || 'Untitled'}</p>
                                <p className="text-sm text-gray-500 truncate">{task.videoPath}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 flex items-center gap-1 ${statusConfig.color}`}>
                                <span className="material-icons-round text-sm">{statusConfig.icon}</span>
                                {statusConfig.label}
                              </span>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {task.publishedAt
                                  ? new Date(task.publishedAt).toLocaleDateString()
                                  : task.scheduledAt
                                    ? new Date(task.scheduledAt).toLocaleDateString()
                                    : new Date(task.createdAt).toLocaleDateString()
                                }
                              </span>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <span className="material-icons-round text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </NeoCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Publish;
