// The edition JSON carries each image at whatever size its source published.
// A card shows it in a 40px slot (24px in a list row), so before it is
// requested the URL asks the host for that size instead. Only hosts whose
// resize parameters are known are rewritten; any other URL is used as is.
// The published URL in the edition JSON is never changed.

const HOSTS = {
  // WordPress uploads: ?w= scales by width. A 16:9 thumbnail must be twice
  // as wide as the slot so its height still fills it once cropped square.
  "techcrunch.com": (url, px) => {
    if (!url.pathname.startsWith("/wp-content/uploads/")) return false;
    url.searchParams.set("w", String(px * 2));
    return true;
  },
  // Product Hunt's imgix CDN crops to an exact square.
  "ph-files.imgix.net": (url, px) => {
    url.searchParams.set("w", String(px));
    url.searchParams.set("h", String(px));
    url.searchParams.set("fit", "crop");
    return true;
  },
  // github.com/<owner>.png redirects to the avatar at ?size=.
  "github.com": (url, px) => {
    if (!/^\/[^/]+\.png$/.test(url.pathname)) return false;
    url.searchParams.set("size", String(px));
    return true;
  },
};

/**
 * `src` sized for a square slot of `slot` CSS pixels, requested at `density`
 * times that so it stays sharp on a high-density screen.
 */
export function sizedImageUrl(src, slot, density = 2) {
  let url;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  const resize = HOSTS[url.hostname];
  if (!resize || !resize(url, slot * density)) return src;
  // Commas are legal in a query, and imgix and WordPress both read them raw.
  return url.toString().replace(/%2C/g, ",");
}
