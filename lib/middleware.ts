import { Tenant } from './types';
import { Store, tenantStorage } from './stores';
import { Request, Response, NextFunction } from 'express';
import { Strategy } from './strategies';

declare global {
  namespace Express {
    interface Request {
      /**
       * Current tenant context, available on each Express request
       * Will be null if no tenant was identified or tenant lookup failed
       */
      tenant: Tenant | null;
    }
  }
}

/**
 * Configuration options for the multitenancy middleware.
 */
export interface MultitenancyOptions<T extends Tenant = Tenant> {
  /**
   * Array of strategies to use for tenant identification, in order of priority
   */
  strategies: Strategy[];
  
  /**
   * Tenant storage provider for retrieving tenant information
   */
  store: Store<T>;
  
  /**
   * Handler for when a tenant ID is resolved but not found in the store
   * If not provided, sets the tenant to null and continues
   */
  onTenantNotFound?: (req: Request, res: Response, next: NextFunction, tenantId: string) => void;
  
  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Creates Express middleware for multi-tenancy support.
 * 
 * This middleware attempts to identify the current tenant using provided
 * strategies and stores the tenant information in the request object.
 * It also sets up the tenant context in async local storage for use in
 * other parts of the application, like the Mongoose plugin.
 * 
 * @param options - Configuration options
 * 
 * @returns Express middleware function that sets up tenant context
 * 
 * @example
 * ```
 * // Basic setup with a header strategy
 * app.use(multitenancy({
 *   strategies: [new HeaderStrategy('x-tenant-id')],
 *   store: new InMemoryStore(tenants)
 * }));
 * 
 * // With error handling for tenant not found
 * app.use(multitenancy({
 *   strategies: [new HeaderStrategy('x-tenant-id')],
 *   store: new InMemoryStore(tenants),
 *   onTenantNotFound: (req, res, next, tenantId) => {
 *     res.status(404).json({ error: `Tenant ${tenantId} not found` });
 *   }
 * }));
 * ```
 */
export function multitenancy<T extends Tenant = Tenant>(options: MultitenancyOptions<T>) {
  const { 
    strategies, 
    store, 
    onTenantNotFound,
    debug = false, 
  } = options;

  const log = (message: string) => {
    if (debug) {
      console.log(`[Multitenancy] ${message}`);
    }
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    let tenantId: string | null = null;

    // Try each strategy until we find a tenant ID
    for (const strategy of strategies) {
      try {
        const resolvedTenantId = await strategy.resolveTenantId(req);

        if (resolvedTenantId) {
          tenantId = resolvedTenantId;
          log(`Resolved tenant ID: ${tenantId} using ${strategy.constructor.name}`);
          break;
        }
      } catch (error) {
        log(`Strategy ${strategy.constructor.name} error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // No tenant ID found
    if (!tenantId) {
      log('No tenant context identified');
      req.tenant = null;
      return tenantStorage.run(null, next);
    }

    // Try to retrieve tenant from store
    try {
      const tenant = await store.getById(tenantId);

      // Tenant not found in store
      if (!tenant) {
        log(`Tenant with ID ${tenantId} not found in store`);
        
        if (onTenantNotFound) {
          return onTenantNotFound(req, res, next, tenantId);
        }
        
        // No custom handler, continue with null tenant
        req.tenant = null;
        return tenantStorage.run(null, next);
      }

      // Tenant found, set in request and async storage
      req.tenant = tenant;
      return tenantStorage.run(tenantId, () => {
        log(`Set tenant context to ${tenantId}`);
        next();
      });
    } catch (error) {
      log(`Error retrieving tenant: ${error instanceof Error ? error.message : String(error)}`);
      req.tenant = null;
      return tenantStorage.run(null, next);
    }
  };
}