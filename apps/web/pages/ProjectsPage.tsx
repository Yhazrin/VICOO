import React, { useState, useEffect, useCallback } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  linkedNoteId?: string;
  dueDate?: string;
}

interface ProjectsPageProps {
  onOpenNote?: (noteId: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onOpenNote }) => {
  const { t } = useLanguage();
  const { token } = useApi();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const headers = useCallback(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchTasks = useCallback(() => {
    fetch('/api/tasks', { headers: headers() })
      .then(r => r.json())
      .then(d => setTasks(d.data || []))
      .catch(() => {});
  }, [headers]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const columns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'doing', label: 'In Progress', color: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: 'done', label: 'Done', color: 'bg-green-100 dark:bg-green-900/30' },
  ];

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: Task['status']) => {
    if (draggedTask) {
      setTasks(tasks.map(task =>
        task.id === draggedTask.id ? { ...task, status } : task
      ));
      fetch(`/api/tasks/${draggedTask.id}`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ status }),
      }).catch(() => {});
      setDraggedTask(null);
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    fetch('/api/tasks', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ title: newTaskTitle, status: 'todo', priority: 'medium' }),
    })
      .then(r => r.json())
      .then(() => { fetchTasks(); setNewTaskTitle(''); setShowNewTaskModal(false); })
      .catch(() => {});
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize tasks and track progress
          </p>
        </div>
        <NeoButton onClick={() => setShowNewTaskModal(true)}>
          + Add Task
        </NeoButton>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(column => (
          <div
            key={column.id}
            className={`flex-shrink-0 w-80 ${column.color} rounded-2xl p-4`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {column.label}
              </h3>
              <span className="px-2 py-1 text-xs font-bold bg-white dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[200px]">
              {tasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-move"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                    )}
                    {task.linkedNoteId && (
                      <button
                        onClick={() => onOpenNote?.(task.linkedNoteId)}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        View linked note →
                      </button>
                    )}
                  </div>
                ))}

              {tasks.filter(t => t.status === column.id).length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewTaskModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              New Task
            </h3>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none text-gray-900 dark:text-white mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <div className="flex justify-end gap-2">
              <NeoButton variant="ghost" onClick={() => setShowNewTaskModal(false)}>
                Cancel
              </NeoButton>
              <NeoButton onClick={handleAddTask}>
                Add Task
              </NeoButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
