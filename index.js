import express from 'express';
// import pool from './db.js';
import cors from 'cors';

import userRouter from './routes/user.js';

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

app.get('/api/name', (req, res) => {
    res.status(200).json({ "name": "Max" });
})

app.use(userRouter);



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
