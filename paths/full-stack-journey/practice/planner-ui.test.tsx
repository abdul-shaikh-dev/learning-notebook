import React from 'react';
import {afterEach,test,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import assert from 'node:assert/strict';
import App from './App';
const task={id:'aabbccdd-1234-1234-1234-123456789abc',title:'SQL',minutes:25,done:false,version:1};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test('initial list load prevents mutations before the authoritative list arrives',async()=>{
 let finish!:(r:Response)=>void;
 const fetch=vi.fn(()=>new Promise<Response>(resolve=>finish=resolve));vi.stubGlobal('fetch',fetch);
 render(<App/>);assert.equal((screen.getByRole('button',{name:'Add session'}) as HTMLButtonElement).disabled,true);
 assert.equal((screen.getByLabelText('Study topic (required)') as HTMLInputElement).disabled,true);
 finish(json([task]));await waitFor(()=>assert.equal((screen.getByRole('button',{name:'Add session'}) as HTMLButtonElement).disabled,false));
 assert(screen.getByText(/SQL.*25.*planned/));assert.equal(fetch.mock.calls.length,1);
});
test('a pending create locks the submitted draft and clears it only after success',async()=>{
 let finish!:(r:Response)=>void;
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(json([])).mockImplementationOnce(()=>new Promise<Response>(resolve=>finish=resolve)));
 render(<App/>);await waitFor(()=>assert.equal((screen.getByRole('button',{name:'Add session'}) as HTMLButtonElement).disabled,false));
 const input=screen.getByLabelText('Study topic (required)') as HTMLInputElement;fireEvent.change(input,{target:{value:'SQL'}});
 fireEvent.click(screen.getByRole('button',{name:'Add session'}));await waitFor(()=>assert.equal(input.disabled,true));assert.equal(input.value,'SQL');
 finish(json(task,201));await waitFor(()=>assert.equal(input.disabled,false));assert.equal(input.value,'');assert(screen.getByText(/SQL.*25.*planned/));
});
test('a failed create retains the submitted draft and enables recovery',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(json([])).mockResolvedValueOnce(json({error:'unavailable'},503)));
 render(<App/>);await waitFor(()=>assert.equal((screen.getByRole('button',{name:'Add session'}) as HTMLButtonElement).disabled,false));
 const input=screen.getByLabelText('Study topic (required)') as HTMLInputElement;fireEvent.change(input,{target:{value:'Keep this'}});fireEvent.click(screen.getByRole('button',{name:'Add session'}));
 await waitFor(()=>assert.match(screen.getByRole('status').textContent||'',/503/));assert.equal(input.value,'Keep this');assert.equal(input.disabled,false);
});
test('a stale completion keeps the row and explains compare/reload',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(json([task])).mockResolvedValueOnce(json({},409)));
 render(<App/>);await waitFor(()=>assert.equal((screen.getByRole('button',{name:'Mark complete: SQL'}) as HTMLButtonElement).disabled,false));
 fireEvent.click(screen.getByRole('button',{name:'Mark complete: SQL'}));await waitFor(()=>assert.match(screen.getByRole('status').textContent||'',/Another edit won/));assert(screen.getByText(/SQL.*planned/));
});
