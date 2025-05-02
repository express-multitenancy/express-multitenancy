"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStore = exports.tenantStorage = void 0;
const async_hooks_1 = require("async_hooks");
/**
 * AsyncLocalStorage instance for storing and retrieving the current tenant ID.
 *
 * This storage is used to maintain tenant context across asynchronous operations
 * and is used by the multitenancy plugin to automatically filter data by tenant.
 */
exports.tenantStorage = new async_hooks_1.AsyncLocalStorage();
// InMemory Store
// This is a simple in-memory store for demonstration purposes.
class InMemoryStore {
    constructor(tenants) {
        this.tenants = new Map();
        for (const tenant of tenants) {
            this.tenants.set(tenant.id, tenant);
        }
    }
    async getById(id) {
        return this.tenants.get(id) || null;
    }
    async getByName(name) {
        for (const tenant of this.tenants.values()) {
            if (tenant.name === name) {
                return tenant;
            }
        }
        return null;
    }
    async getAll() {
        return Array.from(this.tenants.values());
    }
    async add(tenant) {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }
}
exports.InMemoryStore = InMemoryStore;
