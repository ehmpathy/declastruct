/**
 * .what = indents each line of text with specified prefix
 * .why = formats multi-line text to align with tree structure in logs
 */
export const asIndentedLines = (input: {
  text: string;
  indent: string;
}): string => {
  return input.text
    .split('\n')
    .map((line) => `${input.indent}${line}`)
    .join('\n');
};
