import { getStore } from "@netlify/blobs";
import { defaultHoles, isHoleArray } from "../../../src/holes/holesConfig";

// The shared course lives as a single JSON document in Netlify Blobs (ADR-0003).
// The Blob starts empty; reads fall back to the built-in defaults until a
// PIN-holder writes a real course (implicit seeding — no manual seed step).
const STORE_NAME = "course";
const KEY = "holes";

// Public reads are absorbed at the CDN edge; a short max-age keeps the shared
// course reasonably fresh without re-invoking the function per request.
const CACHE_CONTROL = "public, max-age=60";

/**
 * `GET /api/holes` — serve the shared course from Blobs, or the built-in
 * defaults when the Blob is empty, holds something that no longer validates, or
 * is unreachable. `isHoleArray` guards the stored value and the read is wrapped,
 * so neither a corrupt Blob nor a Blobs outage can break reads (ADR-0003).
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method === "GET") return handleGet();
  if (req.method === "PUT") return handlePut(req);
  return new Response("Method Not Allowed", { status: 405 });
}

async function handleGet(): Promise<Response> {
  const holes = await readCourse();

  return Response.json(holes, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}

/**
 * `PUT /api/holes` — let a PIN-holder replace the shared course (ADR-0003). The
 * PIN is compared constant-time against the `HOLE_PIN` deploy secret and a wrong
 * or missing PIN exits 401 **before any Blob op**, so failed / brute-force
 * writes cost only a bare invocation. A correct PIN with a body that passes
 * `isHoleArray` is written last-write-wins (a single PIN-holder).
 */
async function handlePut(req: Request): Promise<Response> {
  const body = await readJson(req);

  if (!(await pinMatches((body as { pin?: unknown }).pin))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const holes = (body as { holes?: unknown }).holes;
  if (!isHoleArray(holes)) {
    return new Response("Bad Request", { status: 400 });
  }

  await getStore(STORE_NAME).set(KEY, JSON.stringify(holes));
  return Response.json(holes);
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const value = await req.json();
    if (typeof value === "object" && value !== null) {
      return value as Record<string, unknown>;
    }
  } catch {
    // Malformed body — treated as an empty object, so the PIN check fails.
  }
  return {};
}

/**
 * Constant-time PIN check against the `HOLE_PIN` deploy secret. `HOLE_PIN` is a
 * server-side env var (read via `process.env`, never bundled into the browser),
 * so the PIN stays a true deploy secret per ADR-0003. Both sides are SHA-256
 * hashed via the Web Crypto API — a web standard available on Netlify's runtime,
 * no Node-only import — so the compare runs over equal-length (32-byte) buffers
 * and never leaks the PIN length. A missing/empty secret never matches.
 */
async function pinMatches(provided: unknown): Promise<boolean> {
  const expected = process.env.HOLE_PIN;
  if (typeof expected !== "string" || expected === "") return false;
  if (typeof provided !== "string") return false;
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)]);
  return constantTimeEqual(a, b);
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return new Uint8Array(digest);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function readCourse() {
  try {
    const stored = await getStore(STORE_NAME).get(KEY, { type: "json" });
    if (isHoleArray(stored)) return stored;
  } catch {
    // Blobs unavailable — fall through to the built-in defaults.
  }
  return defaultHoles();
}
