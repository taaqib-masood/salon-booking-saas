import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err}`);
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err}`);
});
