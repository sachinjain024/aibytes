---
format: longclaw.ticket/v1
id: 2aa532cb-f13b-41dc-85dc-4ac06c736b3b
key: AIB-151m
title: "Chrome extension: optional aibytes.io view on the new tab"
status: backlog
priority: p3
labels:
  - app
type: feature
created_at: 2026-11-20T13:00:44.648Z
updated_at: 2026-11-20T13:00:44.648Z
---

Let readers choose to have aibytes.io's daily edition on Chrome's new tab, as an add-on to the popup-first extension in AIB-76n. Split out of AIB-76n on 2026-11-20, where the publisher decided to ship the popup first and the new tab later.

## What the publisher asked for

- The aibytes.io view (the same layout as the site) on the new tab, as an **option** the reader turns on or off.
- The choice is offered during onboarding, as a "take over the new tab?" step between **Pin** and **Sign in** at `aibytes.io/extension-onboarding`, and can be changed later in settings.

## The constraint

`chrome_url_overrides.newtab` is fixed in the manifest and can't be switched at runtime. A toggle therefore means always taking over the new tab and, when the reader has it off, sending the tab straight to Chrome's own new tab.

## How daily.dev does it (read in `dailydotdev/apps`, 20 Nov 2026)

- The manifest always overrides the new tab. The "off" switch is **Do Not Disturb** (`packages/extension/src/newtab/dnd.ts`): for a chosen time, or until turned off, the new tab goes to a URL the reader picks, `chrome://new-tab-page` by default on Chrome.
- **No flash of the feed** (`packages/extension/src/newtab/index.tsx`): before React mounts, it applies the cached theme, so the first paint is a plain background in the reader's colour. It then reads the setting from a local cache, and if the pause is on it never renders the app: `window.stop()`, then `tabs.update(tab.id, { url })`.
- Not solved by them: after the redirect, the cursor is not in the address bar the way it is on Chrome's own new tab.

## Risks to design around

- **The install bubble.** Any new-tab override shows Chrome's "Is this the new tab page you expected?" prompt. "Change it back" turns off the **whole extension**, popup included. Adding the override in an update to an installed popup extension may trigger the prompt for every existing reader. Check how Chrome behaves on update before deciding, and consider a separate extension if the risk to the popup is too high.
- **Permissions.** Redirecting needs `tabs.update` on the current tab. Check whether it adds a permission warning, because the AIB-76n popup ships without the `tabs` permission.
- The cached-theme first paint means the theme has to be stored where the new-tab page can read it before React mounts.

## Depends on

- AIB-76n shipped: the extension, the onboarding page, sign-in and stars.

## Activity

<!-- longclaw:event
id: evt_1974fcca
kind: create
occurred_at: 2026-11-20T13:00:44.648Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->
