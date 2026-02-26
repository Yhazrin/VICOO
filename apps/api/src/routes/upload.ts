/**
 * Media Upload API
 * POST /api/upload — upload image/video/file, return URL
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'media');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|pdf|doc|docx|md|txt)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('不支持的文件格式'));
  },
});

// POST /api/upload — single file upload
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: '请上传文件' } });
  }

  const apiUrl = process.env.API_URL || 'http://localhost:8000';
  const url = `${apiUrl}/uploads/media/${file.filename}`;
  const type = file.mimetype.startsWith('image/') ? 'image'
    : file.mimetype.startsWith('video/') ? 'video'
    : 'file';

  res.json({
    data: {
      url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      type,
      mimeType: file.mimetype,
    }
  });
});

// POST /api/upload/multiple — batch upload
router.post('/multiple', upload.array('files', 10), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: { code: 'NO_FILES', message: '请上传文件' } });
  }

  const apiUrl = process.env.API_URL || 'http://localhost:8000';

  res.json({
    data: files.map(f => ({
      url: `${apiUrl}/uploads/media/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      type: f.mimetype.startsWith('image/') ? 'image' : f.mimetype.startsWith('video/') ? 'video' : 'file',
    }))
  });
});

export default router;
