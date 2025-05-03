# JWT Claim Strategy Example

This example demonstrates how to implement multi-tenancy using JWT token claims.

## Concept

The ClaimStrategy extracts the tenant identifier from JWT token claims. This approach is ideal when:

1. You already use JWTs for authentication
2. Your tokens contain tenant information
3. You want to combine authentication and tenant identification

## Benefits

- Single source of truth (the JWT token)
- Seamless integration with auth systems like Auth0, Okta, Firebase, etc.
- Support for nested properties in claims
- Works well with existing authentication middleware

## Example Explanation

This example shows three different ways to use ClaimStrategy:

1. **Basic Claim**: Extracts tenant ID from a root-level property in the JWT
2. **Nested Claim**: Extracts tenant ID from a nested property path
3. **Passport.js Integration**: Shows how to combine authentication with tenant identification

## Running the Example

```bash
# Install dependencies
npm install passport passport-jwt jsonwebtoken

# Run the example
node examples/claim-strategy/app.js
```

To test the example, you need to create valid JWT tokens. Here's a quick way using Node.js:

```javascript
const jwt = require('jsonwebtoken');

// For basic claim example (tenant ID at root level)
const basicToken = jwt.sign(
  { sub: 'user123', name: 'Test User', tenantId: 'tenant1' },
  'your-secret-key'
);

// For nested claim example (tenant ID in nested property)
const nestedToken = jwt.sign(
  { 
    sub: 'user456', 
    name: 'Test User 2',
    app_metadata: { 
      tenant_id: 'tenant3' 
    }
  },
  'your-secret-key'
);

console.log('Basic token:', basicToken);
console.log('Nested token:', nestedToken);
```

Then use these tokens in your requests:

```bash
# Test basic claim
curl -H "Authorization: Bearer YOUR_BASIC_TOKEN" http://localhost:3000/api/basic/hello

# Test nested claim
curl -H "Authorization: Bearer YOUR_NESTED_TOKEN" http://localhost:3000/api/nested/hello

# Test with passport.js
curl -H "Authorization: Bearer YOUR_BASIC_TOKEN" http://localhost:3000/api/passport/hello
```

## How It Works

1. When a request comes in with a JWT in the Authorization header:
   - The JWT is verified and decoded
   - ClaimStrategy extracts the tenant ID using the specified property path
   - It looks up the tenant in the store
   - The tenant object is attached to `req.tenant`

2. In your route handlers, you can access `req.tenant` to get the current tenant context.

## Key Points

- The `debug` option helps with troubleshooting
- The `authExtractor` option lets you customize where to get the JWT data
- Works with many authentication systems
- Supports dot notation for accessing nested properties
