import assert from "node:assert/strict";
import test from "node:test";
import { base64ToText, textToBase64 } from "../src/github.js";

test("GitHub content encoding round trips Unicode", () => {
  const value = "Café, naïve, 東京, 🚀";
  assert.equal(base64ToText(textToBase64(value)), value);
});
