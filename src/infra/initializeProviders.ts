import type { DeclastructProvider } from '@src/domain.objects/DeclastructProvider';

/**
 * .what = initializes all providers via their beforeAll hooks
 * .why = providers may need to establish connections or state before use
 */
export const initializeProviders = async (input: {
  providers: DeclastructProvider<any, any>[];
}): Promise<void> => {
  await Promise.all(input.providers.map((p) => p.hooks.beforeAll()));
};

/**
 * .what = finalizes all providers via their afterAll hooks
 * .why = providers may need to close connections or cleanup state after use
 */
export const finalizeProviders = async (input: {
  providers: DeclastructProvider<any, any>[];
}): Promise<void> => {
  await Promise.all(input.providers.map((p) => p.hooks.afterAll()));
};
