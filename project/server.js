const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory (Front-end)
app.use(express.static(__dirname));

// Helper function to read DB
const readDB = () => {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

// Helper function to write DB
const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- API ENDPOINTS --- //

// Get all products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Add a new product
app.post('/api/products', (req, res) => {
  const db = readDB();
  const newProduct = {
    id: Date.now(),
    ...req.body
  };
  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  const db = readDB();
  const productId = parseInt(req.params.id);
  db.products = db.products.filter(p => p.id !== productId);
  writeDB(db);
  res.json({ message: 'Product deleted successfully' });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// Start the server
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Cartify Backend running on http://localhost:${PORT}`);
  console.log(`📁 API Endpoints:`);
  console.log(`   - GET  /api/products`);
  console.log(`   - POST /api/products`);
  console.log(`   - GET  /api/orders`);
  console.log(`===========================================`);
});
