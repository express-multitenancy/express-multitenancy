const mongoose = require('mongoose');
const { Schema } = mongoose;

// Create custom tenant schema
const customTenantSchema = new Schema({
  // Required fields from base Tenant interface
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  
  // Custom additional fields
  domain: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Create and export the custom tenant model
const CustomTenantModel = mongoose.model('CustomTenant', customTenantSchema);
module.exports = CustomTenantModel;
