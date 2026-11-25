# Chrome Web Store listing — aiBytes_

> Last updated: 2026-11-25
>
> Lives with the extension. Stay out of the store zip. Listing copy is owned
> by `docs/specs/AIB-76n-store-listing.md` and is filled in at T23. This file
> starts with the permission justifications the review team will read.

The update replaces the existing listing
`faamldnehjdjdobapchedpmldfjjfife` (version 26.1.15). The manifest `key` is
the public key that pins an unpacked build to that ID. The private `.pem`
never enters this repo.

## Permissions

Every permission in the production manifest, with a specific reason. A
permission with an install warning disables the extension for the existing
users; none of these show one. The set was frozen at T8 on 25 Nov 2026 as
`storage` alone: the sign-in gate passed with no host permission
(extension-auth, "The gate's result"). Do
not add another without the publisher's yes.

| Permission | Type | Warning | Why |
|---|---|---|---|
| `storage` | permissions | none | Stars the reader sets while signed out are kept in `chrome.storage.local` so they survive closing the popup and restarting Chrome, and so the background can merge them into the aibytes.io account on the first sign-in. |

No `host_permissions`. Today's edition is fetched from
`https://aibytes.io/content/*`, which is public CORS. Opening a tab
(`chrome.tabs.create` for Sign in, a gist source, or onboarding) needs no
`tabs` permission. `externally_connectable` (T14) is a manifest key, not a
permission.

## Privacy and data use

These map to the Chrome Web Store data-use form. T23 checks them against
`/privacy` and the build.

**Does the extension collect user data?** Yes, only what the reader saves.

| Data type | Collected? | Transmitted off-device? | Purpose | Shared with third parties? |
|---|---|---|---|---|
| Personally identifiable info | No | — | — | — |
| Health info | No | — | — | — |
| Financial info | No | — | — | — |
| Authentication info | Not in this module. T8/T13 sign the reader in with a Firebase custom token minted for their own uid; the token is not stored as a secret in this repo. | T8 | Keep stars in sync with aibytes.io | Firebase (Google), for Auth and Firestore |
| Personal communications | No | — | — | — |
| Location | No | — | — | — |
| Web history | No | — | — | — |
| User activity | Saved item ids only | Signed in: written to the reader's `users/{uid}/saves` on aibytes.io. Signed out: `chrome.storage.local` on this device. | The star on each row, and the Saved list | No, other than Firebase as the account store |
| Website content | No. The edition JSON is public and is read, not collected from other sites. | The public `aibytes.io/content/` files | Show today's ranked edition | No |

### Certification

- Data is not sold to third parties
- Data is not used for purposes unrelated to the extension's core function
  (today's ranked AI edition, starring items, reading gists)
- Data is not used for creditworthiness or lending

### Privacy policy URL

`https://aibytes.io/privacy` — T23 adds the Chrome extension section.

## Version history

| Version | Date | Changes | Status |
|---|---|---|---|
| 26.1.15 | existing listing | Placeholder "AI Bytes" | Published |
| 0.1.0 | 2026-11-25 | Scaffold: popup placeholder, `storage` only, onboarding on install. Then today's edition (T9), and stars and Saved signed out, kept in `chrome.storage.local` (T10) | Draft |

The store version is set to `YY.M.D` of the submission day at T23, and must
be above `26.1.15`.
