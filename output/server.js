import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Phase 4 Imports
import inventoryRoutes from './routes/inventory.js';

// MongoDB Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    process.exit(1);
  }
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Phase 4 Routes
app.use('/api/v1/inventory', inventoryRoutes);

// Basic routes
app.get('/api/v1/recommendations', (req, res) => {
  res.json({ recommendations: [], message: 'AI recommendations endpoint' });
});

app.get('/mobile/services', (req, res) => {
  res.json({ services: [], message: 'Mobile services endpoint' });
});

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Phase 4 routes mounted:`);
    console.log(`   - GET  /api/v1/inventory`);
    console.log(`   - GET  /api/v1/recommendations`);
    console.log(`   - GET  /mobile/services`);
  });
});
