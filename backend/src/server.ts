import { buildApp } from './app.js';

const port = Number(process.env['PORT'] ?? 3000);
const app = buildApp();

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`Member Fitness API listening on http://localhost:${port}`))
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
