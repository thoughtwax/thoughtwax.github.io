import assert from "node:assert/strict";
import test from "node:test";
import { fetchLinkPreview, firstHttpUrl, isSafePreviewUrl, parseLinkPreview } from "../src/link-preview.js";

test("firstHttpUrl removes prose punctuation", () => {
  assert.equal(firstHttpUrl("Read https://example.com/a?b=1, then reply."), "https://example.com/a?b=1");
  assert.equal(firstHttpUrl("No link here"), null);
});

test("preview URLs reject local and private addresses", () => {
  assert.equal(isSafePreviewUrl("https://thoughtwax.com/a"), true);
  assert.equal(isSafePreviewUrl("http://localhost/admin"), false);
  assert.equal(isSafePreviewUrl("http://127.0.0.1/admin"), false);
  assert.equal(isSafePreviewUrl("http://192.168.1.2/admin"), false);
  assert.equal(isSafePreviewUrl("file:///etc/passwd"), false);
});

test("parseLinkPreview understands Open Graph tags in any attribute order", () => {
  const preview = parseLinkPreview(`
    <html><head>
      <meta content="A &amp; B" property="og:title">
      <meta name="description" content="A useful description">
      <meta content="/card.jpg" property="og:image">
    </head></html>
  `, "https://www.example.com/story");

  assert.deepEqual(preview, {
    url: "https://www.example.com/story",
    host: "example.com",
    title: "A & B",
    description: "A useful description",
    image: "https://www.example.com/card.jpg",
  });
});

test("fetchLinkPreview refuses redirects into private networks", async (context) => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } });
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  assert.equal(await fetchLinkPreview("https://example.com/redirect"), null);
  assert.equal(requests, 1);
});
