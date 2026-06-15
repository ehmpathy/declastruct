import { type ContextLogTrail, genLogMethods } from 'sdk-logs';
import { genBottleneck } from 'with-bottleneck';

import type { ContextDeclastruct } from './ContextDeclastruct';

describe('ContextDeclastruct', () => {
  it('should accept single bottleneck configuration', () => {
    const context: ContextDeclastruct = {
      bottleneck: genBottleneck({ concurrency: 5 }),
    };

    expect(context.bottleneck).toBeDefined();
  });

  it('should accept split bottleneck configuration', () => {
    const context: ContextDeclastruct = {
      bottleneck: {
        onPlan: genBottleneck({ concurrency: 10 }),
        onApply: genBottleneck({ concurrency: 1 }),
      },
    };

    expect(context.bottleneck).toHaveProperty('onPlan');
    expect(context.bottleneck).toHaveProperty('onApply');
    expect((context.bottleneck as any).onPlan).toBeDefined();
    expect((context.bottleneck as any).onApply).toBeDefined();
  });

  it('should be able to intersect with ContextLogTrail', () => {
    // type verification
    const context: ContextDeclastruct & ContextLogTrail = {
      bottleneck: genBottleneck({ concurrency: 5 }),
      log: genLogMethods(),
    };

    expect(context.bottleneck).toBeDefined();
    expect(context.log).toBeDefined();
  });
});
