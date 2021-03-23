const prepareData = require("./index.js").prepareData;

const input = require("./examples/input.json");
const output = require("./examples/output.json");
const emptyOutput = require("./examples/emptyOutput.json");

let res = prepareData(input, {sprintId: 977});

test("isArray", () =>{
    expect(Array.isArray(res)).toBe(true);
});

test('leaders', () => {
    expect(res[0]).toEqual(output[0]);
});

test('vote', () => {
    expect(res[1]).toEqual(output[1]);
});

test('chart', () => {
    expect(res[2]).toEqual(output[2]);
});

test('diagram', () => {
    expect(res[3]).toEqual(output[3]);
});

test('activity', () => {
    expect(res[4]).toEqual(output[4]);
});

test('empty length', () => {
    expect(prepareData([], {sprintId: 0}).length).toBe(5);
});

test('empty data', () => {
    expect(prepareData([], {sprintId: 0})).toEqual(emptyOutput);
});
