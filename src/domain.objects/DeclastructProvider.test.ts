import { DeclastructProvider } from './DeclastructProvider';

describe('DeclastructProvider', () => {
  it('should build a provider with all required properties', () => {
    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: {},
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    expect(provider.name).toBe('test-provider');
    expect(provider.daos).toEqual({});
    expect(provider.context).toEqual({});
    expect(provider.hooks.beforeAll).toBeDefined();
    expect(provider.hooks.afterAll).toBeDefined();
  });

  it('should work without explicit type arguments', () => {
    // type verification - default type parameters should work
    const provider = new DeclastructProvider({
      name: 'default-provider',
      daos: {},
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    expect(provider).toBeDefined();
  });
});
