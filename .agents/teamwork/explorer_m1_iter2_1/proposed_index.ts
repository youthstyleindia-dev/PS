import { app } from './app.js';
import { initDb, closeDb } from './db/connection.js';

const PORT = process.env.PORT || 3001;

export function startServer(port: number | string = PORT): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      initDb();
      const server = app.listen(port, () => {
        console.log(`🚀 UniVerse Server listening at http://localhost:${port}`);
        resolve(server);
      });

      const shutdown = () => {
        server.close(() => {
          closeDb();
          process.exit(0);
        });
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (err) {
      reject(err);
    }
  });
}

// Auto-start when executed directly
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))
) {
  startServer();
}

export { app, startServer };
export default app;
