const express = require('express');
const { multitenancy, HeaderStrategy, ConfigStore } = require('../../lib');
const path = require('path');

// Create an Express application
const app = express();

/**
 * Create a config-based tenant store using the JS configuration file
 * 
 * Benefits:
 * - Configuration is stored in a JavaScript file for easy editing
 * - File watching enabled for automatic reloading
 * - Can contain custom tenant properties and logic
 */
const store = new ConfigStore({
  configPath: path.join(__dirname, 'tenants.js'),
  watchFile: true, // Automatically reload when config file changes
  onReload: () => console.log('Tenant configuration reloaded!')
});

// Set up the tenancy middleware with a default header-based strategy
app.use(multitenancy({
  strategies: [new HeaderStrategy()], // Uses default header 'x-tenant-id'
  store,
}));

// Define a route that uses the tenant information
app.get('/', (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'No tenant specified',
      message: 'Please provide a tenant ID using the x-tenant-id header'
    });
  }
  
  res.json({
    message: `Welcome to ${req.tenant.name}!`,
    tenant: req.tenant
  });
});

// Define a route to see all available tenants
app.get('/tenants', async (req, res) => {
  const tenants = await store.getAll();
  res.json({
    count: tenants.length,
    tenants
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Try: curl -H "x-tenant-id: <tenant-id>" http://localhost:${PORT}/`);
  console.log(`To see all tenants: curl http://localhost:${PORT}/tenants`);
});