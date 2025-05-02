/**
 * Tenant configuration
 * JavaScript format allows dynamic tenant generation, comments, and functions
 */

// Export tenant configuration
module.exports = {
  tenants: [
    {
      id: 'tenant1',
      name: "Tenant 1 Company Name",
      // Can include additional custom properties
      customField: "Custom value 1",
      allowedDomains: ["tenant1.com", "t1.example.org"]
    },
    {
      id: 'tenant2',
      name: "Name of Tenant 2",
      customField: "Custom value 2",
      allowedDomains: ["tenant2.net"]
    }
  ],
  
  // Can include additional configuration if needed
  // These won't affect the ConfigStore but can be useful for your application
  tenantSettings: {
    defaultRedirectUrl: "/dashboard"
  }
};