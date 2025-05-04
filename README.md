# Express Multitenancy

<div align="center">
  
[![Build Status](https://img.shields.io/github/actions/workflow/status/express-multitenancy/express-multitenancy/main.yml)](https://github.com/express-multitenancy/express-multitenancy/actions/workflows/main.yml)
![Version](https://img.shields.io/npm/v/express-multitenancy)
![License](https://img.shields.io/npm/l/express-multitenancy)
![Downloads](https://img.shields.io/npm/dm/express-multitenancy)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
  
**A powerful, flexible solution for implementing multi-tenancy in Express applications**
  
[Getting Started](#getting-started) •
[Features](#features) •
[Installation](#installation) •
[Usage](#usage) •
[API Reference](#api-reference) •
[Examples](#examples) •
[License](#license)
  
</div>

## 🌟 Overview

Express Multitenancy is a robust middleware that simplifies building multi-tenant applications with Express. It provides various strategies for tenant identification and storage, making your SaaS application development faster and more maintainable.

## ✨ Features

- **🔑 Multiple Tenant Identification Strategies**
  - Header-based identification
  - Route parameter identification
  - Path-based identification
  - JWT claim-based identification
  - Support for custom identification strategies
  
- **💾 Flexible Tenant Storage**
  - In-memory storage for development
  - File-based configuration store
  - Easily extendable for custom storage solutions
  
- **🔧 Custom Tenant Types**
  - Extend the base `Tenant` interface
  - Add custom properties to tenant objects
  - Full TypeScript support with generics
  
- **🚀 Optimized for Performance**
  - Minimal overhead
  - Efficient tenant resolution
  - Caching support

## 📦 Installation

```bash
# Using npm
npm install express-multitenancy

# Using yarn
yarn add express-multitenancy

# Using pnpm
pnpm add express-multitenancy
```

## 🚀 Getting Started

```javascript
const express = require('express');
const { multitenancy, HeaderStrategy, InMemoryStore } = require('express-multitenancy');

const app = express();

// Create a simple in-memory tenant store
const store = new InMemoryStore([
  { id: 'tenant1', name: 'Tenant One' },
  { id: 'tenant2', name: 'Tenant Two' }
]);

// Configure multitenancy middleware
app.use(multitenancy({
  strategies: [new HeaderStrategy('x-tenant-id')],
  store: store
}));

// Use tenant information in your routes
app.get('/', (req, res) => {
  res.send(`Hello, ${req.tenant?.name || 'Unknown Tenant'}!`);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

## 📖 API Reference

### Tenant Identification Strategies

Express Multitenancy includes several built-in strategies for identifying tenants:

#### HeaderStrategy

Identifies tenants based on an HTTP header value.

```javascript
const { HeaderStrategy } = require('express-multitenancy');

// Use the default header name (x-tenant-id)
const headerStrategy = new HeaderStrategy();

// Or specify a custom header name
const customHeaderStrategy = new HeaderStrategy('x-organization-id');
```

#### RouteStrategy

Extracts tenant ID from route parameters.

```javascript
const { RouteStrategy } = require('express-multitenancy');

// Extract from :tenantId parameter (default)
const routeStrategy = new RouteStrategy();

// Or specify a custom parameter name
const customRouteStrategy = new RouteStrategy('organizationId');

// Mount the middleware on routes with the parameter
app.use('/api/:tenantId/*', multitenancy({
  strategies: [routeStrategy],
  store: store
}));
```

#### BasePathStrategy

Identifies tenants from the URL path and optionally rebases the path.

```javascript
const { BasePathStrategy } = require('express-multitenancy');

// Create strategy that extracts tenant from the first path segment
const pathStrategy = new BasePathStrategy({
  rebasePath: true // Remove tenant segment from URL for route matching
});

app.use(multitenancy({
  strategies: [pathStrategy],
  store: store
}));

// Now /tenant1/users will identify tenant1 and match the /users route
app.get('/users', (req, res) => {
  res.send(`Users for ${req.tenant.name}`);
});
```

#### ClaimStrategy

Extracts tenant information from JWT tokens or other authentication claims.

```javascript
const { ClaimStrategy } = require('express-multitenancy');

// Basic usage with default claim name (tenantId)
const claimStrategy = new ClaimStrategy();

// With custom claim path and function to extract claims
const customClaimStrategy = new ClaimStrategy({
  claimPath: 'organization.id',
  extractClaims: (req) => req.user // Get claims from req.user (e.g., Passport.js)
});
```

### Tenant Storage Providers

#### InMemoryStore

Stores tenants in memory. Perfect for development or applications with a small set of tenants.

```javascript
const { InMemoryStore } = require('express-multitenancy');

// Initialize with predefined tenants
const store = new InMemoryStore([
  { id: 'tenant1', name: 'Tenant One' },
  { id: 'tenant2', name: 'Tenant Two' }
]);

// Add a tenant dynamically
store.add({ id: 'tenant3', name: 'Tenant Three' });

// Get a tenant by ID
store.get('tenant1').then(tenant => console.log(tenant));

// List all tenants
store.list().then(tenants => console.log(tenants));
```

#### ConfigStore

Store tenants in a JavaScript/JSON configuration file.

```javascript
const { ConfigStore } = require('express-multitenancy');

// Basic usage with default options
const configStore = new ConfigStore('./tenant-config.js');

// With file watching for auto-reloading
const watchingStore = new ConfigStore('./tenant-config.js', { 
  watch: true,
  watchInterval: 5000 // Check for changes every 5 seconds
});
```

## 📚 Custom Tenant Types

TypeScript users can extend the base `Tenant` interface to add custom properties:

```typescript
import { Tenant, InMemoryStore } from 'express-multitenancy';

// Define custom tenant type
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

// Access custom properties in routes
app.get('/plan', (req, res) => {
  const tenant = req.tenant as OrganizationTenant;
  res.send(`Your plan: ${tenant.plan}`);
});
```

## 🔍 Examples

Check out the examples directory for complete working examples:

- Basic tenant identification with headers
- Path-based tenant identification 
- JWT/claim-based tenant identification
- File-based tenant configuration
- Custom tenant models

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/zahidcakici">Zahid Cakici</a></sub>
</div>
