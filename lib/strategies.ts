import { Request } from 'express';

/**
 * Interface for tenant identification strategies.
 *
 * Implement this interface to create custom strategies for identifying
 * the current tenant from an incoming request. This allows for
 * flexible tenant resolution based on different parts of the request.
 */
export interface Strategy {
  /**
   * Resolves the tenant ID from the request.
   *
   * @param req - Express request object to analyze for tenant information
   * @returns A Promise resolving to the tenant ID string if found, or null if no tenant could be identified
   */
  resolveTenantId(req: Request): Promise<string | null>;
}

/**
 * Strategy for identifying tenants based on HTTP headers.
 *
 * This strategy extracts the tenant ID from a specified HTTP header.
 * It's a common approach for API-based multi-tenant applications.
 *
 * @example
 * ```
 * // Create a strategy that looks for tenant ID in x-tenant-id header
 * const headerStrategy = new HeaderStrategy('x-tenant-id');
 * ```
 */
export class HeaderStrategy implements Strategy {
  /**
   * Creates a new HeaderStrategy instance.
   *
   * @param headerName - The name of the HTTP header containing the tenant ID (case insensitive)
   *                     Defaults to 'x-tenant-id' if not provided.
   */
  constructor(private headerName: string = 'x-tenant-id') {}

  /**
   * Extracts tenant ID from the specified HTTP header.
   *
   * @param req - Express request object
   * @returns The tenant ID from the header, or null if header is not present
   */
  async resolveTenantId(req: Request): Promise<string | null> {
    return (req.headers[this.headerName.toLowerCase()] as string) || null;
  }
}

/**
 * Strategy for identifying tenants based on hostname.
 *
 * This strategy extracts the tenant ID from the hostname using a regular expression pattern.
 * It's useful for subdomain-based multi-tenancy (e.g., tenant1.example.com).
 *
 * @example
 * ```
 * // Create a strategy that extracts tenant ID from subdomain
 * const hostStrategy = new HostStrategy(/^([^.]+)/);  // matches "tenant1" from "tenant1.example.com"
 * ```
 */
export class HostStrategy implements Strategy {
  /**
   * Creates a new HostStrategy instance.
   *
   * @param pattern - Regular expression pattern with a capture group for the tenant ID
   */
  constructor(private pattern: RegExp) {}

  /**
   * Extracts tenant ID from the hostname using the provided regex pattern.
   *
   * @param req - Express request object
   * @returns The tenant ID extracted from hostname, or null if no match
   */
  async resolveTenantId(req: Request): Promise<string | null> {
    const hostname = req.hostname;
    if (!hostname) return null;

    const match = hostname.match(this.pattern);
    // Return the first capture group if there's a match
    return match && match[1] ? match[1] : null;
  }
}

/**
 * Strategy for identifying tenants based on route parameters.
 *
 * This strategy extracts the tenant ID from route parameters.
 * It's useful for route-based multi-tenancy (e.g., /api/:tenantId/resources).
 *
 * @example
 * ```
 * // Define a route with tenant parameter
 * app.get('/api/:tenantId/resources', (req, res) => { ... });
 *
 * // Create a strategy that extracts tenant ID from route parameter
 * const routeStrategy = new RouteStrategy('tenantId');
 *
 * // For Express 5 compatibility, mount the middleware on specific routes
 * app.use(['/api/:tenantId', '/api/:tenantId/*'], multitenancy({
 *   strategies: [routeStrategy],
 *   store: myStore
 * }));
 * ```
 */
export class RouteStrategy implements Strategy {
  /**
   * Creates a new RouteStrategy instance.
   *
   * @param paramName - Name of the route parameter to extract as tenant ID (default: 'tenantId')
   */
  constructor(private paramName: string = 'tenantId') {}

  /**
   * Extracts tenant ID from the route parameter specified in constructor.
   *
   * @param req - Express request object
   * @returns The tenant ID from route parameter, or null if not present
   */
  async resolveTenantId(req: Request): Promise<string | null> {
    return req.params?.[this.paramName] || null;
  }
}

/**
 * Options for the BasePathStrategy.
 */
export interface BasePathOptions {
  /**
   * If true, the tenant path segment will be removed from req.path after tenant resolution,
   * making the rest of the application unaware of the tenant segment in the URL.
   * For example, "/tenant1/api/resources" becomes "/api/resources".
   */
  rebasePath?: boolean;

  /**
   * The position of the path segment to use as tenant ID (1-based index).
   * For example, if the URL is "/tenant1/api/resources", and position is 1,
   * the tenant ID will be "tenant1".
   */
  position: number;
}

/**
 * Strategy for identifying tenants based on URL path segments.
 *
 * This strategy extracts the tenant ID from a specific segment of the URL path.
 * It's useful for path-based multi-tenancy (e.g., /tenant1/api/resources).
 *
 * @example
 * ```
 * // Create a strategy that uses the first path segment as tenant ID
 * const basePathStrategy = new BasePathStrategy({ position: 1 });  // extracts "tenant1" from "/tenant1/api/resources"
 *
 * // Create a strategy that also rebases the path (removes the tenant segment)
 * const basePathStrategy = new BasePathStrategy({ rebasePath: true });
 * // After tenant resolution, "/tenant1/api/resources" becomes "/api/resources"
 * ```
 */
export class BasePathStrategy implements Strategy {
  private options: BasePathOptions;

  /**
   * Creates a new BasePathStrategy instance.
   *
   * @param options - Configuration options for the strategy
   */
  constructor(options?: Partial<BasePathOptions>) {
    // Set default values by merging with provided options
    this.options = {
      position: 1,
      rebasePath: false,
      ...options,
    };
  }

  /**
   * Extracts tenant ID from the specified position in the URL path.
   *
   * @param req - Express request object
   * @returns The tenant ID from the path segment, or null if not present
   */
  async resolveTenantId(req: Request): Promise<string | null> {
    const path = req.path;
    if (!path) return null;

    // Split path and remove empty segments
    const segments = path.split('/').filter((segment: string) => segment.length > 0);

    // Position is 1-based for user-friendliness, but array is 0-based
    const index = this.options.position - 1;

    // Check if the index is valid
    const tenantId = segments.length > index ? segments[index] : null;

    // If rebasePath is true and we found a tenant, modify the request path
    // by removing the tenant segment from the original path
    if (tenantId && this.options.rebasePath) {
      // Create a new path without the tenant segment
      const newSegments = [...segments];
      newSegments.splice(index, 1);
      const newPath = '/' + newSegments.join('/');

      // Override the path and original URL in the request object
      // Note: This modifies Express's internal url property
      Object.defineProperty(req, 'path', {
        get: function () {
          return newPath;
        },
        set: function () {
          /* Ignore */
        },
      });

      const originalUrl = req.originalUrl;
      const pathIndex = originalUrl.indexOf(path);
      if (pathIndex >= 0) {
        const newOriginalUrl =
          originalUrl.substring(0, pathIndex) +
          newPath +
          originalUrl.substring(pathIndex + path.length);
        Object.defineProperty(req, 'originalUrl', {
          get: function () {
            return newOriginalUrl;
          },
          set: function () {
            /* Ignore */
          },
        });
      }
    }

    return tenantId;
  }
}

/**
 * Represents a JWT or authentication payload with flexible structure
 */
export interface AuthPayload {
  [key: string]: unknown;
}

/**
 * Options for the ClaimStrategy.
 */
export interface ClaimStrategyOptions {
  /**
   * Optional function to extract the auth payload from the request
   * If not provided, the strategy will try to extract from Authorization header
   */
  authExtractor?: (req: Request) => AuthPayload | null;

  /**
   * Whether to enable debug logging for claim extraction
   * Default: false
   */
  debug?: boolean;
}

/**
 * Strategy for identifying tenants based on authentication claims.
 *
 * This strategy extracts the tenant ID from JWT claims or other auth tokens.
 * It's useful for applications where tenant context is tied to user authentication.
 *
 * @example
 * ```
 * // Create a strategy that extracts tenant ID from a specific claim
 * const claimStrategy = new ClaimStrategy('tenantId');
 *
 * // Extract from nested claim property
 * const nestedClaimStrategy = new ClaimStrategy('app_metadata.tenant_id');
 *
 * // With custom auth extractor
 * const customStrategy = new ClaimStrategy('tenant', {
 *   authExtractor: (req) => req.user // For passport or similar auth middleware
 * });
 * ```
 */
export class ClaimStrategy implements Strategy {
  private authExtractor: (req: Request) => AuthPayload | null;
  private debug: boolean;

  /**
   * Creates a new ClaimStrategy instance.
   *
   * @param claimPath - Path to the claim containing tenant ID (dot notation for nested properties)
   * @param options - Configuration options for the strategy
   */
  constructor(
    private claimPath: string,
    options: ClaimStrategyOptions = {},
  ) {
    this.authExtractor = options.authExtractor || this.defaultAuthExtractor;
    this.debug = options.debug || false;
  }

  /**
   * Extracts tenant ID from the authentication claims.
   *
   * @param req - Express request object
   * @returns The tenant ID from the claims, or null if not found
   */
  async resolveTenantId(req: Request): Promise<string | null> {
    const payload = this.authExtractor(req);

    if (!payload) {
      if (this.debug) console.log('[ClaimStrategy] No auth payload found');
      return null;
    }

    const tenantId = this.getNestedProperty(payload, this.claimPath);

    if (this.debug) {
      console.log(`[ClaimStrategy] Extracted tenantId: ${tenantId}`);
    }

    return tenantId;
  }

  /**
   * Default extractor that looks for JWT in Authorization header.
   * This handles "Bearer <token>" format and attempts to decode the JWT.
   */
  private defaultAuthExtractor(req: Request): AuthPayload | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    try {
      // Simple JWT parsing (without verification)
      // Note: In production, you would want to verify the token
      const base64Payload = token.split('.')[1];
      return JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    } catch (error) {
      if (this.debug) {
        console.error('[ClaimStrategy] Failed to parse JWT token:', error);
      }
      return null;
    }
  }

  /**
   * Gets a nested property from an object using dot notation.
   */
  private getNestedProperty(obj: Record<string, unknown>, path: string): string | null {
    if (!obj || !path) return null;

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current == null || typeof current !== 'object') {
        return null;
      }
      // Type assertion to access property with string index
      current = (current as Record<string, unknown>)[part];
    }

    return current?.toString() || null;
  }
}
