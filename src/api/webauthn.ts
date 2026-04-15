import { Router } from 'express';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { db } from '../db/index.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const rpName = 'AktionsPlaner';
const rpID = process.env.NODE_ENV === 'production' ? new URL(process.env.PUBLIC_URL || 'http://localhost:3000').hostname : 'localhost';
const origin = process.env.NODE_ENV === 'production' ? (process.env.PUBLIC_URL || `https://${rpID}`) : `http://${rpID}:3000`;

export const webauthnRouter = Router();

// Helper to get user by username (admin or person)
function getUserByUsername(username: string) {
  let user = db.prepare('SELECT id, username as name, password_hash, "admin" as type FROM admin_users WHERE username = ?').get(username) as any;
  if (!user) {
    user = db.prepare('SELECT id, name, password_hash, "person" as type FROM persons WHERE email = ? OR name = ?').get(username, username) as any;
  }
  return user;
}

// 1. Generate Registration Options (Requires Auth)
webauthnRouter.post('/generate-registration-options', async (req: any, res) => {
  try {
    let userType, userId, userName;
    if (req.cookies.admin_token) {
      const decoded = jwt.verify(req.cookies.admin_token, JWT_SECRET) as any;
      userType = 'admin';
      userId = decoded.id;
      userName = decoded.username;
    } else if (req.cookies.person_token) {
      const decoded = jwt.verify(req.cookies.person_token, JWT_SECRET) as any;
      userType = 'person';
      userId = decoded.id;
      userName = decoded.name;
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userCredentials = db.prepare('SELECT id, transports FROM webauthn_credentials WHERE user_type = ? AND user_id = ?').all(userType, userId) as any[];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(`${userType}:${userId}`)),
      userName,
      attestationType: 'none',
      excludeCredentials: userCredentials.map(cred => ({
        id: cred.id,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    db.prepare('INSERT OR REPLACE INTO webauthn_challenges (user_type, user_id, challenge) VALUES (?, ?, ?)').run(userType, userId, (options as any).challenge);

    res.json(options);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 2. Verify Registration Response (Requires Auth)
webauthnRouter.post('/verify-registration', async (req: any, res) => {
  try {
    let userType, userId;
    if (req.cookies.admin_token) {
      const decoded = jwt.verify(req.cookies.admin_token, JWT_SECRET) as any;
      userType = 'admin';
      userId = decoded.id;
    } else if (req.cookies.person_token) {
      const decoded = jwt.verify(req.cookies.person_token, JWT_SECRET) as any;
      userType = 'person';
      userId = decoded.id;
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const expectedChallengeRow = db.prepare('SELECT challenge FROM webauthn_challenges WHERE user_type = ? AND user_id = ?').get(userType, userId) as any;
    if (!expectedChallengeRow) return res.status(400).json({ error: 'No challenge found' });

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: expectedChallengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo as any;
      
      db.prepare('INSERT INTO webauthn_credentials (id, user_type, user_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?, ?)')
        .run(
          credentialID,
          userType,
          userId,
          Buffer.from(credentialPublicKey),
          counter,
          JSON.stringify(req.body.response.transports || [])
        );

      db.prepare('DELETE FROM webauthn_challenges WHERE user_type = ? AND user_id = ?').run(userType, userId);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 3. Generate Authentication Options (No Auth Required)
webauthnRouter.post('/generate-authentication-options', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const user = getUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userCredentials = db.prepare('SELECT id, transports FROM webauthn_credentials WHERE user_type = ? AND user_id = ?').all(user.type, user.id) as any[];

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userCredentials.map(cred => ({
        id: cred.id,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
      userVerification: 'preferred',
    });

    db.prepare('INSERT OR REPLACE INTO webauthn_challenges (user_type, user_id, challenge) VALUES (?, ?, ?)').run(user.type, user.id, (options as any).challenge);

    res.json(options);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 4. Verify Authentication Response (No Auth Required)
webauthnRouter.post('/verify-authentication', async (req, res) => {
  try {
    const { username, response } = req.body;
    if (!username || !response) return res.status(400).json({ error: 'Missing data' });

    const user = getUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const expectedChallengeRow = db.prepare('SELECT challenge FROM webauthn_challenges WHERE user_type = ? AND user_id = ?').get(user.type, user.id) as any;
    if (!expectedChallengeRow) return res.status(400).json({ error: 'No challenge found' });

    const credential = db.prepare('SELECT public_key, counter FROM webauthn_credentials WHERE id = ? AND user_type = ? AND user_id = ?').get(response.id, user.type, user.id) as any;
    if (!credential) return res.status(400).json({ error: 'Credential not found' });

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: expectedChallengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: response.id,
        publicKey: new Uint8Array(credential.public_key),
        counter: credential.counter,
      },
    });

    if (verification.verified && verification.authenticationInfo) {
      db.prepare('UPDATE webauthn_credentials SET counter = ? WHERE id = ?').run(verification.authenticationInfo.newCounter, response.id);
      db.prepare('DELETE FROM webauthn_challenges WHERE user_type = ? AND user_id = ?').run(user.type, user.id);

      // Issue JWT
      const token = jwt.sign({ id: user.id, username: user.name, name: user.name, type: user.type }, JWT_SECRET, { expiresIn: user.type === 'admin' ? '7d' : '30d' });
      const cookieName = user.type === 'admin' ? 'admin_token' : 'person_token';
      
      res.cookie(cookieName, token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none' 
      });

      res.json({ success: true, userType: user.type });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
