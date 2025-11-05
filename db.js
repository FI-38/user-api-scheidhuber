import mariadb from 'mariadb';
import 'dotenv/config';

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 5,
  insertIdAsNumber: true
});

// Verbindung testen
// pool.getConnection()
//   .then(conn => {
//     console.log('Datenbankverbindung erfolgreich');
//     conn.release();
//   })
//   .catch(err => {
//     console.error('Datenbankverbindung fehlgeschlagen:', err);
//   });

// export default pool;
export default async function getDatabaseConnection () {
  try {
      const connection = await pool.getConnection();
      console.log("Erfolgreich mit der Datenbank verbunden");
      return connection;
  } catch (error) {
      console.error("Fehler bei der Verbindung zur Datenbank:", error);
      throw error;
  }
}
