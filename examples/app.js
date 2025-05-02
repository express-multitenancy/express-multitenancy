const express = require('express');
const { multitenancy, HeaderStrategy, InMemoryStore } = require('../lib');

const app = express();

// Example 1: Using InMemoryStore
app.use(multitenancy({
  strategies: [ new HeaderStrategy('x-tenant-id') ],
  store: new InMemoryStore([
    { id: 'tenant1', name: 'Tenant 1' },
    { id: 'tenant2', name: 'Tenant 2' },
  ]),
}));

app.get('/', (req, res) => {
  const tenant = req.tenant;
  res.send(`Hello, ${tenant?.name}!`);
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
