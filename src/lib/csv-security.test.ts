import { test } from "node:test";
import assert from "node:assert/strict";
import { csvEscape } from "./csv-security";

test("untrusted formulas remain plain text in exported spreadsheets", () => {
  for (const value of ["=1+1", "+1+1", "-1+1", "@SUM(A1)", "\t=1+1"]) {
    assert.equal(csvEscape(value), `'${value}`);
  }
});
test("numeric values remain numeric and delimiters are escaped", () => {
  assert.equal(csvEscape(-5), "-5");
  assert.equal(csvEscape('Compra; "mercado"'), '"Compra; ""mercado"""');
});