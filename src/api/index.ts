import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import crypto from 'crypto';

export const apiRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// --- AUTH MIDDLEWARE ---
const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
const authRouter = Router();
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.json({ success: true });
});
authRouter.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});
authRouter.get('/check', requireAuth, (req: any, res) => {
  res.json({ user: req.admin });
});
apiRouter.use('/auth', authRouter);

// --- ADMIN ROUTES ---
const adminRouter = Router();
adminRouter.use(requireAuth);

// Events
adminRouter.get('/events', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
  res.json(events);
});
adminRouter.post('/events', (req, res) => {
  const { title, description, date, location, response_deadline } = req.body;
  const stmt = db.prepare('INSERT INTO events (title, description, date, location, response_deadline) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(title, description, date, location, response_deadline || null);
  res.json({ id: info.lastInsertRowid });
});
adminRouter.get('/events/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});
adminRouter.put('/events/:id', (req, res) => {
  const { title, description, date, location, response_deadline } = req.body;
  const stmt = db.prepare('UPDATE events SET title = ?, description = ?, date = ?, location = ?, response_deadline = ? WHERE id = ?');
  stmt.run(title, description, date, location, response_deadline || null, req.params.id);
  res.json({ success: true });
});
adminRouter.delete('/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Event Invites
adminRouter.get('/events/:id/invites', (req, res) => {
  const invites = db.prepare(`
    SELECT i.*, p.name as current_name 
    FROM invitees i 
    LEFT JOIN persons p ON i.person_id = p.id 
    WHERE i.event_id = ?
  `).all(req.params.id);
  res.json(invites);
});
adminRouter.post('/events/:id/invites', (req, res) => {
  const { person_id } = req.body;
  try {
    const person = db.prepare('SELECT name FROM persons WHERE id = ?').get(person_id) as any;
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const token = crypto.randomBytes(16).toString('hex');
    const stmt = db.prepare('INSERT INTO invitees (event_id, person_id, name_snapshot, token) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.params.id, person_id, person.name, token);
    res.json({ id: info.lastInsertRowid, token });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Person ist bereits eingeladen' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});
adminRouter.delete('/events/:id/invites/:inviteId', (req, res) => {
  db.prepare('DELETE FROM invitees WHERE id = ? AND event_id = ?').run(req.params.inviteId, req.params.id);
  res.json({ success: true });
});

// Persons
adminRouter.get('/persons', (req, res) => {
  const persons = db.prepare('SELECT * FROM persons ORDER BY name ASC').all();
  res.json(persons);
});
adminRouter.post('/persons', (req, res) => {
  const { name, notes } = req.body;
  const stmt = db.prepare('INSERT INTO persons (name, notes) VALUES (?, ?)');
  const info = stmt.run(name, notes || null);
  res.json({ id: info.lastInsertRowid });
});
adminRouter.put('/persons/:id', (req, res) => {
  const { name, notes } = req.body;
  const stmt = db.prepare('UPDATE persons SET name = ?, notes = ? WHERE id = ?');
  stmt.run(name, notes || null, req.params.id);
  res.json({ success: true });
});
adminRouter.delete('/persons/:id', (req, res) => {
  db.prepare('DELETE FROM persons WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Stats
adminRouter.get('/stats', (req, res) => {
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get() as any;
  const totalPersons = db.prepare('SELECT COUNT(*) as count FROM persons').get() as any;
  const totalInvites = db.prepare('SELECT COUNT(*) as count FROM invitees').get() as any;
  res.json({
    events: totalEvents.count,
    persons: totalPersons.count,
    invites: totalInvites.count
  });
});

apiRouter.use('/admin', adminRouter);

// --- PUBLIC ROUTES ---
const publicRouter = Router();
publicRouter.get('/invite/:token', (req, res) => {
  const invitee = db.prepare(`
    SELECT * FROM invitees WHERE token = ?
  `).get(req.params.token) as any;
  
  if (!invitee) return res.status(404).json({ error: 'Einladung nicht gefunden' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(invitee.event_id);
  if (!event) return res.status(404).json({ error: 'Event nicht gefunden' });

  res.json({ invitee, event });
});

publicRouter.post('/invite/:token/respond', (req, res) => {
  const { status, comment, guests_count } = req.body;
  if (!['yes', 'no', 'maybe'].includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status' });
  }

  // Check deadline
  const invitee = db.prepare('SELECT event_id FROM invitees WHERE token = ?').get(req.params.token) as any;
  if (!invitee) return res.status(404).json({ error: 'Einladung nicht gefunden' });
  
  const event = db.prepare('SELECT response_deadline FROM events WHERE id = ?').get(invitee.event_id) as any;
  if (event.response_deadline && new Date() > new Date(event.response_deadline)) {
    return res.status(400).json({ error: 'Die Antwortfrist ist bereits abgelaufen.' });
  }

  const stmt = db.prepare('UPDATE invitees SET status = ?, comment = ?, guests_count = ?, responded_at = CURRENT_TIMESTAMP WHERE token = ?');
  const info = stmt.run(status, comment || null, guests_count || 0, req.params.token);
  
  if (info.changes === 0) return res.status(404).json({ error: 'Einladung nicht gefunden' });
  
  res.json({ success: true });
});

apiRouter.use('/public', publicRouter);
