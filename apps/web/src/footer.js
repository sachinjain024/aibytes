// The sidebar's footer links (spec §6, Navigation links), as data so `node --test`
// can check them. The mail link goes to the address Ledger's footer already
// shipped with. X and "Suggest a link" were dropped on 16 Nov 2026 for the
// Weekly Archive, the site's own page, which opens in the same tab.
import { withRef } from "@aibytes/design-system/components/content/withRef.js";
import { NEWSLETTER_ORIGIN, privacyPath, weeklyPath } from "./route.js";

const EMAIL = "sachinjain.hq@gmail.com";

export const SUBSCRIBE_URL = NEWSLETTER_ORIGIN + "/subscribe";

// Every Subscribe link on aibytes.io uses this one, tagged ref=aiBytes_, so the
// newsletter site can tell a signup that came from here (they open in a new tab).
export const SUBSCRIBE_HREF = withRef(SUBSCRIBE_URL);

// The masthead links here too, so it is a constant rather than a lookup by label.
export const GITHUB_URL = "https://github.com/sachinjain024/aibytes";

export const mailto = (address, subject) => `mailto:${address}?subject=${encodeURIComponent(subject)}`;

// No href renders as plain text: the extension has no page until it ships (phase 7).
export const FOOTER_LINKS = [
  { label: "Chrome Extension (soon)" },
  { label: "Weekly Archive", href: weeklyPath(), internal: true },
  { label: "GitHub", href: GITHUB_URL },
  { label: "Advertise", href: mailto(EMAIL, "Advertise: aiBytes_") },
  { label: "Privacy", href: privacyPath() },
];
