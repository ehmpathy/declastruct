/**
 * .what = context for CLI operations with passthrough args
 * .why = enables wish files to receive args passed via -- separator
 */
export type ContextDeclastructCli = {
  /**
   * args passed through from CLI via -- separator
   */
  passthrough: {
    /**
     * argv to inject into process.argv before wish file import
     */
    argv: string[];
  };
};
