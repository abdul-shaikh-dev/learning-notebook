// Run: node javascript-steps.js. Change one assertion, see it fail, then restore it.
import assert from "node:assert/strict";
const text = " 25 ";
assert.equal(Number(text), 25);
assert.equal(Number(""), 0); // Why must a form reject blank text before conversion?
const lessons = [{id:"a",done:false},{id:"b",done:true}];
const completed = lessons.filter(row => row.done);
assert.deepEqual(completed.map(row => row.id), ["b"]);
const toggled = lessons.map(row => row.id === "a" ? {...row,done:true} : row);
assert.equal(lessons[0].done, false); // State was not mutated.
assert.equal(toggled[0].done, true);
async function load(getter) { try { return await getter(); } catch { return "unavailable"; } }
assert.equal(await load(async () => "ready"), "ready");
assert.equal(await load(async () => {throw Error("offline");}), "unavailable");
console.log("PASS: conversion, arrays, immutable update and async failure");
