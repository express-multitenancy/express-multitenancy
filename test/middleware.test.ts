import {
  multitenancy,
  InMemoryStore,
  HeaderStrategy,
  Strategy,
  Tenant,
  tenantContext,
} from '../lib';
import { Request, Response } from 'express';

describe('multitenancy middleware', () => {
  // Sample tenants for testing
  const sampleTenants: Tenant[] = [
    { id: 'tenant1', name: 'Tenant 1' },
    { id: 'tenant2', name: 'Tenant 2' },
  ];

  // Test store and strategy
  let store: InMemoryStore;
  let headerStrategy: HeaderStrategy;

  // Mock Express objects
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    // Reset for each test
    store = new InMemoryStore([...sampleTenants]);
    headerStrategy = new HeaderStrategy();

    mockRequest = {
      headers: {},
    };

    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should set tenant when strategy resolves a valid tenant ID', async () => {
    // Create middleware
    const middleware = multitenancy({
      strategies: [headerStrategy],
      store,
    });

    // Set up request with valid tenant ID
    mockRequest.headers = { 'x-tenant-id': 'tenant1' };

    // Execute middleware
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assertions
    expect(mockRequest.tenant).toBeDefined();
    expect(mockRequest.tenant?.id).toBe('tenant1');
    expect(mockRequest.tenant?.name).toBe('Tenant 1');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set tenant to null when tenant ID not found in store', async () => {
    const middleware = multitenancy({
      strategies: [headerStrategy],
      store,
    });

    // Non-existent tenant ID
    mockRequest.headers = { 'x-tenant-id': 'non-existent' };

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.tenant).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should use onTenantNotFound callback when provided', async () => {
    const onTenantNotFound = jest.fn((req, res, next, tenantId) => {
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.status(404).json({ error: `Tenant ${tenantId} not found` });
    });

    const middleware = multitenancy({
      strategies: [headerStrategy],
      store,
      onTenantNotFound,
    });

    // Non-existent tenant ID
    mockRequest.headers = { 'x-tenant-id': 'non-existent' };
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn().mockReturnValue(mockResponse);

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(onTenantNotFound).toHaveBeenCalledWith(
      mockRequest,
      mockResponse,
      nextFunction,
      'non-existent',
    );
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should try multiple strategies in order', async () => {
    // Create a mock strategy that always returns null
    const mockStrategy: Strategy = {
      resolveTenantId: jest.fn().mockResolvedValue(null),
    };

    const middleware = multitenancy({
      strategies: [mockStrategy, headerStrategy],
      store,
    });

    // Set up request with valid tenant ID
    mockRequest.headers = { 'x-tenant-id': 'tenant2' };

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // First strategy should be called but returns null
    expect(mockStrategy.resolveTenantId).toHaveBeenCalled();

    // Middleware should fall back to second strategy
    expect(mockRequest.tenant).toBeDefined();
    expect(mockRequest.tenant?.id).toBe('tenant2');
  });

  it('should handle strategy errors gracefully', async () => {
    // Create a strategy that throws an error
    const errorStrategy: Strategy = {
      resolveTenantId: jest.fn().mockRejectedValue(new Error('Strategy error')),
    };

    const middleware = multitenancy({
      strategies: [errorStrategy, headerStrategy],
      store,
      debug: true,
    });

    // Capture console logs to verify debug output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Set up request with valid tenant ID for fallback strategy
    mockRequest.headers = { 'x-tenant-id': 'tenant1' };

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Error strategy should be called but fails
    expect(errorStrategy.resolveTenantId).toHaveBeenCalled();

    // Debug log should record the error
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Strategy error'));

    // Middleware should fall back to second strategy
    expect(mockRequest.tenant).toBeDefined();
    expect(mockRequest.tenant?.id).toBe('tenant1');

    // Next should be called
    expect(nextFunction).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should set up AsyncLocalStorage context with tenant ID', async () => {
    const middleware = multitenancy({
      strategies: [headerStrategy],
      store,
    });

    mockRequest.headers = { 'x-tenant-id': 'tenant1' };

    // Capture the tenant ID that gets stored in AsyncLocalStorage
    let capturedTenantId: string | null | undefined = null;
    nextFunction.mockImplementation(() => {
      capturedTenantId = tenantContext.getStore();
    });

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Check that the tenant ID was correctly stored
    expect(capturedTenantId).toBe('tenant1');
  });

  it('should set up AsyncLocalStorage with null when no tenant found', async () => {
    const middleware = multitenancy({
      strategies: [headerStrategy],
      store,
    });

    mockRequest.headers = {}; // No tenant ID

    // Capture the tenant ID that gets stored in AsyncLocalStorage
    let capturedTenantId: string | null | undefined = null;
    nextFunction.mockImplementation(() => {
      capturedTenantId = tenantContext.getStore();
    });

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Check that null was correctly stored
    expect(capturedTenantId).toBeNull();
  });

  it('should not set up AsyncLocalStorage when no strategies provided', async () => {
    const middleware = multitenancy({
      strategies: [],
      store,
    });

    mockRequest.headers = { 'x-tenant-id': 'tenant1' };

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // No tenant context should be set
    expect(tenantContext.getStore()).toBeUndefined();
  });

  it('should handle store errors gracefully', async () => {
    // Create a store that throws an error
    const errorStore = {
      getById: jest.fn().mockRejectedValue(new Error('Store error')),
    };

    const middleware = multitenancy({
      strategies: [headerStrategy],
      store: errorStore as unknown as InMemoryStore,
    });

    mockRequest.headers = { 'x-tenant-id': 'tenant1' };

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Store error should be logged
    expect(nextFunction).toHaveBeenCalled();
  });
});
