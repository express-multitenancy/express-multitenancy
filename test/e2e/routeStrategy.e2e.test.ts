import express, { Request, Response } from 'express';
import request from 'supertest';
import { multitenancy, RouteStrategy, InMemoryStore, Tenant } from '../../lib';

describe('RouteStrategy E2E Tests', () => {
  const app = express();

  // Sample tenants for testing
  const sampleTenants: Tenant[] = [
    { id: 'tenant1', name: 'Tenant 1' },
    { id: 'tenant2', name: 'Tenant 2' },
  ];

  // Setup middleware with route strategy for routes with tenantId parameter
  // Express 5 compatible approach: mount middleware separately on each route pattern
  app.use(
    '/api/tenants/:tenantId/*splat',
    multitenancy({
      strategies: [new RouteStrategy()],
      store: new InMemoryStore([...sampleTenants]),
    }),
  );

  app.use(
    '/api/organizations/:orgId/*splat',
    multitenancy({
      strategies: [new RouteStrategy('orgId')],
      store: new InMemoryStore([...sampleTenants]),
    }),
  );

  // Test route that returns tenant information
  app.get('/api/tenants/:tenantId/info', (req: Request, res: Response) => {
    res.json({
      tenant: req.tenant,
      hasTenant: !!req.tenant,
      params: req.params,
    });
  });

  // Test route with custom parameter name
  app.get('/api/organizations/:orgId/info', (req: Request, res: Response) => {
    res.json({
      tenant: req.tenant,
      hasTenant: !!req.tenant,
      params: req.params,
    });
  });

  it('should identify tenant from route parameter with default name', async () => {
    const response = await request(app).get('/api/tenants/tenant1/info').expect(200);

    expect(response.body.hasTenant).toBe(true);
    expect(response.body.tenant).toEqual(
      expect.objectContaining({
        id: 'tenant1',
        name: 'Tenant 1',
      }),
    );
    expect(response.body.params.tenantId).toBe('tenant1');
  });

  it('should identify tenant from route parameter with custom name', async () => {
    const response = await request(app).get('/api/organizations/tenant2/info').expect(200);

    expect(response.body.hasTenant).toBe(true);
    expect(response.body.tenant).toEqual(
      expect.objectContaining({
        id: 'tenant2',
        name: 'Tenant 2',
      }),
    );
    expect(response.body.params.orgId).toBe('tenant2');
  });

  it('should return null tenant when tenant ID is not found in store', async () => {
    const response = await request(app).get('/api/tenants/non-existent-tenant/info').expect(200);

    expect(response.body.hasTenant).toBe(false);
    expect(response.body.tenant).toBeNull();
    expect(response.body.params.tenantId).toBe('non-existent-tenant');
  });
});
