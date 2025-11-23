import Bottleneck from 'bottleneck';
import { ContextLogTrail } from 'simple-log-methods';

import { ContextDeclastruct } from './ContextDeclastruct';

describe('ContextDeclastruct', () => {
  it('should accept single bottleneck configuration', () => {
    const context: ContextDeclastruct = {
      bottleneck: new Bottleneck({ maxConcurrent: 5 }),
    };

    expect(context.bottleneck).toBeInstanceOf(Bottleneck);
  });

  it('should accept split bottleneck configuration', () => {
    const context: ContextDeclastruct = {
      bottleneck: {
        onPlan: new Bottleneck({ maxConcurrent: 10 }),
        onApply: new Bottleneck({ maxConcurrent: 1 }),
      },
    };

    expect(context.bottleneck).toHaveProperty('onPlan');
    expect(context.bottleneck).toHaveProperty('onApply');
    expect((context.bottleneck as any).onPlan).toBeInstanceOf(Bottleneck);
    expect((context.bottleneck as any).onApply).toBeInstanceOf(Bottleneck);
  });

  it('should be able to intersect with ContextLogTrail', () => {
    // type verification
    const context: ContextDeclastruct & ContextLogTrail = {
      bottleneck: new Bottleneck({ maxConcurrent: 5 }),
      log: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    };

    expect(context.bottleneck).toBeDefined();
    expect(context.log).toBeDefined();
  });
});
