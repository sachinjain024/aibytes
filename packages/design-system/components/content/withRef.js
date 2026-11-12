// Links from aibytes.io to a source item's own page carry ref=aiBytes_
// (AIB-145y T38). They also carry rel="noreferrer", which strips the Referer
// header, so without the parameter a destination's analytics cannot tell a
// visit came from here. Added when the link is rendered: the published
// content keeps clean URLs, and a gist's source key ignores `ref`.
//
// The URL is edited as a string, not rebuilt through URL, so an existing
// query and fragment come out exactly as they went in.

export const REF = "aiBytes_";

export function withRef(url) {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return url;
  const hash = url.indexOf("#");
  const base = hash === -1 ? url : url.slice(0, hash);
  const fragment = hash === -1 ? "" : url.slice(hash);
  const mark = base.indexOf("?");
  const query = mark === -1 ? "" : base.slice(mark + 1);
  if (query.split("&").some((pair) => pair.split("=")[0] === "ref")) return url;
  const join = mark === -1 ? "?" : query === "" ? "" : "&";
  return `${base}${join}ref=${REF}${fragment}`;
}
