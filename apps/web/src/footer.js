// The footer's links (spec §6, Navigation links), as data so `node --test` can
// check them. The X account is Sachin's own until aiBytes_ has one, and both
// mail links go to the address Ledger's footer already shipped with.
import { NEWSLETTER_ORIGIN } from "./route.js";

const EMAIL = "sachinjain.hq@gmail.com";

export const SUBSCRIBE_URL = NEWSLETTER_ORIGIN + "/subscribe";

export const mailto = (address, subject) => `mailto:${address}?subject=${encodeURIComponent(subject)}`;

// No href renders as plain text: the extension has no page until it ships (phase 7).
export const FOOTER_LINKS = [
  { label: "Chrome Extension (soon)" },
  { label: "GitHub", href: "https://github.com/sachinjain024/aibytes" },
  { label: "X", href: "https://x.com/sachinjain024" },
  { label: "Suggest a link", href: mailto(EMAIL, "Suggest a link: aiBytes_") },
  { label: "Advertise", href: mailto(EMAIL, "Advertise: aiBytes_") },
];
