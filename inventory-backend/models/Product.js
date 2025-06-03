const mongoose = require('mongoose');

// Define schema for embedded components
const ComponentSchema = new mongoose.Schema({
  itemName: { type: String },
  component: { type: String },
  tolerance: { type: String },
  ppm: { type: String },
  package: { type: String },
  packageSize: { type: String },
  manuf: { type: String },
  sourceOrigin: { type: String },
  vendor: { type: String },
  stockQuantity: { type: Number },
  orderedQuantity: { type: Number },
  priceInr: { type: Number },
  dateAdded: { type: String }
}, { _id: true }); // Use embedded _id for each component

// Define the main product schema
const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  specifications: { type: String, required: true },
  category: { type: String, required: true },
  dateAdded: { type: String, required: true },
  components: [ComponentSchema]
}, {
  versionKey: false // remove __v
});

// Export the model
module.exports = mongoose.model('Product', ProductSchema);
