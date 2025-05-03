# Express Multitenancy

A flexible and powerful solution for implementing multi-tenancy in Express applications with MongoDB/Mongoose support.

## Features

- **Multiple tenant identification strategies**
  - Header-based tenant identification (included)
  - Easily extend with your own custom strategies
- **Flexible tenant storage options**
  - In-memory storage for development/testing
  - MongoDB storage for production use
  - Support for custom storage implementations
- **Mongoose integration**
  - Automatic tenant filtering for all queries
  - Transparent tenant ID assignment for new documents
  - Support for exempt models (global resources)
- **TypeScript support**
  - Full TypeScript type definitions
  - Generic support for custom tenant types

## Installation

```bash
npm install express-multitenancy
```

## Quick Start

```javascript
const express = require('express');
const mongoose = require('mongoose');
const { multitenancy, HeaderStrategy, MongooseStore } = require('express-multitenancy');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/multitenancy');

// Create a tenant store
const mongooseStore = new MongooseStore({
  connection: mongoose.connection
});

// Add sample tenants
(async () => {
  await mongooseStore.add({ id: 'tenant1', name: 'Tenant 1' });
  await mongooseStore.add({ id: 'tenant2', name: 'Tenant 2' });
})();

// Apply multitenancy middleware
app.use(multitenancy({
  strategies: [new HeaderStrategy('x-tenant-id')],
  store: mongooseStore,
}));

// Use tenant in routes
app.get('/', (req, res) => {
  res.send(`Hello, ${req.tenant?.name || 'Unknown Tenant'}!`);
});

app.listen(3000);
```

## API Reference

### Tenant Identification Strategies

#### HeaderStrategy

Identifies tenants based on an HTTP header.

```javascript
const { HeaderStrategy } = require('express-multitenancy');

// Create a strategy that looks for tenant ID in x-tenant-id header
const headerStrategy = new HeaderStrategy('x-tenant-id');
```

#### RouteStrategy

Identifies tenants based on route parameters.

```javascript
const { RouteStrategy } = require('express-multitenancy');

// Create a strategy that extracts tenant ID from 'tenantId' route parameter
const routeStrategy = new RouteStrategy(); 

// For Express 5 compatibility, mount the middleware on specific routes
app.use(['/api/:tenantId', '/api/:tenantId/*'], multitenancy({
  strategies: [routeStrategy],
  store: myStore
}));

// Or with a custom parameter name
const customRouteStrategy = new RouteStrategy('organizationId');
app.use(['/api/:organizationId', '/api/:organizationId/*'], multitenancy({
  strategies: [customRouteStrategy],
  store: myStore
}));
```

### Tenant Storage Providers

#### InMemoryStore

Stores tenants in memory. Useful for development or applications with a small fixed set of tenants.

```javascript
const { InMemoryStore } = require('express-multitenancy');

const store = new InMemoryStore([
  { id: 'tenant1', name: 'Tenant One' },
  { id: 'tenant2', name: 'Tenant Two' }
]);
```

#### MongooseStore

Stores tenants in MongoDB using Mongoose. Suitable for production applications.

```javascript
const { MongooseStore } = require('express-multitenancy');

// Basic usage with default schema
const store = new MongooseStore({
  connection: mongoose.connection,
  // Optional: custom model name (default: 'Tenant')
  modelName: 'Organization'
});

// Using a custom model
const store = new MongooseStore({
  connection: mongoose.connection,
  model: CustomTenantModel
});
```

### Mongoose Integration

#### multitenancyPlugin

Plugin that adds tenant filtering to Mongoose schemas.

```javascript
const { multitenancyPlugin } = require('express-multitenancy');

// Apply to specific schema
const userSchema = new mongoose.Schema({...});
userSchema.plugin(multitenancyPlugin);

// OR: Apply globally to all schemas
mongoose.plugin(multitenancyPlugin);
```

## Custom Tenant Types

You can extend the base `Tenant` interface to add custom properties:

```typescript
import { Tenant, InMemoryStore } from 'express-multitenancy';

// Custom tenant type
interface OrganizationTenant extends Tenant {
  domain: string;
  plan: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
}

// Use with generic type parameter
const store = new InMemoryStore<OrganizationTenant>([
  {
    id: 'org1',
    name: 'Acme, Inc.',
    domain: 'acme.com',
    plan: 'enterprise',
    createdAt: new Date()
  }
]);
```

## License

ISC
