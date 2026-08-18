const MAX_HTML_CHARACTERS = 600_000;

export function firstHttpUrl(text = "") {
  const match = text.match(/https?:\/\/[^\s<>]+/i);
  if (!match) return null;
  return match[0].replace(/[),.;!?]+$/, "");
}

function isPrivateHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "localhost" || normalized === "::1" || normalized.endsWith(".local")) return true;
  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

export function isSafePreviewUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

function decodeEntities(value = "") {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function attributes(tag) {
  const result = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

export function parseLinkPreview(html, sourceUrl) {
  const values = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = attributes(tag);
    const key = (attrs.property || attrs.name || "").toLowerCase();
    if (key && attrs.content && !(key in values)) values[key] = attrs.content.trim();
  }

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = values["og:title"] || values["twitter:title"] || decodeEntities(titleMatch?.[1]?.trim() || "");
  const description = values["og:description"] || values.description || values["twitter:description"] || "";
  const rawImage = values["og:image"] || values["twitter:image"] || "";
  let image = "";
  if (rawImage) {
    try {
      image = new URL(rawImage, sourceUrl).toString();
    } catch {
      image = "";
    }
  }

  return {
    url: sourceUrl,
    host: new URL(sourceUrl).hostname.replace(/^www\./, ""),
    title: title.slice(0, 300),
    description: description.slice(0, 500),
    image,
  };
}

export async function fetchLinkPreview(url) {
  if (!isSafePreviewUrl(url)) return null;
  try {
    let currentUrl = url;
    let response;
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      if (!isSafePreviewUrl(currentUrl)) return null;
      response = await fetch(currentUrl, {
        redirect: "manual",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "Thoughtwax Link Preview/1.0 (+https://thoughtwax.com/notes/)",
        },
      });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location) return null;
      currentUrl = new URL(location, currentUrl).toString();
      response = null;
    }
    if (!response) return null;
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) return null;
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_HTML_CHARACTERS) return null;
    const html = (await response.text()).slice(0, MAX_HTML_CHARACTERS);
    return parseLinkPreview(html, response.url || currentUrl);
  } catch {
    return null;
  }
}
