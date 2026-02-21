import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAll, getOne, runQuery, saveDatabase } from '../db/index.js';

const router = Router();

// GET /api/focus/sessions - Get focus sessions
router.get('/sessions', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const sessions = getAll<any>(
      'SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );

    const total = getOne<{ count: number }>('SELECT COUNT(*) as count FROM focus_sessions');

    res.json({
      data: sessions.map(s => ({
        id: s.id,
        duration: s.duration,
        breakDuration: s.break_duration,
        completed: !!s.completed,
        startedAt: s.started_at,
        endedAt: s.ended_at
      })),
      meta: {
        total: total?.count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch focus sessions' }
    });
  }
});

// POST /api/focus/sessions - Create a new focus session
router.post('/sessions', (req, res) => {
  try {
    const { duration = 25, breakDuration = 5 } = req.body;

    const id = uuidv4();

    runQuery(
      'INSERT INTO focus_sessions (id, duration, break_duration, completed, started_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [id, duration, breakDuration, 0]
    );
    saveDatabase();

    res.status(201).json({
      data: {
        id,
        duration,
        breakDuration,
        completed: false,
        startedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create focus session' }
    });
  }
});

// PATCH /api/focus/sessions/:id - Complete a focus session
router.patch('/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const existing = getOne<any>('SELECT id FROM focus_sessions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Focus session not found' }
      });
    }

    if (completed !== undefined) {
      runQuery(
        'UPDATE focus_sessions SET completed = ?, ended_at = datetime("now") WHERE id = ?',
        [completed ? 1 : 0, id]
      );
      saveDatabase();
    }

    const updated = getOne<any>('SELECT * FROM focus_sessions WHERE id = ?', [id]);

    res.json({
      data: {
        id: updated.id,
        duration: updated.duration,
        breakDuration: updated.break_duration,
        completed: !!updated.completed,
        startedAt: updated.started_at,
        endedAt: updated.ended_at
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update focus session' }
    });
  }
});

// GET /api/focus/stats - Get focus statistics
router.get('/stats', (req, res) => {
  try {
    const totalSessions = getOne<{ count: number }>('SELECT COUNT(*) as count FROM focus_sessions');
    const completedSessions = getOne<{ count: number }>('SELECT COUNT(*) as count FROM focus_sessions WHERE completed = 1');
    const totalMinutes = getOne<{ total: number }>('SELECT COALESCE(SUM(duration), 0) as total FROM focus_sessions WHERE completed = 1');

    // Today's sessions
    const todaySessions = getOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM focus_sessions 
      WHERE completed = 1 AND date(started_at) = date('now')
    `);

    // This week's sessions
    const weekSessions = getOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM focus_sessions 
      WHERE completed = 1 AND started_at >= datetime('now', '-7 days')
    `);

    // Streak calculation (consecutive days with completed sessions)
    let streak = 0;
    const streakCheck = getAll<any>(`
      SELECT DISTINCT date(started_at) as date FROM focus_sessions 
      WHERE completed = 1 ORDER BY date DESC
    `);

    if (streakCheck.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date(today);

      for (const row of streakCheck) {
        const sessionDate = row.date;
        const checkDateStr = checkDate.toISOString().split('T')[0];

        if (sessionDate === checkDateStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (sessionDate === checkDate.toISOString().split('T')[0]) {
          // Same day, continue
          continue;
        } else {
          break;
        }
      }
    }

    res.json({
      data: {
        totalSessions: totalSessions?.count || 0,
        completedSessions: completedSessions?.count || 0,
        totalMinutes: totalMinutes?.total || 0,
        todaySessions: todaySessions?.count || 0,
        weekSessions: weekSessions?.count || 0,
        streak,
        completionRate: totalSessions?.count ? Math.round((completedSessions?.count / totalSessions.count) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch focus stats' }
    });
  }
});

export default router;
