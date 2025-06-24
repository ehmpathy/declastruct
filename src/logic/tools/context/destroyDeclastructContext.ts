import { DeclastructContext } from '../../../domain/DeclastructContext';

export const destroyDeclastructContext = async ({
  context,
}: {
  context: DeclastructContext;
}) => {
  // run the "afterall" of each provider
  await Promise.all(
    context.providers.map((provider) =>
      provider.hooks.afterAll ? provider.hooks.afterAll() : undefined,
    ),
  );

  // todo: mark the context as "destroyed" so it wont be used anymore?
};
