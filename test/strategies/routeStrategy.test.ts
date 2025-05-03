import { RouteStrategy } from '../../lib';
import { Request } from 'express';

describe('RouteStrategy', () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    // Initialize a fresh mock request for each test
    mockRequest = {
      params: {},
    };
  });

  it('should extract tenant ID from default parameter name', async () => {
    // Using default parameter name (tenantId)
    const strategy = new RouteStrategy();

    mockRequest.params = {
      tenantId: 'tenant1',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('tenant1');
  });

  it('should extract tenant ID from custom parameter name', async () => {
    const strategy = new RouteStrategy('orgId');

    mockRequest.params = {
      orgId: 'org123',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('org123');
  });

  it('should return null when params object is not present', async () => {
    const strategy = new RouteStrategy();

    // No params object
    mockRequest.params = undefined;

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null when parameter is not present', async () => {
    const strategy = new RouteStrategy('tenantId');

    // Different parameter name in the request
    mockRequest.params = {
      userId: 'user123',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null when parameter value is empty', async () => {
    const strategy = new RouteStrategy();

    mockRequest.params = {
      tenantId: '',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });
});
