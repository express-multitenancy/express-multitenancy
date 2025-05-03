const express = require('express');
const { multitenancy, RouteStrategy, InMemoryStore } = require('../../lib');

const app = express();

// In-memory store for example
const store = new InMemoryStore([
  { id: 'tenant1', name: 'Tenant One' },
  { id: 'tenant2', name: 'Tenant Two' },
  { id: 'tenant3', name: 'Tenant Three' },
]);

app.use(multitenancy({
    strategy: new RouteStrategy(),
    store,
  }),
);

// Define routes that will use the tenant context
app.get('/api/tenants/:tenantId/info', (req, res) => {
  if (!req.tenant) {
    return res.status(404).json({
      error: 'Tenant not found',
      message: `No tenant found with ID: ${req.params.tenantId}`,
    });
  }

  res.json({
    message: `Hello from ${req.tenant.name}!`,
    tenant: req.tenant,
    path: req.path,
  });
});

app.get('/api/organizations/:orgId/info', (req, res) => {
  if (!req.tenant) {
    return res.status(404).json({
      error: 'Organization not found',
      message: `No organization found with ID: ${req.params.orgId}`,
    });
  }

  res.json({
    message: `Hello from ${req.tenant.name}!`,
    tenant: req.tenant,
    path: req.path,
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Route strategy example running on http://localhost:${PORT}`);
  console.log('Try these endpoints:');
  console.log(`  http://localhost:${PORT}/api/tenants/tenant1/info`);
  console.log(`  http://localhost:${PORT}/api/organizations/tenant2/info`);
});
