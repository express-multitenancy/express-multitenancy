const express = require('express');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { multitenancy, ClaimStrategy, InMemoryStore } = require('../../lib');

const app = express();

// In-memory store for example
const store = new InMemoryStore([
  { id: 'tenant1', name: 'Tenant One' },
  { id: 'tenant2', name: 'Tenant Two' },
  { id: 'tenant3', name: 'Tenant Three with Nested Claim' }
]);

// EXAMPLE 1: Basic claim strategy - extracts tenantId from root claim
app.use('/api/basic', multitenancy({
  strategies: [new ClaimStrategy('tenantId', { debug: true })],
  store
}));

// EXAMPLE 2: Nested claim - extracts tenant from app_metadata.tenant_id
app.use('/api/nested', multitenancy({
  strategies: [new ClaimStrategy('app_metadata.tenant_id', { debug: true })],
  store
}));

// EXAMPLE 4: With Passport.js authentication
const JWT_SECRET = 'your-secret-key';

// Configure Passport JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
  // In real applications, you would validate the user from a database
  // For this example, we just accept any valid JWT payload
  return done(null, payload);
}));

// Initialize Passport
app.use(passport.initialize());


// First authenticate with passport, then use the tenant identification
app.use('/api/passport', 
  // Authenticate the user
  passport.authenticate('jwt', { session: false }),
  
  // Then set up tenant context from the authenticated user
  multitenancy({
    strategies: [
      // Extract tenantId from the user object that passport.js added to req
      new ClaimStrategy('tenantId', { 
        authExtractor: req => req.user,
        debug: true 
      })
    ],
    store
  })
);

// Sample API endpoint available under all strategy routes
const apiHandler = (req, res) => {
  if (!req.tenant) {
    return res.status(401).json({ 
      error: 'No tenant identified',
      help: 'Make sure you included a valid JWT with tenant information'
    });
  }
  
  res.json({
    message: `Hello from ${req.tenant.name}!`,
    tenant: req.tenant,
    path: req.path,
    user: req.user ? {
      // Return non-sensitive user data
      sub: req.user.sub,
      name: req.user.name
    } : null
  });
};

// Mount handler on all example paths
app.get('/api/basic/hello', apiHandler);
app.get('/api/nested/hello', apiHandler);
app.get('/api/passport/hello', apiHandler);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Claim strategy example running on http://localhost:${PORT}`);
  console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/passport/hello');
});
