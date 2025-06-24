import { getUuid } from 'uuid-fns';

import { getExampleContext } from '../../../__test_assets__/getExampleContext';
import { DeclastructChangeProposalAction } from '../../../domain/DeclastructChangeProposal';
import { proposeChangeForResource } from './proposeChangeForResource';

const {
  exampleContext,
  exampleMachine,
  CNCMachine,
  exampleRegistration,
  CNCMachineRegistration,
} = getExampleContext();

describe('proposeChangeForResource', () => {
  it('should be able to propose creating a new resource', async () => {
    const proposed = await proposeChangeForResource(
      {
        resource: new CNCMachine({
          serialNumber: getUuid(),
          size: 'huge',
          location: 'rooftop',
        }),
      },
      exampleContext,
    );
    expect(proposed.fromRemoteState).toEqual(null); // should have found that remote state is null for this
    expect(proposed.action).toEqual(DeclastructChangeProposalAction.CREATE); // so it should have triggered proposing creating it
  });
  it('should be able to propose updating an existing resource which has update defined on its interface', async () => {
    const proposed = await proposeChangeForResource(
      {
        resource: new CNCMachine({
          ...exampleMachine,
          location: 'rooftop',
        }),
      },
      exampleContext,
    );
    expect(proposed.fromRemoteState).toEqual(exampleMachine); // should have found an existing remote state for this
    expect(proposed.action).toEqual(DeclastructChangeProposalAction.UPDATE); // so it should have triggered proposing updating it
  });
  it('should be able to propose replacing an existing resource which does not have update defined on its interface', async () => {
    const proposed = await proposeChangeForResource(
      {
        resource: new CNCMachineRegistration({
          ...exampleRegistration,
          registeredBy: 'casey',
        }),
      },
      exampleContext,
    );
    expect(proposed.fromRemoteState).toEqual(exampleRegistration); // should have found an existing remote state for this
    expect(proposed.action).toEqual(DeclastructChangeProposalAction.REPLACE); // so it should have triggered proposing replacing it
  });
  it('should be able to propose no change an existing resource', async () => {
    const proposed = await proposeChangeForResource(
      {
        resource: new CNCMachine({ ...exampleMachine }),
      },
      exampleContext,
    );
    expect(proposed.fromRemoteState).toEqual(exampleMachine); // should have found an existing remote state for this
    expect(proposed.action).toEqual(DeclastructChangeProposalAction.DO_NOTHING); // so it should have triggered proposing updating it
  });
});
