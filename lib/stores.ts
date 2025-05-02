import { Tenant } from './types';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage instance for storing and retrieving the current tenant ID.
 * 
 * This storage is used to maintain tenant context across asynchronous operations
 * and is used by the multitenancy plugin to automatically filter data by tenant.
 */
export const tenantStorage = new AsyncLocalStorage<string | null>();


export interface Store<T extends Tenant = Tenant> {
  /**
   * Get a tenant by ID.
   * 
   * @param id - The ID of the tenant to retrieve.
   * @returns The tenant object if found, or null if not found.
   * 
   * @example
   * ```typescript
   * const tenant = await store.get('tenant-id');
   * console.log(tenant);
   * ```
   * 
   * @throws Error if the tenant ID is invalid or if there is an error during retrieval.
   * 
*/
  getById(id: string): Promise<T | null>;

  /**
   * Get a tenant by name.
   * 
   * @param id - The name of the tenant to retrieve.
   * @returns The tenant object if found, or null if not found.
   * 
   * @example
   * ```typescript
   * const tenant = await store.getByName('tenant-name');
   * console.log(tenant);
   * ```
   */
  getByName(id: string): Promise<T | null>;
  
  /**
   * Get all tenants.
   * 
   * @returns An array of all tenant objects.
   * 
   * @example
   * ```typescript
   * const tenants = await store.getAll();
   * console.log(tenants);
   * ```
   */
  getAll(): Promise<T[]>;
  
  /**
   * Create a new tenant.
   * 
   * @param tenant - The tenant object to create.
   * @returns The created tenant object.
   * 
   * @example
   * ```typescript
   * const newTenant = await store.create({ id: 'new-tenant-id', name: 'New Tenant' });
   * console.log(newTenant);
   * ```
   */
  add(tenant: T): Promise<T>;
}

// InMemory Store
// This is a simple in-memory store for demonstration purposes.

export class InMemoryStore<T extends Tenant = Tenant> implements Store<T> {
  private tenants: Map<string, T> = new Map();

  constructor(tenants: T[]) {
    for (const tenant of tenants) {
      this.tenants.set(tenant.id, tenant);
    }
  }

  async getById(id: string): Promise<T | null> {
    return this.tenants.get(id) || null;
  }
  async getByName(name: string): Promise<T | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.name === name) {
        return tenant;
      }
    }
    return null;
  }
  async getAll(): Promise<T[]> {
    return Array.from(this.tenants.values());
  }
  async add(tenant: T): Promise<T> {
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }
}