import { VisualogicContext } from 'visualogic';

import { DeclastructContext } from '../../../domain/DeclastructContext';
import { DeclastructProviderContext } from '../../../domain/DeclastructProviderContext';

export const castProviderContextToGlobalContext = (
  from: DeclastructProviderContext<any>,
): DeclastructContext & VisualogicContext => ({
  providers: [from.provider],
  resources: from.resources ?? [],
  log: from.log,
});
