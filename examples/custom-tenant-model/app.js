const express = require('express');
const mongoose = require('mongoose');
const { multitenancy, HeaderStrategy, MongooseStore, InMemoryStore } = require('../../lib');
const CustomTenantModel = require('./model');

const app = express();
app.use(express.json());

/**
 * This example demonstrates using a custom tenant model with MongoDB
 * The custom model extends the base tenant schema with additional fields
 * 
 * You can switch between in-memory and MongoDB storage by commenting/uncommenting the sections
 */

// --------------------------------------------------------------
// Option 1: In-memory store (for testing/development)
// --------------------------------------------------------------
// app.use(multitenancy({
//   strategies: [new HeaderStrategy('x-tenant-id')],
//   store: new InMemoryStore([
//     { id: 'tenant1', name: 'Tenant 1', domain: 'tenant1.example.com', isActive: true, createdAt: new Date() },
//     { id: 'tenant2', name: 'Tenant 2', domain: 'tenant2.example.com', isActive: true, createdAt: new Date() },
//   ]),
// }));

// --------------------------------------------------------------
// Option 2: MongoDB with custom tenant model
// --------------------------------------------------------------

/**
 * Connect to MongoDB
 * In production, you would use environment variables for connection string
 */
mongoose.connect('mongodb://localhost:27017/multitenancy-custom')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

/**
 * Initialize the MongooseStore with our custom tenant model
 * This allows us to use all the custom fields we defined
 */
const mongooseStore = new MongooseStore({
  connection: mongoose.connection,
  model: CustomTenantModel
});

/**
 * Seed tenant data if database is empty
 * Useful for demo/development purposes
 */
async function seedTenants() {
  const count = await CustomTenantModel.countDocuments();
  if (count === 0) {
    await mongooseStore.add({ 
      id: 'tenant1', 
      name: 'Tenant 1', 
      domain: 'tenant1.example.com',
      isActive: true,
      createdAt: new Date()
    });
    
    await mongooseStore.add({ 
      id: 'tenant2', 
      name: 'Tenant 2', 
      domain: 'tenant2.example.com',
      isActive: true,
      createdAt: new Date()
    });
    
    console.log('Example tenants created');
  }
}

// Seed the database with initial tenants
seedTenants().catch(console.error);

/**
 * Apply multitenancy middleware using the MongoDB store
 * This injects the tenant context into each request
 */
app.use(multitenancy({
  strategies: [new HeaderStrategy('x-tenant-id')],
  store: mongooseStore,
}));

// Routes
app.get('/', (req, res) => {
  const tenant = req.tenant;
  res.send(`Hello, ${tenant?.name}! (Using custom tenant model)`);
});

/**
 * This route demonstrates accessing the full tenant object
 * including custom fields like domain and isActive
 */
app.get('/tenant-info', (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({ error: 'No tenant context found' });
  }
  // Fetch the full tenant info with custom fields
  res.json(req.tenant);
});

app.listen(3001, () => {
  console.log('Custom tenant example running on http://localhost:3001');
  console.log('Try:');
  console.log('  curl -H "x-tenant-id: tenant1" http://localhost:3001/');
  console.log('  curl -H "x-tenant-id: tenant1" http://localhost:3001/tenant-info');
});
