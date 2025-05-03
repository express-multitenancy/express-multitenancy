import { BasePathStrategy } from '../../lib';
import { Request } from 'express';

describe('BasePathStrategy', () => {
  // Use a class to mock the request with writable path and originalUrl
  class MockRequest {
    path: string;
    originalUrl: string;

    constructor(path: string = '', originalUrl: string = '') {
      this.path = path;
      this.originalUrl = originalUrl;
    }
  }

  let mockRequest: MockRequest;

  beforeEach(() => {
    // Initialize a fresh mock request for each test
    mockRequest = new MockRequest();
  });

  it('should extract tenant ID from the first path segment by default', async () => {
    const strategy = new BasePathStrategy();

    mockRequest.path = '/tenant1/api/resources';
    mockRequest.originalUrl = 'http://example.com/tenant1/api/resources';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBe('tenant1');
  });

  it('should extract tenant ID from custom position in path', async () => {
    const strategy = new BasePathStrategy({ position: 2 });

    mockRequest.path = '/api/tenant2/resources';
    mockRequest.originalUrl = 'http://example.com/api/tenant2/resources';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBe('tenant2');
  });

  it('should rebase the path when configured', async () => {
    const strategy = new BasePathStrategy({ rebasePath: true });

    mockRequest.path = '/tenant3/api/resources';
    mockRequest.originalUrl = 'http://example.com/tenant3/api/resources';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);

    // Check tenant ID is extracted
    expect(tenantId).toBe('tenant3');

    // Check path is rebased (tenant segment removed)
    expect(mockRequest.path).toBe('/api/resources');
    expect(mockRequest.originalUrl).toBe('http://example.com/api/resources');
  });

  it('should rebase the path using custom position when configured', async () => {
    const strategy = new BasePathStrategy({ position: 2, rebasePath: true });

    mockRequest.path = '/api/tenant4/resources';
    mockRequest.originalUrl = 'http://example.com/api/tenant4/resources';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);

    // Check tenant ID is extracted
    expect(tenantId).toBe('tenant4');

    // Check path is rebased (tenant segment removed)
    expect(mockRequest.path).toBe('/api/resources');
    expect(mockRequest.originalUrl).toBe('http://example.com/api/resources');
  });

  it('should handle root path correctly', async () => {
    const strategy = new BasePathStrategy();

    mockRequest.path = '/';
    mockRequest.originalUrl = 'http://example.com/';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null when path segment at specified position does not exist', async () => {
    const strategy = new BasePathStrategy({ position: 3 });

    mockRequest.path = '/api/resources'; // Only two segments
    mockRequest.originalUrl = 'http://example.com/api/resources';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBeNull();
  });

  it('should handle path with trailing slash', async () => {
    const strategy = new BasePathStrategy();

    mockRequest.path = '/tenant5/';
    mockRequest.originalUrl = 'http://example.com/tenant5/';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBe('tenant5');
  });
});
