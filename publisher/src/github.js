const API_ROOT = "https://api.github.com";

function githubUrl(env, path) {
  return `${API_ROOT}/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}${path}`;
}

async function githubFetch(env, path, options = {}) {
  const response = await fetch(githubUrl(env, path), {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": "thoughtwax-notes-publisher",
      "x-github-api-version": "2022-11-28",
      ...options.headers,
    },
  });

  if (response.status === 404) return { response, data: null };
  const data = await response.json();
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}): ${data.message || "Unknown error"}`);
  return { response, data };
}

export function bytesToBase64(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < data.length; index += chunkSize) {
    binary += String.fromCharCode(...data.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function textToBase64(value) {
  return bytesToBase64(new TextEncoder().encode(value));
}

export function base64ToText(value) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function getFile(env, path) {
  const { data } = await githubFetch(
    env,
    `/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`,
  );
  return data;
}

export async function putFile(env, { path, contentBase64, message, overwrite = false, expectedDraftId = null }) {
  const existing = await getFile(env, path);
  if (existing && !overwrite) {
    if (expectedDraftId && existing.content) {
      const existingText = base64ToText(existing.content);
      if (existingText.includes(`telegram_draft_id: ${JSON.stringify(expectedDraftId)}`)) {
        return existing;
      }
    }
    throw new Error(`Refusing to overwrite existing repository file: ${path}`);
  }

  const body = {
    message,
    content: contentBase64,
    branch: env.GITHUB_BRANCH,
  };
  if (existing?.sha) body.sha = existing.sha;

  const { data } = await githubFetch(
    env,
    `/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
  return data.content;
}

export async function deleteFile(env, path, message) {
  if (!path) return false;
  const existing = await getFile(env, path);
  if (!existing?.sha) return false;

  await githubFetch(env, `/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha: existing.sha, branch: env.GITHUB_BRANCH }),
  });
  return true;
}
