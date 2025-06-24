import { getExampleContext } from '../../../__test_assets__/getExampleContext';
import { detectDifferenceBetweenDesiredAndRemoteStateOfResource } from './detectDifferenceBetweenDesiredAndRemoteStateOfResource';

const { exampleContext, exampleMachine, CNCMachine } = getExampleContext();

describe('detectDifferenceBetweenDesiredAndRemoteStateOfResource', () => {
  it('should return a helpful displayable difference and usable difference', async () => {
    const desiredState = exampleMachine;
    const remoteState = new CNCMachine({
      ...desiredState,
      location: 'moon',
    });
    const difference =
      await detectDifferenceBetweenDesiredAndRemoteStateOfResource(
        {
          desiredState,
          remoteState,
        },
        exampleContext,
      );
    expect(difference).toMatchSnapshot();
  });
  it('should show the case where we want to create a new resource well', async () => {
    const desiredState = exampleMachine;
    const remoteState = null;
    const difference =
      await detectDifferenceBetweenDesiredAndRemoteStateOfResource(
        {
          desiredState,
          remoteState,
        },
        exampleContext,
      );
    console.log(difference.displayable);
    console.log(difference.usable);
    expect(difference).toMatchSnapshot();
  });
});
