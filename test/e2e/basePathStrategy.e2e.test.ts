import express, { Request, Response } from 'express';
import request from 'supertest';
import { multitenancy, BasePathStrategy, InMemoryStore, Tenant } from '../../lib';

// Extend Express Request to include tenant property
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant: Tenant | null;
    }
  }
}

describe('BasePathStrategy E2E Tests', () => {
  // Sample tenants for testing
  const sampleTenants: Tenant[] = [
    { id: 'tenant1', name: 'Tenant 1' },
    { id: 'tenant2', name: 'Tenant 2' },
    { id: 'admin', name: 'Admin Tenant' },
  ];

  describe('Default Configuration', () => {
    const app = express();

    // Setup middleware with default base path strategy
    app.use(
      multitenancy({
        strategies: [new BasePathStrategy()],
        store: new InMemoryStore([...sampleTenants]),
      }),
    );

    // Test route that returns tenant information
    app.get('/*splat', (req: Request, res: Response) => {
      res.json({
        tenant: req.tenant,
        hasTenant: !!req.tenant,
        path: req.path,
      });
    });

    it('should identify tenant from first path segment', async () => {
      const response = await request(app).get('/tenant1/api/resource').expect(200);

      expect(response.body.hasTenant).toBe(true);
      expect(response.body.tenant).toEqual(
        expect.objectContaining({
          id: 'tenant1',
          name: 'Tenant 1',
        }),
      );
      expect(response.body.path).toBe('/tenant1/api/resource');
    });

    it('should return null tenant when first path segment is not found in store', async () => {
      const response = await request(app).get('/unknown-tenant/api/resource').expect(200);

      expect(response.body.hasTenant).toBe(false);
      expect(response.body.tenant).toBeNull();
    });
  });

  describe('With Path Rebasing', () => {
    const app = express();

    // Setup middleware with path rebasing enabled
    app.use(
      multitenancy({
        strategies: [new BasePathStrategy({ rebasePath: true })],
        store: new InMemoryStore([...sampleTenants]),
      }),
    );

    // Use a more specific path pattern instead of wildcard to avoid path-to-regexp issues
    app.get('/api/resource', (req: Request, res: Response) => {
      res.json({
        tenant: req.tenant,
        hasTenant: !!req.tenant,
        path: req.path,
        originalUrl: req.originalUrl,
      });
    });

    // Add a separate route for the root path
    app.get('/', (req: Request, res: Response) => {
      res.json({
        tenant: req.tenant,
        hasTenant: !!req.tenant,
        path: req.path,
        originalUrl: req.originalUrl,
      });
    });

    // Add a catch-all route for any other path
    app.get('*splat', (req: Request, res: Response) => {
      res.json({
        tenant: req.tenant,
        hasTenant: !!req.tenant,
        path: req.path,
        originalUrl: req.originalUrl,
      });
    });

    it('should identify tenant and rebase path', async () => {
      const response = await request(app).get('/tenant2/api/resource').expect(200);

      expect(response.body.hasTenant).toBe(true);
      expect(response.body.tenant).toEqual(
        expect.objectContaining({
          id: 'tenant2',
          name: 'Tenant 2',
        }),
      );
      expect(response.body.path).toBe('/api/resource');
      expect(response.body.originalUrl).toBe('/api/resource');
    });
  });

  describe('With Custom Position', () => {
    const app = express();

    // Setup middleware with custom path position
    app.use(
      multitenancy({
        strategies: [new BasePathStrategy({ position: 2 })],
        store: new InMemoryStore([...sampleTenants]),
      }),
    );

    // Test route that returns tenant information
    app.get('/*splat', (req: Request, res: Response) => {
      res.json({
        tenant: req.tenant,
        hasTenant: !!req.tenant,
        path: req.path,
      });
    });

    it('should identify tenant from second path segment', async () => {
      const response = await request(app).get('/api/tenant1/resource').expect(200);

      expect(response.body.hasTenant).toBe(true);
      expect(response.body.tenant).toEqual(
        expect.objectContaining({
          id: 'tenant1',
          name: 'Tenant 1',
        }),
      );
    });

    it('should return null tenant when path segment at position is not found', async () => {
      const response = await request(app).get('/api/unknown-tenant/resource').expect(200);

      expect(response.body.hasTenant).toBe(false);
      expect(response.body.tenant).toBeNull();
    });
  });
});
