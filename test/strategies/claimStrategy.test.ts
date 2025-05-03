import { AuthPayload, ClaimStrategy } from '../../lib';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

// Extend the Express Request type to include the user property
declare module 'express' {
  interface Request {
    user?: AuthPayload | null;
  }
}

describe('ClaimStrategy', () => {
  let mockRequest: Partial<Request>;
  const JWT_SECRET = 'test-secret';

  beforeEach(() => {
    // Initialize a fresh mock request for each test
    mockRequest = {
      headers: {},
    };
  });

  function createToken(payload: Record<string, unknown>) {
    return jwt.sign(payload, JWT_SECRET);
  }

  it('should extract tenant ID from root claim', async () => {
    const strategy = new ClaimStrategy('tenantId');

    const token = createToken({ tenantId: 'tenant1' });
    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('tenant1');
  });

  it('should extract tenant ID from nested claim', async () => {
    const strategy = new ClaimStrategy('app_metadata.tenant_id');

    const token = createToken({
      sub: 'user123',
      app_metadata: {
        tenant_id: 'tenant2',
      },
    });

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('tenant2');
  });

  it('should use custom auth extractor when provided', async () => {
    // Custom extractor that gets tenant from req.user
    const customExtractor = (req: Request) => req.user ?? null;

    const strategy = new ClaimStrategy('tenantId', {
      authExtractor: customExtractor,
    });

    // Set up request with user object instead of token
    mockRequest.user = { tenantId: 'tenant3' };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBe('tenant3');
  });

  it('should return null when authorization header is missing', async () => {
    const strategy = new ClaimStrategy('tenantId');

    // No authorization header
    mockRequest.headers = {};

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null for non-bearer token format', async () => {
    const strategy = new ClaimStrategy('tenantId');

    // Wrong authorization format
    mockRequest.headers = {
      authorization: 'Basic dXNlcjpwYXNz',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });

  it('should return null when claim is not found', async () => {
    const strategy = new ClaimStrategy('missing.claim');

    const token = createToken({ tenantId: 'tenant1' });
    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });

  it('should handle invalid JWT token gracefully', async () => {
    const strategy = new ClaimStrategy('tenantId');

    // Invalid token
    mockRequest.headers = {
      authorization: 'Bearer invalid.token.format',
    };

    const tenantId = await strategy.resolveTenantId(mockRequest as Request);
    expect(tenantId).toBeNull();
  });

  it('should enable debug logging when configured', async () => {
    // Mock console.log to check debug output
    const originalConsoleLog = console.log;
    const mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;

    try {
      const strategy = new ClaimStrategy('tenantId', { debug: true });

      // No auth header to trigger debug log
      mockRequest.headers = {};

      await strategy.resolveTenantId(mockRequest as Request);

      // Verify debug message was logged
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[ClaimStrategy] No auth payload found'),
      );
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
    }
  });
});
