import { DomainEntity } from 'domain-objects';
import { VisualogicContext } from 'visualogic';

import { getRef } from '..';
import {
  DeclaredResourceReference,
  DeclaredResourceReferenceKeyType,
} from '../domain/DeclaredResourceReference';
import { DeclastructContext } from '../domain/DeclastructContext';
import { DeclastructProvider } from '../domain/DeclastructProvider';
import { DeclastructProviderResourceRemoteStateInterface } from '../domain/DeclastructProviderResourceRemoteStateInterface';

const log = console;

interface CNCMachine {
  uuid?: string;
  serialNumber: string;
  size: string;
  location: string;
}
class CNCMachine extends DomainEntity<CNCMachine> implements CNCMachine {
  public static primary = ['uuid'] as const;
  public static unique = ['serialNumber'];
}
export type CNCMachineReference = DeclaredResourceReference<
  CNCMachine,
  'uuid',
  'serialNumber'
>;

interface CNCMachineRegistration {
  uuid?: string;
  machine: CNCMachineReference;
  registeredBy: string;
}
class CNCMachineRegistration
  extends DomainEntity<CNCMachineRegistration>
  implements CNCMachineRegistration
{
  public static primary = ['uuid'] as const;
  public static unique = ['machine'];
}
export type CNCMachineRegistrationReference = DeclaredResourceReference<
  CNCMachineRegistration,
  'uuid',
  'machine'
>;

const exampleMachine = new CNCMachine({
  uuid: 'de0e34ca-ce61-4884-ace5-093a1a32ff92',
  serialNumber: '821',
  size: 'big',
  location: 'basement',
}) as Required<CNCMachine>;

const exampleRegistration = new CNCMachineRegistration({
  uuid: '9857cc32-8bcf-4291-8850-aef94c2081f9',
  machine: getRef(exampleMachine),
  registeredBy: 'bob',
}) as Required<CNCMachineRegistration>;

const cncMachineRemoteStateInterface: DeclastructProviderResourceRemoteStateInterface<
  CNCMachine,
  VisualogicContext,
  'uuid',
  'serialNumber'
> = {
  for: CNCMachine.name,
  findByPrimary: async ({ uuid }) => {
    if (uuid === exampleMachine.uuid) return exampleMachine;
    return null;
  },
  findByUnique: async ({ serialNumber }) => {
    if (serialNumber === exampleMachine.serialNumber) return exampleMachine;
    return null;
  },
  create: () => Promise.reject(new Error('todo')),
  update: () => Promise.reject(new Error('todo')),
  destroy: () => Promise.reject(new Error('todo')),
};

const cncMachineRegistrationRemoteStateInterface: DeclastructProviderResourceRemoteStateInterface<
  CNCMachineRegistration,
  VisualogicContext,
  'uuid',
  'machine'
> = {
  for: CNCMachineRegistration.name,
  findByPrimary: async ({ uuid }) => {
    if (uuid === exampleRegistration.uuid) return exampleRegistration;
    return null;
  },
  findByUnique: async ({ machine: machineRef }) => {
    if (
      machineRef.identifiedBy.key ===
        DeclaredResourceReferenceKeyType.PRIMARY_KEY &&
      machineRef.identifiedBy.value.uuid === exampleMachine.uuid
    )
      return exampleRegistration;
    if (
      machineRef.identifiedBy.key ===
        DeclaredResourceReferenceKeyType.UNIQUE_KEY &&
      machineRef.identifiedBy.value.serialNumber === exampleMachine.serialNumber
    )
      return exampleRegistration;
    return null;
  },
  create: () => Promise.reject(new Error('todo')),
  destroy: () => Promise.reject(new Error('todo')),
};

const exampleContext: DeclastructContext & VisualogicContext = {
  log,
  providers: [
    {
      agentOptions: {},
      interfaces: {
        [cncMachineRemoteStateInterface.for]: cncMachineRemoteStateInterface,
        [cncMachineRegistrationRemoteStateInterface.for]:
          cncMachineRegistrationRemoteStateInterface,
      } as any as DeclastructProvider<any>['interfaces'], // TODO: fix types to make this assertion not needed
      hooks: {},
    },
  ],
  resources: [], // no resources needed in context for this test
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getExampleContext = () => ({
  exampleContext,
  exampleMachine,
  CNCMachine,
  exampleRegistration,
  CNCMachineRegistration,
});
