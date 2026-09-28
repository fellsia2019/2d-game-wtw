type RecruitKey = Pick<KeyboardEvent, 'key' | 'code' | 'repeat' | 'ctrlKey' | 'altKey' | 'metaKey' | 'isComposing'>;

/** Physical number keys work with any layout, including the numeric keypad. */
export function recruitSlot(event: RecruitKey): number | null {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return null;
  const digit = /^(?:Digit|Numpad)([1-4])$/.exec(event.code)?.[1]
    ?? (/^[1-4]$/.test(event.key) ? event.key : null);
  return digit === null ? null : Number(digit) - 1;
}
