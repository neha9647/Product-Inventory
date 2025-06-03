const express = require('express');
const router = express.Router();
const Component = require('../models/Component');
const mongoose = require('mongoose');

// Get all components
router.get('/', async (req, res) => {
  try {
    const components = await Component.find().lean();
    res.json(components);
  } catch (err) {
    console.error('Error fetching components:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create component
router.post('/', async (req, res) => {
  try {
    const component = new Component(req.body);
    const saved = await component.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving component:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get single component
router.get('/:componentId', async (req, res) => {
  try {
    const { componentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(componentId)) {
      return res.status(400).json({ error: 'Invalid component ID' });
    }

    const component = await Component.findById(componentId);
    if (!component) return res.status(404).json({ error: 'Not found' });

    res.json(component);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update component
router.put('/:componentId', async (req, res) => {
  try {
    const { componentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(componentId)) {
      return res.status(400).json({ error: 'Invalid component ID' });
    }

    const updated = await Component.findByIdAndUpdate(
      componentId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Delete component
router.delete('/:componentId', async (req, res) => {
  try {
    const { componentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(componentId)) {
      return res.status(400).json({ error: 'Invalid component ID' });
    }

    const deleted = await Component.findByIdAndDelete(componentId);
    if (!deleted) return res.status(404).json({ error: 'Component not found' });
    res.json({ message: 'Deleted', component: deleted });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
