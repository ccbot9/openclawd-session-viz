import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// OpenClaw session directory
const SESSION_DIR = path.join(process.env.HOME, '.openclaw/agents/main/sessions');

app.use(cors());
app.use(express.json());

// Get session directory info
app.get('/api/info', (req, res) => {
  res.json({
    sessionDir: SESSION_DIR,
    exists: fs.existsSync(SESSION_DIR)
  });
});

// List all sessions
app.get('/api/sessions', (req, res) => {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      return res.status(404).json({ error: 'Session directory not found', path: SESSION_DIR });
    }

    const files = fs.readdirSync(SESSION_DIR);
    const sessions = files
      .filter(file => file.endsWith('.jsonl'))
      .map(file => {
        const filePath = path.join(SESSION_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          id: file.replace('.jsonl', ''),
          filename: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.modified - a.modified); // Sort by most recent

    res.json({ sessions, total: sessions.length });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific session content
app.get('/api/sessions/:id', (req, res) => {
  try {
    const sessionFile = path.join(SESSION_DIR, `${req.params.id}.jsonl`);

    if (!fs.existsSync(sessionFile)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const content = fs.readFileSync(sessionFile, 'utf-8');
    res.json({
      id: req.params.id,
      content,
      size: content.length
    });
  } catch (error) {
    console.error('Error reading session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`📡 OpenClaw Session API running on http://localhost:${PORT}`);
  console.log(`📂 Session directory: ${SESSION_DIR}`);
  console.log(`✅ Directory exists: ${fs.existsSync(SESSION_DIR)}`);
});
