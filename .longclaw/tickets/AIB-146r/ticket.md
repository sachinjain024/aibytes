---
format: longclaw.ticket/v1
id: b26a038e-fd52-44c3-841f-7c7ca57f55a7
key: AIB-146r
title: Product Hunt launches link to producthunt.com, not the product's site
status: backlog
priority: p3
created_at: 2026-11-13T05:54:22.018Z
updated_at: 2026-11-13T05:54:22.018Z
---

On the GitHub Actions runner, curate's Product Hunt link resolver gets a 403
with no `Location` header when it follows a launch's `producthunt.com/r/...`
redirect. Every launch card in the daily edition therefore links to
producthunt.com instead of the product's own site. This predates gists.

Found while measuring sources for the AIB-145y gist spec
(`docs/specs/AIB-145y-gist-generate.md`, "Measured before writing this").
The launch page, the `/r/` redirect and the product site all returned 403 from
a script.

What to find out:

- Does the PH GraphQL API give the product's own URL directly (`website` is a
  PH redirect; check `productLinks` on `Post`)? If so, curate can skip the
  redirect altogether.
- If not, is there any non-scripted way to get the target? Do not work around
  Cloudflare's bot check.

Done when: launch cards on a scheduled run link to the product's site, or the
ticket records why that is not possible and the card keeps the PH link on
purpose.

## Activity

<!-- longclaw:event
id: evt_0607233a
kind: create
occurred_at: 2026-11-13T05:54:22.018Z
actor:
  type: human
  id: local
-->
### You created this ticket
<!-- /longclaw:event -->
