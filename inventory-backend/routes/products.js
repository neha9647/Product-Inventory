const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const { productName, specifications, category } = req.body;
    const product = new Product({
      productName: productName.trim(),
      specifications: specifications.trim(),
      category,
      dateAdded: new Date().toLocaleDateString('en-GB'),
      components: []
    });
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving product:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get a single product
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Fetch single product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a component to a product
router.post('/:productId/components', async (req, res) => {
  try {
    const { productId } = req.params;
    const component = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    component._id = new mongoose.Types.ObjectId();
    component.dateAdded = new Date().toLocaleDateString('en-GB');

    product.components.push(component);
    const saved = await product.save();
    res.json(saved);
  } catch (err) {
    console.error('Add component error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a component from a product
router.delete('/:productId/components/:componentId', async (req, res) => {
  try {
    const { productId, componentId } = req.params;

    console.log('🔧 Deleting component from product...');
    console.log('➡️ Product ID:', productId);
    console.log('➡️ Component ID:', componentId);

    const product = await Product.findById(productId);
    if (!product) {
      console.error('❌ Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentComponentIds = product.components.map(c => c._id.toString());
    console.log('🧩 Current component IDs:', currentComponentIds);

    const originalLength = product.components.length;
    product.components = product.components.filter(
      c => c._id.toString() !== componentId
    );

    if (product.components.length === originalLength) {
      console.warn('❌ Component not found in product');
      return res.status(404).json({ error: 'Component not found in product' });
    }

    const updatedProduct = await product.save();
    console.log('✅ Component deleted successfully');
    res.json(updatedProduct);
  } catch (err) {
    console.error('Delete component error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
