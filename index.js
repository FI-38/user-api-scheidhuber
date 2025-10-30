import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const app = express();

// configure json in req.body
app.use(express.json());

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

app.get('/', (req, res) => {
    res.status(200).json({"hello": "world"});
})

// Server starten
app.listen(process.env.PORT, () => {
    console.log(`Server läuft auf http://server:${process.env.PORT}`);
});
