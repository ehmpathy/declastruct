import type { LogMethods } from 'simple-leveled-log-methods';
import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { DeclastructProvider } from '../../../domain/DeclastructProvider';

export const createDeclastructContext = ({
  providers,
  resources,
  log,
}: {
  providers: DeclastructProvider<any>[];
  resources: DeclaredResource[];
  log: LogMethods;
}): DeclastructContext & VisualogicContext => {
  return {
    providers,
    resources,
    log,
  };
};
