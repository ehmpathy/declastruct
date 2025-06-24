import { buildRef } from '../../..';
import {
  CNCMachineReference,
  getExampleContext,
} from '../../../__test_assets__/getExampleContext';
import { resolveReferenceToCommonComparableForm } from './resolveReferenceToCommonComparableForm';

const { exampleContext, exampleMachine, CNCMachine } = getExampleContext();

describe('resolveReferenceToCommonComparableForm', () => {
  it('should change nothing on a shallow unique key reference', async () => {
    const original: CNCMachineReference = buildRef(CNCMachine, {
      serialNumber: exampleMachine.serialNumber,
    });
    const resolved = await resolveReferenceToCommonComparableForm(
      {
        reference: original,
      },
      exampleContext,
    );
    expect(resolved).toEqual(original);
  });
  it('should resolve unique key reference from primary key reference', async () => {
    const original: CNCMachineReference = buildRef(CNCMachine, {
      uuid: exampleMachine.uuid,
    });
    const expected: CNCMachineReference = buildRef(CNCMachine, {
      serialNumber: exampleMachine.serialNumber,
    });
    const resolved = await resolveReferenceToCommonComparableForm(
      {
        reference: original,
      },
      exampleContext,
    );
    expect(resolved).toEqual(expected);
  });
  it.todo(
    'should resolve a primary key reference nested in a unique key reference to unique key form', // { adGroup: { campaign: { account } } }
  );
});
