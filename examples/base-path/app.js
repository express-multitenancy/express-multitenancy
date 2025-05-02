const express = require('express');
const { multitenancy, BasePathStrategy, InMemoryStore } = require('../../lib');
const app = express();

// In-memory store for example
const store = new InMemoryStore([
  { id: 'tenant1', name: 'Tenant One' },
  { id: 'tenant2', name: 'Tenant Two' },
  { id: 'tenant3', name: 'Tenant Three' }
]);

// Base path strategy - extracts tenantId from the base path
app.use(multitenancy({
  strategies: [new BasePathStrategy({ rebasePath: true })],
  store
}));

// Example route
app.get('/tenant1/api/resource', (req, res) => {
  const tenant = req.tenant;
  res.json({
    message: `Hello, ${tenant?.name}!`,
    tenantId: req.params.tenantId,
    path: req.path,
    basePath: req.baseUrl,
  });
});

// Example route for tenant2
app.get('/tenant2/api/resource', (req, res) => {
  const tenant = req.tenant;
  res.json({
    message: `Hello, ${tenant?.name}!`,
    tenantId: req.params.tenantId,
    path: req.path,
    basePath: req.baseUrl,
  });
});


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});