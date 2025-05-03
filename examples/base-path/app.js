const express = require('express');
const { multitenancy, BasePathStrategy, InMemoryStore } = require('../../lib');
const app = express();

/**
 * In-memory tenant store for demonstration
 * Contains three sample tenants that will be available via path-based URLs
 */
const store = new InMemoryStore([
  { id: 'tenant1', name: 'Tenant One' },
  { id: 'tenant2', name: 'Tenant Two' },
  { id: 'tenant3', name: 'Tenant Three' }
]);

/**
 * Base path strategy configuration
 * 
 * The BasePathStrategy extracts the tenant identifier from the URL path
 * 
 * rebasePath: true - removes the tenant part from req.path after identification
 * This lets you define routes without the tenant prefix
 */
app.use(multitenancy({
  strategies: [new BasePathStrategy({ rebasePath: true })],
  store
}));

/**
 * These routes will be available to any tenant
 * The tenant segment is removed from the path when matching routes
 * So '/tenant1/api/resource' and '/tenant2/api/resource' both match this route
 */
app.get('/api/resource', (req, res) => {
  const tenant = req.tenant;
  res.json({
    message: `Hello, ${tenant?.name}!`,
    path: req.path,
    originalUrl: req.originalUrl,
    basePath: req.baseUrl,
  });
});

/**
 * This route demonstrates how to access raw tenant ID from URL
 * Even though the tenant segment is removed from the path for routing,
 * you can still access the original URL with req.originalUrl
 */
app.get('/api/tenant-info', (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'No tenant context found',
      message: 'Request not made through a valid tenant path'
    });
  }
  
  res.json({
    tenant: req.tenant,
    originalUrl: req.originalUrl
  });
});

/**
 * Route that works for all tenants - demonstrates how rebasePath simplifies routing
 * Without rebasePath, you would need separate routes for each tenant
 */
app.get('/api/users', (req, res) => {
  // In a real app, you would filter data based on tenant ID
  const tenant = req.tenant;
  res.json({
    tenant: tenant.name,
    users: [`${tenant.id}-user1`, `${tenant.id}-user2`]
  });
});

app.listen(3000, () => {
  console.log('BasePathStrategy example running on http://localhost:3000');
  console.log('Try:');
  console.log('  curl http://localhost:3000/tenant1/api/resource');
  console.log('  curl http://localhost:3000/tenant2/api/resource');
  console.log('  curl http://localhost:3000/tenant3/api/tenant-info');
});