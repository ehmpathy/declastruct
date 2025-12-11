/**
 * .what = symbol used to mark resources for declarative deletion
 * .why = enables del() wrapper to mark resources without polluting their interface
 */
export const DECLASTRUCT_DELETE = Symbol.for('declastruct.delete');
