import { Router } from 'express';
import { getOne, runQuery, saveDatabase } from '../db/index.js';

const router = Router();
const DEFAULT_USER_ID = 'dev_user_1';

// GET /api/settings - Get user settings
router.get('/', (req, res) => {
  try {
    let settings = getOne<any>('SELECT * FROM user_settings WHERE id = ?', [DEFAULT_USER_ID]);

    // Create default settings if not exist
    if (!settings) {
      runQuery(
        `INSERT INTO user_settings (id, theme, language, mascot_skin, font_size, focus_default_duration, focus_break_duration, focus_sound_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [DEFAULT_USER_ID, 'dark', 'en', 'bot', 'medium', 25, 5, 1]
      );
      saveDatabase();
      settings = getOne<any>('SELECT * FROM user_settings WHERE id = ?', [DEFAULT_USER_ID]);
    }

    res.json({
      data: {
        theme: settings.theme,
        language: settings.language,
        mascotSkin: settings.mascot_skin,
        fontSize: settings.font_size,
        focusSettings: {
          defaultDuration: settings.focus_default_duration,
          breakDuration: settings.focus_break_duration,
          soundEnabled: !!settings.focus_sound_enabled
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' }
    });
  }
});

// PATCH /api/settings - Update user settings
router.patch('/', (req, res) => {
  try {
    const { theme, language, mascotSkin, fontSize, focusSettings } = req.body;

    // Check if settings exist
    let settings = getOne<any>('SELECT id FROM user_settings WHERE id = ?', [DEFAULT_USER_ID]);
    if (!settings) {
      runQuery(
        `INSERT INTO user_settings (id, theme, language, mascot_skin, font_size, focus_default_duration, focus_break_duration, focus_sound_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [DEFAULT_USER_ID, 'dark', 'en', 'bot', 'medium', 25, 5, 1]
      );
    }

    if (theme) runQuery('UPDATE user_settings SET theme = ?, updated_at = datetime("now") WHERE id = ?', [theme, DEFAULT_USER_ID]);
    if (language) runQuery('UPDATE user_settings SET language = ?, updated_at = datetime("now") WHERE id = ?', [language, DEFAULT_USER_ID]);
    if (mascotSkin) runQuery('UPDATE user_settings SET mascot_skin = ?, updated_at = datetime("now") WHERE id = ?', [mascotSkin, DEFAULT_USER_ID]);
    if (fontSize) runQuery('UPDATE user_settings SET font_size = ?, updated_at = datetime("now") WHERE id = ?', [fontSize, DEFAULT_USER_ID]);

    if (focusSettings) {
      if (focusSettings.defaultDuration) {
        runQuery('UPDATE user_settings SET focus_default_duration = ?, updated_at = datetime("now") WHERE id = ?', [focusSettings.defaultDuration, DEFAULT_USER_ID]);
      }
      if (focusSettings.breakDuration) {
        runQuery('UPDATE user_settings SET focus_break_duration = ?, updated_at = datetime("now") WHERE id = ?', [focusSettings.breakDuration, DEFAULT_USER_ID]);
      }
      if (focusSettings.soundEnabled !== undefined) {
        runQuery('UPDATE user_settings SET focus_sound_enabled = ?, updated_at = datetime("now") WHERE id = ?', [focusSettings.soundEnabled ? 1 : 0, DEFAULT_USER_ID]);
      }
    }

    saveDatabase();

    const updated = getOne<any>('SELECT * FROM user_settings WHERE id = ?', [DEFAULT_USER_ID]);

    res.json({
      data: {
        theme: updated.theme,
        language: updated.language,
        mascotSkin: updated.mascot_skin,
        fontSize: updated.font_size,
        focusSettings: {
          defaultDuration: updated.focus_default_duration,
          breakDuration: updated.focus_break_duration,
          soundEnabled: !!updated.focus_sound_enabled
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' }
    });
  }
});

export default router;
