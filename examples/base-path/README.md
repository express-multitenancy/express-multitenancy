# Base Path Strategy Example

This example demonstrates how to implement multi-tenancy using URL path-based tenant identification.

## Concept

The BasePathStrategy extracts the tenant identifier from the URL path. For example:
- `/tenant1/api/users` identifies the tenant as "tenant1"
- `/tenant2/api/users` identifies the tenant as "tenant2"

With the `rebasePath` option enabled, the tenant segment is removed from the path after identification, allowing you to define routes without duplicating them for each tenant.

## Benefits

- Clean, SEO-friendly URLs with tenant namespacing
- No special headers or tokens required
- Works well for SaaS applications with tenant-specific subdomains
- Simplified route definitions with `rebasePath`

## Example Explanation

The example demonstrates:

1. Setting up the BasePathStrategy with path rebasing
2. Handling routes across multiple tenants
3. Accessing tenant information in route handlers

## Running the Example

```bash
node examples/base-path/app.js
```

Then test with:

```bash
# Test tenant1
curl http://localhost:3000/tenant1/api/resource

# Test tenant2
curl http://localhost:3000/tenant2/api/resource

# Get tenant info
curl http://localhost:3000/tenant3/api/tenant-info
```

## How It Works

1. When a request comes in to `/tenant1/api/resource`:
   - The BasePathStrategy extracts "tenant1" as the tenant ID
   - It looks up the tenant in the store
   - With `rebasePath: true`, the path becomes `/api/resource` for route matching
   - The tenant object is attached to `req.tenant`

2. Your routes are defined without the tenant prefix, so `/api/resource` matches for all tenants.

3. In your route handlers, you can access `req.tenant` to get the current tenant context.

## Key Points

- The `rebasePath` option is crucial for route simplification
- The tenant info is still available via `req.tenant`
- You can still access the original URL via `req.originalUrl`
- Perfect for multi-tenant applications where each tenant needs its own "namespace"
