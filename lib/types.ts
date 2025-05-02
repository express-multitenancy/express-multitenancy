/**
 * Represents a tenant in a multi-tenant application.
 * 
 * This is the base interface that all tenant types must implement.
 * It contains the minimal required fields for tenant identification.
 * You can extend this interface to add custom tenant properties.
 */
export interface Tenant {
  /**
   * Unique identifier for the tenant
   */
  id: string;
  
  /**
   * Display name for the tenant
   */
  name: string;
}