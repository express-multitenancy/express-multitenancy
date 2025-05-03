import { InMemoryStore, Tenant } from '../../lib';

describe('InMemoryStore', () => {
  // Sample tenants for testing
  const sampleTenants: Tenant[] = [
    { id: 'tenant1', name: 'Tenant 1' },
    { id: 'tenant2', name: 'Tenant 2' },
  ];

  let store: InMemoryStore;

  beforeEach(() => {
    // Create a fresh store before each test
    store = new InMemoryStore([...sampleTenants]);
  });

  describe('getById', () => {
    it('should return tenant by id', async () => {
      const tenant = await store.getById('tenant1');
      expect(tenant).not.toBeNull();
      expect(tenant?.id).toBe('tenant1');
      expect(tenant?.name).toBe('Tenant 1');
    });

    it('should return null for non-existent tenant id', async () => {
      const tenant = await store.getById('non-existent');
      expect(tenant).toBeNull();
    });
  });

  describe('getByName', () => {
    it('should return tenant by name', async () => {
      const tenant = await store.getByName('Tenant 2');
      expect(tenant).not.toBeNull();
      expect(tenant?.id).toBe('tenant2');
      expect(tenant?.name).toBe('Tenant 2');
    });

    it('should return null for non-existent tenant name', async () => {
      const tenant = await store.getByName('Non-existent Tenant');
      expect(tenant).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all tenants', async () => {
      const tenants = await store.getAll();
      expect(tenants).toHaveLength(2);
      expect(tenants[0].id).toBe('tenant1');
      expect(tenants[1].id).toBe('tenant2');
    });
  });

  describe('add', () => {
    it('should add a new tenant', async () => {
      const newTenant: Tenant = { id: 'tenant3', name: 'Tenant 3' };
      const added = await store.add(newTenant);

      expect(added).toEqual(newTenant);

      // Verify the tenant was actually added
      const retrieved = await store.getById('tenant3');
      expect(retrieved).toEqual(newTenant);

      // Check that getAll now returns 3 tenants
      const all = await store.getAll();
      expect(all).toHaveLength(3);
    });

    it('should replace an existing tenant with the same id', async () => {
      const updatedTenant: Tenant = { id: 'tenant1', name: 'Updated Tenant 1' };
      await store.add(updatedTenant);

      const retrieved = await store.getById('tenant1');
      expect(retrieved?.name).toBe('Updated Tenant 1');

      // Total count should still be 2
      const all = await store.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('with custom tenant type', () => {
    interface CustomTenant extends Tenant {
      domain: string;
      isActive: boolean;
    }

    const customTenants: CustomTenant[] = [
      { id: 'custom1', name: 'Custom 1', domain: 'custom1.example.com', isActive: true },
      { id: 'custom2', name: 'Custom 2', domain: 'custom2.example.com', isActive: false },
    ];

    let customStore: InMemoryStore<CustomTenant>;

    beforeEach(() => {
      customStore = new InMemoryStore<CustomTenant>([...customTenants]);
    });

    it('should handle custom tenant properties', async () => {
      const tenant = await customStore.getById('custom1');
      expect(tenant).not.toBeNull();
      expect(tenant?.domain).toBe('custom1.example.com');
      expect(tenant?.isActive).toBe(true);
    });

    it('should add a custom tenant', async () => {
      const newTenant: CustomTenant = {
        id: 'custom3',
        name: 'Custom 3',
        domain: 'custom3.example.com',
        isActive: true,
      };

      await customStore.add(newTenant);
      const retrieved = await customStore.getById('custom3');

      expect(retrieved).toEqual(newTenant);
    });
  });
});
