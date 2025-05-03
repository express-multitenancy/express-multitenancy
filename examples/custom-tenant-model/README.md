# Custom Tenant Model Example

This example demonstrates how to implement multi-tenancy using a custom MongoDB tenant model with Mongoose.

## Concept

The MongooseStore with a custom tenant model allows you to:

1. Store tenant information in MongoDB
2. Extend the base tenant schema with custom fields
3. Use all MongoDB/Mongoose features for tenant management

## Benefits

- Persistent tenant storage
- Schema validation
- Custom tenant properties
- Scalability for many tenants
- Integration with existing MongoDB databases

## Example Explanation

This example shows:

1. Creating a custom tenant schema with additional fields
2. Setting up MongooseStore with the custom model
3. Seeding example tenant data
4. Accessing custom tenant properties in routes

## Prerequisites

- MongoDB installed and running

## Running the Example

```bash
# Install dependencies
npm install mongoose

# Make sure MongoDB is running
# Start MongoDB if it's not running: mongod

# Run the example
node examples/custom-tenant-model/app.js
```

Then test with:

```bash
# Get tenant greeting
curl -H "x-tenant-id: tenant1" http://localhost:3001/

# Get detailed tenant info (including custom fields)
curl -H "x-tenant-id: tenant1" http://localhost:3001/tenant-info
```

## Custom Tenant Model

The custom tenant model (`model.js`) extends the base tenant schema with additional fields:

```javascript
const customTenantSchema = new Schema({
  // Required fields from base Tenant interface
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  
  // Custom additional fields
  domain: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
```

## How It Works

1. When the application starts:
   - MongoDB connection is established
   - MongooseStore is initialized with the custom model
   - Optional tenant seeding is performed

2. When a request comes in with a tenant identifier:
   - The tenant ID is looked up in the MongoDB collection
   - The tenant object is attached to `req.tenant`

3. In your route handlers:
   - You can access both standard and custom fields via `req.tenant`
   - All fields from the MongoDB document are available

## Key Points

- Always include the required base fields (`id` and `name`)
- You can add any custom fields relevant to your application
- This approach is ideal for production applications
- Can be combined with any tenant identification strategy
