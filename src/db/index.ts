import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'data.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    response_deadline TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invitees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    person_id INTEGER,
    name_snapshot TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'yes', 'no', 'maybe'
    comment TEXT,
    guests_count INTEGER DEFAULT 0,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE SET NULL,
    UNIQUE(event_id, person_id)
  );
`);

// Create default admin if not exists
const adminExists = db.prepare('SELECT 1 FROM admin_users LIMIT 1').get();
if (!adminExists) {
  const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(defaultPassword, 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('Default admin created. Username: admin, Password:', defaultPassword);
}

// Create demo event if no events exist
const eventExists = db.prepare('SELECT 1 FROM events LIMIT 1').get();
if (!eventExists) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 28); // 4 weeks
  const dateStr = futureDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  
  const eventStmt = db.prepare('INSERT INTO events (title, description, date, location) VALUES (?, ?, ?, ?)');
  const eventInfo = eventStmt.run(
    'Wanderung im Taunus', 
    'Wir machen eine entspannte Wanderung auf den großen Feldberg. Bitte festes Schuhwerk und etwas Proviant mitbringen. Wir laufen ca. 3-4 Stunden.',
    dateStr, 
    'Feldberg, Taunus'
  );
  const eventId = eventInfo.lastInsertRowid;
  
  const personStmt = db.prepare('INSERT INTO persons (name, notes) VALUES (?, ?)');
  const p1 = personStmt.run('Anna Müller', 'Bringt oft Kuchen mit').lastInsertRowid;
  const p2 = personStmt.run('Max Mustermann', 'Kollege').lastInsertRowid;
  const p3 = personStmt.run('Julia Schmidt', '').lastInsertRowid;
  const p4 = personStmt.run('Tom Weber', '').lastInsertRowid;

  const inviteeStmt = db.prepare('INSERT INTO invitees (event_id, person_id, name_snapshot, token, status, comment) VALUES (?, ?, ?, ?, ?, ?)');
  inviteeStmt.run(eventId, p1, 'Anna Müller', crypto.randomBytes(16).toString('hex'), 'yes', 'Ich freue mich! Bringe Kuchen mit.');
  inviteeStmt.run(eventId, p2, 'Max Mustermann', crypto.randomBytes(16).toString('hex'), 'maybe', 'Weiß noch nicht genau, ob ich arbeiten muss.');
  inviteeStmt.run(eventId, p3, 'Julia Schmidt', crypto.randomBytes(16).toString('hex'), 'no', 'Bin leider im Urlaub.');
  inviteeStmt.run(eventId, p4, 'Tom Weber', crypto.randomBytes(16).toString('hex'), 'pending', null);
}
