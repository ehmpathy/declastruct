import {
  DemoResource,
  genSampleDemoResource,
} from '../../.test/assets/providers/demo.provider';
import { DECLASTRUCT_DELETE } from '../../domain/symbols';
import { del, isMarkedForDeletion } from './del';

describe('del', () => {
  it('should mark resource for deletion', () => {
    const resource = genSampleDemoResource({ name: 'test' });
    const marked = del(resource);
    expect(isMarkedForDeletion(marked)).toBe(true);
  });

  it('should preserve original resource properties', () => {
    const resource = DemoResource.as({ exid: 'test-exid', name: 'test-name' });
    const marked = del(resource);
    expect(marked.exid).toBe('test-exid');
    expect(marked.name).toBe('test-name');
  });

  it('should set the symbol property to true', () => {
    const resource = genSampleDemoResource({ name: 'test' });
    const marked = del(resource);
    expect((marked as any)[DECLASTRUCT_DELETE]).toBe(true);
  });

  it('should be idempotent - del(del(resource)) should work', () => {
    const resource = genSampleDemoResource({ name: 'test' });
    const markedOnce = del(resource);
    const markedTwice = del(markedOnce);
    expect(isMarkedForDeletion(markedTwice)).toBe(true);
    expect((markedTwice as any)[DECLASTRUCT_DELETE]).toBe(true);
  });
});

describe('isMarkedForDeletion', () => {
  it('should return false for unmarked resources', () => {
    const resource = genSampleDemoResource({ name: 'test' });
    expect(isMarkedForDeletion(resource)).toBe(false);
  });

  it('should return true for marked resources', () => {
    const resource = genSampleDemoResource({ name: 'test' });
    const marked = del(resource);
    expect(isMarkedForDeletion(marked)).toBe(true);
  });

  it('should act as a type guard', () => {
    const resource = genSampleDemoResource({ name: 'test' });
    const marked = del(resource);

    // type narrowing test - if this compiles, the type guard works
    if (isMarkedForDeletion(marked)) {
      // within this block, marked is narrowed to include the symbol property
      expect(marked[DECLASTRUCT_DELETE]).toBe(true);
    }
  });
});
