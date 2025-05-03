import { Tenant } from './types';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage instance for storing and retrieving the current tenant ID.
 *
 * This storage is used to maintain tenant context across asynchronous operations
 * and is used by the multitenancy plugin to automatically filter data by tenant.
 */
export const tenantContext = new AsyncLocalStorage<string | null>();

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

/**
 * In-memory implementation of the Store interface.
 *
 * This is a simple store that keeps tenants in memory, primarily intended
 * for development, testing, or demonstration purposes. It's not suitable
 * for production environments where persistence is required.
 */
export class InMemoryStore<T extends Tenant = Tenant> implements Store<T> {
  private tenants: Map<string, T> = new Map();

  /**
   * Creates a new InMemoryStore instance.
   *
   * @param tenants - An initial array of tenant objects to populate the store.
   *
   * @example
   * ```typescript
   * const store = new InMemoryStore([
   *   { id: 'tenant-1', name: 'Tenant 1' },
   *   { id: 'tenant-2', name: 'Tenant 2' }
   * ]);
   * ```
   */
  constructor(tenants: T[]) {
    for (const tenant of tenants) {
      this.tenants.set(tenant.id, tenant);
    }
  }

  /**
   * Retrieves a tenant by its ID.
   *
   * @param id - The ID of the tenant to retrieve.
   * @returns The tenant object if found, or null if not found.
   *
   * @example
   * ```typescript
   * const tenant = await store.getById('tenant-id');
   * if (tenant) {
   *   console.log(`Found tenant: ${tenant.name}`);
   * }
   * ```
   */
  async getById(id: string): Promise<T | null> {
    return this.tenants.get(id) || null;
  }

  /**
   * Retrieves a tenant by its name.
   *
   * @param name - The name of the tenant to retrieve.
   * @returns The tenant object if found, or null if not found.
   *
   * @example
   * ```typescript
   * const tenant = await store.getByName('Tenant Name');
   * if (tenant) {
   *   console.log(`Found tenant with ID: ${tenant.id}`);
   * }
   * ```
   *
   * @note This method performs a linear search and may be inefficient for large collections.
   */
  async getByName(name: string): Promise<T | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.name === name) {
        return tenant;
      }
    }
    return null;
  }

  /**
   * Retrieves all tenants from the store.
   *
   * @returns An array containing all tenant objects in the store.
   *
   * @example
   * ```typescript
   * const allTenants = await store.getAll();
   * console.log(`Found ${allTenants.length} tenants`);
   * ```
   */
  async getAll(): Promise<T[]> {
    return Array.from(this.tenants.values());
  }

  /**
   * Adds a new tenant to the store.
   *
   * @param tenant - The tenant object to add to the store.
   * @returns The added tenant object.
   *
   * @example
   * ```typescript
   * const newTenant = await store.add({ id: 'new-tenant', name: 'New Tenant' });
   * console.log(`Added tenant: ${newTenant.name}`);
   * ```
   *
   * @note If a tenant with the same ID already exists, it will be overwritten.
   */
  async add(tenant: T): Promise<T> {
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }
}
