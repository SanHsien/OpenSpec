/**
 * CommonMark lets an ATX heading carry a closing sequence: a run of `#`
 * preceded by a space or tab (`## Purpose ##`). It is not part of the heading
 * text. A `#` glued to the text (`C#`) is part of it and is kept.
 */
export function stripClosingSequence(text: string): string {
  return text.replace(/(?:^|[ \t]+)#+[ \t]*$/, '').trim();
}
