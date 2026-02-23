import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, getAll, getChanges, saveDatabase } from '../db/index.js';

const router = Router();

// GET /api/tasks - List all tasks
router.get('/', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { status } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params: any[] = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const tasks = getAll<any>(query, params);

  res.json({
    data: tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      linkedNoteId: t.linked_note_id,
      dueDate: t.due_date,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }))
  });
});

// POST /api/tasks - Create task
router.post('/', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { title, description, status = 'todo', priority = 'medium', linkedNoteId, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Title is required' }
    });
  }

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  runQuery(
    `INSERT INTO tasks (id, user_id, title, description, status, priority, linked_note_id, due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, title, description, status, priority, linkedNoteId, dueDate, timestamp, timestamp]
  );

  saveDatabase();

  const task = getOne<any>('SELECT * FROM tasks WHERE id = ?', [id]);

  res.status(201).json({
    data: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      linkedNoteId: task.linked_note_id,
      dueDate: task.due_date,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }
  });
});

// PATCH /api/tasks/:id - Update task
router.patch('/:id', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';
  const { title, description, status, priority, linkedNoteId, dueDate } = req.body;

  const existing = getOne<any>('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (!existing) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Task not found' }
    });
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
  if (linkedNoteId !== undefined) { updates.push('linked_note_id = ?'); params.push(linkedNoteId); }
  if (dueDate !== undefined) { updates.push('due_date = ?'); params.push(dueDate); }

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id, userId);

  runQuery(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
  saveDatabase();

  const task = getOne<any>('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

  res.json({
    data: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      linkedNoteId: task.linked_note_id,
      dueDate: task.due_date,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }
  });
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  const userId = (req as any).userId || 'dev_user_1';

  const result = runQuery('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, userId]);

  if (getChanges() === 0) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Task not found' }
    });
  }

  saveDatabase();
  res.status(204).send();
});

export default router;
