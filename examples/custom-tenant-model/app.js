const express = require('express');
const mongoose = require('mongoose');
const { multitenancy, HeaderStrategy, MongooseStore, InMemoryStore } = require('../../lib');
const CustomTenantModel = require('./model');

const app = express();
app.use(express.json());

// Apply multitenancy middleware with in-memory store
// app.use(multitenancy({
//   strategies: [new HeaderStrategy('x-tenant-id')],
//   store: new InMemoryStore([
//     { id: 'tenant1', name: 'Tenant 1', domain: 'tenant1.example.com', isActive: true, createdAt: new Date() },
//     { id: 'tenant2', name: 'Tenant 2', domain: 'tenant2.example.com', isActive: true, createdAt: new Date() },
//   ]),
// }));

// MongoDB version (uncomment to use)

mongoose.connect('mongodb://localhost:27017/multitenancy-custom')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const mongooseStore = new MongooseStore({
  connection: mongoose.connection,
  model: CustomTenantModel
});

// Seed some example tenants
// async function seedTenants() {
//   const count = await CustomTenantModel.countDocuments();
//   if (count === 0) {
//     await mongooseStore.add({ 
//       id: 'tenant1', 
//       name: 'Tenant 1', 
//       domain: 'tenant1.example.com',
//       isActive: true,
//       createdAt: new Date()
//     });
    
//     await mongooseStore.add({ 
//       id: 'tenant2', 
//       name: 'Tenant 2', 
//       domain: 'tenant2.example.com',
//       isActive: true,
//       createdAt: new Date()
//     });
    
//     console.log('Example tenants created');
//   }
// }

// seedTenants().catch(console.error);

app.use(multitenancy({
  strategies: [new HeaderStrategy('x-tenant-id')],
  store: mongooseStore,
}));

// Routes
app.get('/', (req, res) => {
  const tenant = req.tenant;
  res.send(`Hello, ${tenant?.name}! (Using custom tenant model)`);
});

app.get('/tenant-info', (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({ error: 'No tenant context found' });
  }
  // Fetch the full tenant info with custom fields
  res.json(req.tenant);
});

app.listen(3001, () => {
  console.log('Custom tenant example running on http://localhost:3001');
});
