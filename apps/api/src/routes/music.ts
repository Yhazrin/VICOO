import { Router } from 'express';
import { runQuery, getOne, getAll } from '../db';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import multer from 'multer';
import * as mm from 'music-metadata';

const router = Router();

// API base URL for static file serving
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Ensure uploads directories exist
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'music');
const COVER_DIR = path.join(process.cwd(), 'uploads', 'covers');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(COVER_DIR)) {
  fs.mkdirSync(COVER_DIR, { recursive: true });
}

// Extract album cover from audio file and save as image
async function extractCover(filePath: string, musicId: string): Promise<string | null> {
  try {
    const metadata = await mm.parseFile(filePath);
    const picture = metadata.common.picture?.[0];
    
    if (picture) {
      const ext = picture.format.includes('png') ? '.png' : '.jpg';
      const coverFilename = `${musicId}${ext}`;
      const coverPath = path.join(COVER_DIR, coverFilename);
      
      fs.writeFileSync(coverPath, picture.data);
      return `${API_URL}/uploads/covers/${coverFilename}`;
    }
  } catch (error) {
    console.error('Failed to extract cover:', error);
  }
  return null;
}

// Get duration of audio file
async function getDuration(filePath: string): Promise<number> {
  try {
    const metadata = await mm.parseFile(filePath);
    return Math.round(metadata.format.duration || 0);
  } catch (error) {
    console.error('Failed to get duration:', error);
  }
  return 0;
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// GET /api/music - List user's music
router.get('/', (req, res) => {
  try {
    const userId = (req as any).userId || 'dev_user_1';
    const music = getAll<any>(
      'SELECT * FROM music WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({
      data: music.map(m => ({
        id: m.id,
        title: m.title,
        artist: m.artist,
        coverEmoji: m.cover_emoji,
        coverUrl: m.cover_url || null,
        color1: m.color1,
        color2: m.color2,
        url: `${API_URL}/uploads/music/${m.filename}`,
        duration: m.duration,
        createdAt: m.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch music' }
    });
  }
});

// POST /api/music - Upload new music (multipart form)
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.file);
    console.log('Body:', req.body);
    
    const userId = (req as any).userId || 'dev_user_1';
    const file = req.file;
    const { title, artist, coverEmoji, color1, color2 } = req.body;
    
    if (!file) {
      console.log('No file in request');
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Audio file is required' }
      });
    }
    
    if (!title) {
      // Delete uploaded file if no title
      fs.unlinkSync(file.path);
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Title is required' }
      });
    }
    
    const id = randomUUID();
    const filename = file.filename;
    const filepath = file.path;
    
    // Extract album cover and get duration
    const [coverUrl, duration] = await Promise.all([
      extractCover(filepath, id),
      getDuration(filepath)
    ]);
    
    runQuery(
      `INSERT INTO music (id, user_id, title, artist, cover_emoji, cover_url, color1, color2, filename, filepath, duration) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, title, artist || 'Unknown', coverEmoji || '🎵', coverUrl, color1 || '#FFD166', color2 || '#EF476F', filename, filepath, duration]
    );
    
    res.json({
      data: {
        id,
        title,
        artist: artist || 'Unknown',
        coverEmoji: coverEmoji || '🎵',
        coverUrl,
        color1: color1 || '#FFD166',
        color2: color2 || '#EF476F',
        url: `${API_URL}/uploads/music/${filename}`,
        duration
      }
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to upload music: ' + error.message }
    });
  }
});

// PATCH /api/music/:id - Update music metadata
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, coverEmoji, color1, color2 } = req.body;
    const userId = (req as any).userId || 'dev_user_1';

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (artist !== undefined) { updates.push('artist = ?'); params.push(artist); }
    if (coverEmoji !== undefined) { updates.push('cover_emoji = ?'); params.push(coverEmoji); }
    if (color1 !== undefined) { updates.push('color1 = ?'); params.push(color1); }
    if (color2 !== undefined) { updates.push('color2 = ?'); params.push(color2); }

    if (updates.length === 0) {
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'No fields to update' }
      });
    }

    params.push(id, userId);
    runQuery(
      `UPDATE music SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    const updated = getOne<any>('SELECT * FROM music WHERE id = ?', [id]);
    res.json({
      data: {
        id: updated.id,
        title: updated.title,
        artist: updated.artist,
        coverEmoji: updated.cover_emoji,
        coverUrl: updated.cover_url || null,
        color1: updated.color1,
        color2: updated.color2,
        url: `${API_URL}/uploads/music/${updated.filename}`,
        duration: updated.duration
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update music' }
    });
  }
});

// DELETE /api/music/:id - Delete music
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId || 'dev_user_1';

    const music = getOne<any>('SELECT * FROM music WHERE id = ? AND user_id = ?', [id, userId]);
    if (!music) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Music not found' }
      });
    }

    // Delete file
    if (music.filepath && fs.existsSync(music.filepath)) {
      fs.unlinkSync(music.filepath);
    }

    // Delete cover image if exists
    if (music.cover_url) {
      const coverPath = music.cover_url.replace(`${API_URL}/uploads/covers/`, '');
      const fullCoverPath = path.join(COVER_DIR, coverPath);
      if (fs.existsSync(fullCoverPath)) {
        fs.unlinkSync(fullCoverPath);
      }
    }

    runQuery('DELETE FROM music WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete music' }
    });
  }
});

export default router;
