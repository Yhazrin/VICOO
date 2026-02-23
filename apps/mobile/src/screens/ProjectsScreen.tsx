// ProjectsScreen.tsx - Mobile Projects/Kanban View
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Design new layout', status: 'todo', priority: 'high' },
  { id: '2', title: 'Implement Quick Capture', status: 'doing', priority: 'high' },
  { id: '3', title: 'Fix mobile bugs', status: 'todo', priority: 'medium' },
  { id: '4', title: 'Add dark mode', status: 'done', priority: 'low' },
];

export default function ProjectsScreen() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeColumn, setActiveColumn] = useState<'todo' | 'doing' | 'done'>('todo');

  const columns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: '#666' },
    { id: 'doing', label: 'In Progress', color: '#FFB800' },
    { id: 'done', label: 'Done', color: '#22c55e' },
  ];

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'todo',
      priority: 'medium',
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Kanban Columns */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.board}>
        {columns.map((column) => (
          <View key={column.id} style={styles.column}>
            {/* Column Header */}
            <View style={[styles.columnHeader, { borderLeftColor: column.color }]}>
              <Text style={styles.columnTitle}>{column.label}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {tasks.filter(t => t.status === column.id).length}
                </Text>
              </View>
            </View>

            {/* Tasks */}
            <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
              {tasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskCard}
                    onPress={() => {
                      // Simple status toggle on tap
                      if (column.id === 'todo') moveTask(task.id, 'doing');
                      else if (column.id === 'doing') moveTask(task.id, 'done');
                    }}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.description && (
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {task.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              {tasks.filter(t => t.status === column.id).length === 0 && (
                <View style={styles.emptyColumn}>
                  <Text style={styles.emptyText}>No tasks</Text>
                </View>
              )}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task title..."
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addTaskButton]}
                onPress={handleAddTask}
              >
                <Text style={styles.addTaskButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    flex: 1,
  },
  column: {
    width: 280,
    marginHorizontal: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 4,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  countBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  taskList: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  taskDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyColumn: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  addTaskButton: {
    backgroundColor: '#FFB800',
  },
  addTaskButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
