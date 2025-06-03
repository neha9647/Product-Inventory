const mongoose = require('mongoose');

const ComponentSchema = new mongoose.Schema({
  slNo: Number,
  itemName: String,
  component: String,
  tolerance: String,
  ppm: String,
  package: String,
  packageSize: String,
  manuf: String,
  sourceOrigin: String,
  vendor: String,
  stockQuantity: Number,
  orderedQuantity: Number,
  priceInr: Number,
  lastUpdated: String
});

module.exports = mongoose.model('Component', ComponentSchema);
