// server.js
import { app } from './index.js';

// Start server
const server = app.listen(process.env.PORT, () => {
    console.log(`Server läuft auf http://fi38.mshome.net:${process.env.PORT}`);
}).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${process.env.PORT} ist bereits belegt.`);
    } else {
      console.error("Serverfehler:", err);
    }
    process.exit(1);
});
