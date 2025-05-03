import { HostStrategy } from '../../lib';
import { Request } from 'express';

describe('HostStrategy', () => {
  // Create a mock request class with writable hostname property
  class MockRequest {
    hostname?: string;
  }

  let mockRequest: MockRequest;

  beforeEach(() => {
    // Initialize a fresh mock request for each test
    mockRequest = new MockRequest();
  });

  it('should extract tenant ID from subdomain', async () => {
    const strategy = new HostStrategy(/^([^.]+)/); // Match first segment before dot

    mockRequest.hostname = 'tenant1.example.com';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBe('tenant1');
  });

  it('should extract tenant ID using custom regex pattern', async () => {
    // Pattern to extract "tenant2" from "app-tenant2-env.example.com"
    const strategy = new HostStrategy(/app-([^-]+)-env/);

    mockRequest.hostname = 'app-tenant2-env.example.com';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBe('tenant2');
  });

  it('should return null when hostname is not present', async () => {
    const strategy = new HostStrategy(/^([^.]+)/);

    // No hostname property
    mockRequest.hostname = undefined;

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null when pattern does not match', async () => {
    const strategy = new HostStrategy(/tenant-([a-z0-9]+)/);

    mockRequest.hostname = 'example.com'; // No "tenant-" prefix

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null when regex has no capture group', async () => {
    // Regex with no capturing group
    const strategy = new HostStrategy(/example\.com/);

    mockRequest.hostname = 'example.com';

    const tenantId = await strategy.resolveTenantId(mockRequest as unknown as Request);
    expect(tenantId).toBeNull();
  });
});
