const MOCK_TASKS = [
    { id: '1', title: 'Design new dashboard layout', description: 'Create wireframes for the new dashboard', status: 'todo', priority: 'high' },
    { id: '2', title: 'Implement Quick Capture', description: 'Add Ctrl+Shift+N shortcut', status: 'doing', priority: 'high' },
    { id: '3', title: 'Fix mobile responsive issues', status: 'todo', priority: 'medium' },
    { id: '4', title: 'Add dark mode support', status: 'done', priority: 'low' },
    { id: '5', title: 'Write API documentation', status: 'todo', priority: 'medium' },
];
Page({
    data: {
        tasks: MOCK_TASKS,
        todoTasks: [],
        doingTasks: [],
        doneTasks: [],
        showNewTaskModal: false,
        newTaskTitle: '',
        newTaskPriority: 'medium',
        draggedTask: null,
        columns: [
            { id: 'todo', label: 'To Do', color: '#f3f4f6' },
            { id: 'doing', label: 'In Progress', color: '#FEF3C7' },
            { id: 'done', label: 'Done', color: '#D1FAE5' }
        ]
    },
    onLoad() {
        this.updateTasksByStatus();
    },
    // Update tasks by status
    updateTasksByStatus() {
        this.setData({
            todoTasks: this.data.tasks.filter(t => t.status === 'todo'),
            doingTasks: this.data.tasks.filter(t => t.status === 'doing'),
            doneTasks: this.data.tasks.filter(t => t.status === 'done')
        });
    },
    // Get tasks by status
    getTasksByStatus(status) {
        return this.data.tasks.filter(t => t.status === status);
    },
    // Add new task
    openNewTaskModal() {
        this.setData({ showNewTaskModal: true });
    },
    closeNewTaskModal() {
        this.setData({
            showNewTaskModal: false,
            newTaskTitle: '',
            newTaskPriority: 'medium'
        });
    },
    onNewTaskTitleInput(e) {
        this.setData({ newTaskTitle: e.detail.value });
    },
    onPriorityChange(e) {
        this.setData({ newTaskPriority: e.currentTarget.dataset.priority });
    },
    addTask() {
        if (!this.data.newTaskTitle.trim()) {
            wx.showToast({ title: 'Please enter a task title', icon: 'none' });
            return;
        }
        const newTask = {
            id: Date.now().toString(),
            title: this.data.newTaskTitle,
            status: 'todo',
            priority: this.data.newTaskPriority
        };
        this.setData({
            tasks: [...this.data.tasks, newTask],
            showNewTaskModal: false,
            newTaskTitle: '',
            newTaskPriority: 'medium'
        });
        this.updateTasksByStatus();
        wx.showToast({ title: 'Task added' });
    },
    // Drag handlers
    onDragStart(e) {
        const taskId = e.currentTarget.dataset.id;
        const task = this.data.tasks.find(t => t.id === taskId);
        this.setData({ draggedTask: task });
    },
    onDragOver(e) {
        // Required for drop to work
    },
    onDrop(e) {
        const targetStatus = e.currentTarget.dataset.status;
        const { draggedTask } = this.data;
        if (draggedTask) {
            const updatedTasks = this.data.tasks.map(task => task.id === draggedTask.id
                ? { ...task, status: targetStatus }
                : task);
            this.setData({
                tasks: updatedTasks,
                draggedTask: null
            });
            this.updateTasksByStatus();
        }
    },
    // Delete task
    deleteTask(e) {
        const taskId = e.currentTarget.dataset.id;
        wx.showModal({
            title: 'Delete Task',
            content: 'Are you sure you want to delete this task?',
            success: (res) => {
                if (res.confirm) {
                    this.setData({
                        tasks: this.data.tasks.filter(t => t.id !== taskId)
                    });
                    this.updateTasksByStatus();
                    wx.showToast({ title: 'Task deleted' });
                }
            }
        });
    },
    // Get priority color
    getPriorityColor(priority) {
        switch (priority) {
            case 'high': return '#FEE2E2';
            case 'medium': return '#FEF3C7';
            case 'low': return '#DBEAFE';
        }
    },
    // Get priority text color
    getPriorityTextColor(priority) {
        switch (priority) {
            case 'high': return '#DC2626';
            case 'medium': return '#D97706';
            case 'low': return '#2563EB';
        }
    },
    // Open linked note
    openLinkedNote(e) {
        const noteId = e.currentTarget.dataset.noteId;
        if (noteId) {
            wx.navigateTo({
                url: `/pages/editor/editor?id=${noteId}`
            });
        }
    },
    onShareAppMessage() {
        return {
            title: 'Vicoo Projects',
            path: '/pages/projects/projects'
        };
    }
});
