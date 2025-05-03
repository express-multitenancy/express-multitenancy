import { HeaderStrategy } from '../../lib';
import { Request } from 'express';

describe('HeaderStrategy', () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    // Initialize a fresh mock request for each test
    mockRequest = {
      headers: {},
    };
  });

  it('should extract tenant ID from default header', async () => {
    // Using default header name (x-tenant-id)
    const strategy = new HeaderStrategy();

    // Add header to request
    mockRequest.headers = {
      'x-tenant-id': 'tenant1',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('tenant1');
  });

  it('should extract tenant ID from custom header', async () => {
    const strategy = new HeaderStrategy('custom-tenant');

    mockRequest.headers = {
      'custom-tenant': 'tenant2',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('tenant2');
  });

  it('should handle case-insensitive header names', async () => {
    const strategy = new HeaderStrategy('Tenant-Header');

    mockRequest.headers = {
      'tenant-header': 'tenant3',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('tenant3');
  });

  it('should return null when header is not present', async () => {
    const strategy = new HeaderStrategy();

    // Empty headers
    mockRequest.headers = {};

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null when header value is empty', async () => {
    const strategy = new HeaderStrategy();

    mockRequest.headers = {
      'x-tenant-id': '',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });
});
