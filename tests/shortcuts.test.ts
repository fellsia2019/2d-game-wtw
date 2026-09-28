import { expect, it } from 'vitest';
import { recruitSlot } from '../src/ui/shortcuts';
const key = { key: '1', code: 'Digit1', repeat: false, ctrlKey: false, altKey: false, metaKey: false, isComposing: false };
it.each([1,2,3,4])('maps upper-row and numpad key %i to the current roster slot', digit => {
 expect(recruitSlot({...key,key:String(digit),code:`Digit${digit}`})).toBe(digit-1);
 expect(recruitSlot({...key,key:String(digit),code:`Numpad${digit}`})).toBe(digit-1);
});
it('uses physical digits with shifted layouts and supports key-only events', () => {
 expect(recruitSlot({...key,key:'!',code:'Digit1'})).toBe(0);
 expect(recruitSlot({...key,key:'4',code:''})).toBe(3);
 expect(recruitSlot({...key,key:'5',code:'Digit5'})).toBeNull();
 expect(recruitSlot({...key,key:'a',code:'KeyA'})).toBeNull();
});
it.each(['repeat','ctrlKey','altKey','metaKey','isComposing'] as const)('ignores %s so typing and browser shortcuts do not recruit', flag => {
 expect(recruitSlot({...key,[flag]:true})).toBeNull();
});
