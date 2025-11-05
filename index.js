import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import pool from './db.js';
import getDatabaseConnection from './db.js';
import cors from 'cors';
import authMiddleware from './middleware/auth.js';

// Prototype overrides
BigInt.prototype.toJSON = function() { return this.toString() }

export const app = express();

// configure json in req.body
app.use(express.json());

// CORS konfigurieren
app.use(cors({
    origin: process.env.HOST.split(",") || '', // React-URL
    // origin: '*', // Everything-URL
    credentials: true         // Erlaubt das Senden von Cookies, falls benötigt
}));

app.get('/', (req, res) => {
    res.status(200).json({ "hello": "world" });
})

app.get('/api/users', async (req, res) => {
    const conn = await getDatabaseConnection();

    const users = await conn.query('SELECT * FROM user');

    res.status(200).json({users});
});



app.post('/api/login', async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    const conn = await pool.getConnection();

    console.log(conn);
    let user;
    try {
        [user] = await conn.query(
            'SELECT * FROM user WHERE username = ?', [username]);
    } catch (error) {
        console.log(error);
    } finally {
        conn.release();
    }
    if (!user) return res.status(400).json(
        { error: 'Benutzer nicht gefunden' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
        return res.status(400).json({ error: 'Falsches Passwort' });
    }
    const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
    );

    res.status(200).json({ token, userId: user.id });
});

app.post('/api/register', async (req, res) => {
    console.log(req.body);
    const { username, name, email, password } = req.body;

    // Validierung der Eingaben
    if (!username || !name || !email || !password) {
        return res.status(400).json({
            error: 'Alle Felder sind erforderlich'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: 'Passwort muss mindestens 8 Zeichen lang sein'
        });
    }

    // E-Mail-Format validieren (optional aber empfohlen)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Ungültige E-Mail-Adresse'
        });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // Prüfen ob Benutzer bereits existiert
        const existing = await conn.query(
            'SELECT id FROM user WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Benutzername oder E-Mail bereits vergeben'
            });
        }

        // Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 12);

        // Benutzer in Datenbank speichern
        const result = await conn.query(
            'INSERT INTO user (username, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [username, name, email, hashedPassword]
        );

        res.status(201).json({
            message: 'Registrierung erfolgreich! Bitte einloggen.',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registrierungsfehler:', error);
        res.status(500).json({
            error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
        });
    } finally {
        if (conn) conn.release();
    }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    const conn = await getDatabaseConnection();

    try {
        const [userResult] = await conn.query(
            `SELECT p.firstname, p.surname, p.bio
             FROM user u
             LEFT JOIN user_profile p ON u.id = p.user_id
             WHERE u.id = ?`,
            [userId]
        );
        if (userResult.length === 0) {
            return res.status(404).json({ error: 'Profil nicht gefunden' });
        }

        res.json(userResult);

    } catch (error) {
        console.error('Fehler beim Abrufen des Profils:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Profils' });
    } finally {
        conn.release();
    }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { firstname, surname, bio } = req.body;
    const conn = await pool.getConnection();

    try {
        // Aktualisieren der Profildaten in der `user_profile`-Tabelle
        await conn.query(
          `INSERT INTO user_profile (user_id, firstname, surname, bio)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           firstname = VALUES(firstname),
           surname = VALUES(surname),
           bio = VALUES(bio)`,
           [ userId, firstname, surname, bio ]
          );
        res.json({ message: 'Profil erfolgreich aktualisiert' });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Profils:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
    } finally {
        conn.release();
    }
});

// Middleware for catching all errors
app.use((err, req, res, next) => {
    console.log(`An error occured: ${err}`);
    console.error('Error information:', {
        message: err.message,
        stack: err.stack,
        status: err.status || 500
    });

    res.status(err.status || 500).json({
        error: err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});
