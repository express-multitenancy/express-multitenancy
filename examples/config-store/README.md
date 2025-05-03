# Config Store Example

This example demonstrates how to implement multi-tenancy using a JavaScript configuration file for tenant storage.

## Concept

The ConfigStore loads tenant information from a JavaScript file, which can be dynamically updated and reloaded. This approach is ideal for:

1. Applications with a relatively small number of tenants
2. Situations where tenant configuration doesn't change frequently
3. Development and testing environments

## Benefits

- Simple setup with no database required
- Configuration as code
- Support for hot-reloading when the config changes
- Ability to include custom tenant properties and logic
- Version control friendly

## Example Explanation

This example shows:

1. Setting up a ConfigStore with a JavaScript configuration file
2. Enabling file watching for automatic reloading
3. Accessing custom tenant properties
4. Getting a list of all tenants

## Running the Example

```bash
# Run the example
node examples/config-store/app.js
```

Then test with:

```bash
# List all available tenants
curl http://localhost:3001/tenants

# Access tenant-specific endpoint
curl -H "x-tenant-id: tenant1" http://localhost:3001/

# Try a different tenant
curl -H "x-tenant-id: tenant2" http://localhost:3001/
```

## Configuration File Format

The configuration file (`tenants.js`) is a JavaScript file that exports an object with a `tenants` array:

```javascript
module.exports = {
  tenants: [
    {
      id: 'tenant1',
      name: "Tenant 1 Company Name",
      // Custom properties
      customField: "Custom value 1",
      allowedDomains: ["tenant1.com", "t1.example.org"]
    },
    // More tenants...
  ],
  
  // Can include additional configuration or helper functions
  tenantSettings: {
    defaultRedirectUrl: "/dashboard"
  }
};
```

## How It Works

1. When the application starts:
   - ConfigStore loads the tenant configuration from the specified file
   - If `watchFile` is enabled, it sets up a watcher for file changes

2. When a request comes in with a tenant identifier:
   - The tenant ID is looked up in the loaded configuration
   - The tenant object is attached to `req.tenant`

3. If the configuration file changes:
   - The changes are automatically loaded
   - The `onReload` callback is triggered

## Key Points

- The `watchFile` option enables automatic reloading
- The configuration file provides flexibility for custom properties and logic
- Use this approach for simple applications or development/testing
- For production with many tenants, consider a database-backed store instead
