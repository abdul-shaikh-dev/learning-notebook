import {describe, it, expect} from 'vitest';
import {parseSession, transition} from './foundation-data';
describe('JavaScript decisions, TypeScript boundaries', () => {
  it('accepts zero and returns a fresh normalized value', () => {
    const raw = {id:' a ',minutes:0,done:false};
    expect(parseSession(raw)).toEqual({ok:true,value:{id:'a',minutes:0,done:false}});
    expect(raw.id).toBe(' a ');
  });
  it('rejects coercion, arrays, null and unexpected fields', () => {
    for (const raw of [null,[],{id:'a',minutes:'20',done:false},
      {id:'a',minutes:NaN,done:false},{id:'a',minutes:1441,done:false},
      {id:'a',minutes:true,done:false},{id:'a',minutes:5,done:false,admin:true}])
      expect(parseSession(raw).ok).toBe(false);
  });
  it('preserves the old snapshot and unaffected objects', () => {
    const a=Object.freeze({id:'a',minutes:5,done:false});
    const b=Object.freeze({id:'b',minutes:10,done:false});
    const before=Object.freeze([a,b]);
    const after=transition(before,{type:'complete',id:'a'});
    expect(before[0].done).toBe(false); expect(after[0].done).toBe(true);
    expect(after[1]).toBe(b); expect(after[0]).not.toBe(a);
  });
  it('makes completion idempotent and unknown IDs harmless', () => {
    const rows=[{id:'a',minutes:5,done:false}];
    const once=transition(rows,{type:'complete',id:'a'});
    expect(transition(once,{type:'complete',id:'a'})).toEqual(once);
    expect(transition(rows,{type:'remove',id:'missing'})).toEqual(rows);
    expect(transition(rows,{type:'remove',id:'a'})).toEqual([]);
  });
});
