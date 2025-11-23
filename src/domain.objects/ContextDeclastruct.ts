import Bottleneck from 'bottleneck';

/**
 * .what = standard context for all declastruct operations
 * .why = provides concurrency control and log trail
 * .note = bottleneck can be a single instance or separate instances for plan/apply operations
 */
export type ContextDeclastruct = {
  /**
   * concurrency control - either single bottleneck or separate for plan/apply
   */
  bottleneck: Bottleneck | { onPlan: Bottleneck; onApply: Bottleneck };
};
