import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables from .env file
dotenv.config();
const { PORT, MONGODB_URI } = process.env;

// Connect to MongoDB with retry on failure
function connectToMongo() {
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.error(`Failed to connect to MongoDB: ${err}`);
      setTimeout(connectToMongo, 5000); // Retry after 5 seconds
    });
}
connectToMongo();

// Start HTTP server on PORT
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandledRejection and uncaughtException with graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err}`);
  server.close(() => process.exit(1)); // Exit the process after closing the server
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err}`);
  server.close(() => process.exit(1)); // Exit the process after closing the server
});