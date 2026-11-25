// The extension's manifest, by build mode (spec AIB-76n extension-popup).
// Dev and store builds differ only where they must; extension-auth adds
// externally_connectable and freezes the permission set at T8.

// The store listing's public key (capability map, answer 5). It pins the ID of
// an unpacked build to the store's, faamldnehjdjdobapchedpmldfjjfife. Public by
// design: the private .pem never enters this repo.
export const KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxPHtR6Mr6q8jKMI3ikRUPZh5Zk9qkdTBRgz9mCTXSCSx2Bky1zaexCtLsZuiMrCVai2mA3k3pC5jGQgaIN4fRvQYTktDp1/51eYOzhEaiWzTXRzHLhDLgVUDo/EZwDIpy6N0qklmdAI99QCGmaYd83D2bEsbqjxOQcaNXrHoXm0G5vVOlASKlG2iALeRqickCM3YmxnZSq+j1QUk03N3f13rgpYZ8zE+Oo2JtWxk1Hz08EC30IbnyNDH7bGmxeNTSLcLQQnUW+qvo1GqWjGATAw5Pt3624lk98E62Kj20bYAZ0BhuWk3OEoOkag9o1kErMlF5CxFEin4epSK3yawRwIDAQAB";

export const EXTENSION_ID = "faamldnehjdjdobapchedpmldfjjfife";

// Ledger's PNGs (T3), emitted by the build under icons/.
export const ICON_SIZES = [16, 32, 48, 128];
const icon = (size) => `icons/icon-${size}.png`;

export function manifest({ mode, version }) {
  const dev = mode === "development";
  return {
    manifest_version: 3,
    name: dev ? "aiBytes (dev)" : "aiBytes – AI News Feed for Developers",
    short_name: "aiBytes",
    // A placeholder until store-listing writes the short description (T23).
    description: "Today's AI news, ranked: launches, repos and stories in one list, a click from your toolbar.",
    version,
    key: KEY,
    action: {
      default_popup: "popup.html",
      default_title: "aiBytes_",
      default_icon: { 16: icon(16), 32: icon(32) },
    },
    icons: Object.fromEntries(ICON_SIZES.map((s) => [s, icon(s)])),
    background: { service_worker: "background.js", type: "module" },
    permissions: ["storage"],
  };
}
