# Express Multitenancy Examples

This directory contains examples demonstrating various ways to implement multi-tenancy in an Express.js application.

## Example Overview

### 1. Basic Example (`/examples/app.js`)
- Simple implementation using a header-based strategy
- In-memory tenant storage
- Good starting point for understanding the basics

### 2. Base Path Strategy (`/examples/base-path/`)
- URL path-based tenant identification
- Automatic path rebasing for simpler route definitions
- Perfect for applications with tenant-specific subpaths

### 3. Claim Strategy (`/examples/claim-strategy/`)
- JWT/token-based tenant identification
- Extracts tenant info from authentication tokens
- Integration with Passport.js
- Supports nested properties in claims

### 4. Config Store (`/examples/config-store/`)
- File-based tenant configuration
- Auto-reloads when config changes
- Supports custom tenant properties

### 5. Custom Tenant Model (`/examples/custom-tenant-model/`)
- MongoDB integration with custom tenant model
- Demonstrates how to extend the base tenant schema
- Shows database-backed tenant storage

## Getting Started

### Prerequisites

To run these examples, you need:

- Node.js 12+ installed
- MongoDB installed (for database examples)
- npm or yarn package manager

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. For MongoDB examples, make sure MongoDB is running:

```bash
# Start MongoDB if it's not running
mongod
```

### Running Examples

Each example can be run directly:

```bash
# Basic example
node examples/app.js

# Base path example
node examples/base-path/app.js

# Claim strategy example
node examples/claim-strategy/app.js

# Config store example
node examples/config-store/app.js

# Custom tenant model example
node examples/custom-tenant-model/app.js
```

## Package.json Dependencies

For the examples to work correctly, ensure you have these dependencies in your package.json:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^6.8.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1"
  }
}
```

## Examples in Detail

Each example directory contains additional documentation explaining the specific multi-tenancy approach used. Check the README files in each subdirectory for more details.
