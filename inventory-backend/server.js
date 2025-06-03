require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection string - use environment variable or default
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

// Connect to MongoDB with error handling
mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);  // Exit if cannot connect to database
  });

// Error handling for MongoDB connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Import routes
const productRoutes = require('./routes/products');
const componentRoutes = require('./routes/components');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/auth', authRoutes);
console.log('✅ Routes loaded:');
console.log('products.js:', require('./routes/products'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Unique root route
app.get('/', (req, res) => {
  res.json({ message: 'Inventory Backend is running' });
});

app.post('/test', (req, res) => {
  res.json({ message: '✅ Test route reached!' });
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
