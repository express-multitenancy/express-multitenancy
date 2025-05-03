import express, { Request, Response } from 'express';
import request from 'supertest';
import { multitenancy, HeaderStrategy, InMemoryStore, Tenant } from '../../lib';

describe('HeaderStrategy E2E Tests', () => {
  const app = express();

  // Sample tenants for testing
  const sampleTenants: Tenant[] = [
    { id: 'tenant1', name: 'Tenant 1' },
    { id: 'tenant2', name: 'Tenant 2' },
  ];

  // Setup middleware with header strategy
  app.use(
    multitenancy({
      strategies: [new HeaderStrategy('x-tenant-id')],
      store: new InMemoryStore([...sampleTenants]),
    }),
  );

  // Test route that returns tenant information
  app.get('/api/tenant-info', (req: Request, res: Response) => {
    res.json({
      tenant: req.tenant,
      hasTenant: !!req.tenant,
    });
  });

  it('should identify tenant from header', async () => {
    const response = await request(app)
      .get('/api/tenant-info')
      .set('x-tenant-id', 'tenant1')
      .expect(200);

    expect(response.body.hasTenant).toBe(true);
    expect(response.body.tenant).toEqual(
      expect.objectContaining({
        id: 'tenant1',
        name: 'Tenant 1',
      }),
    );
  });

  it('should return null tenant when header is missing', async () => {
    const response = await request(app).get('/api/tenant-info').expect(200);

    expect(response.body.hasTenant).toBe(false);
    expect(response.body.tenant).toBeNull();
  });

  it('should return null tenant when tenant ID is not found in store', async () => {
    const response = await request(app)
      .get('/api/tenant-info')
      .set('x-tenant-id', 'non-existent-tenant')
      .expect(200);

    expect(response.body.hasTenant).toBe(false);
    expect(response.body.tenant).toBeNull();
  });
});
