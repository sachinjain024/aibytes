// The only place the app talks to the analytics tool, Umami Cloud (AIB-145y
// gist-analytics: docs/specs/AIB-145y-gist-analytics.md). A no-op when the
// script is absent, blocked, still loading, or off aibytes.io. List an event
// in the spec before sending it.
export function track(name, data) {
  try {
    const umami = globalThis.umami;
    if (umami && typeof umami.track === "function") umami.track(name, data);
  } catch {
    // Never let measurement break the page.
  }
}
