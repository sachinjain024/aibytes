# Publish the aiBytes\_ newsletter on Substack, not Beehiiv

- **Status:** decided, migration in progress
- **Decided:** 3 Nov 2026 (AIB-134j opened, Beehiiv plan already cancelled)
- **First send from Substack:** Issue 17, Monday 9 Nov 2026
- **Ticket:** AIB-134j, with AIB-135b, AIB-136r, AIB-137j, AIB-138v and AIB-139y

## Decision

From Issue 17 the weekly aiBytes\_ issue is written in this repo as before, then
published and emailed from Substack (`aibytesnewsletter.substack.com`, custom
domain `newsletter.aibytes.io`). Beehiiv is no longer used. The daily edition,
the aibytes.io app and the Chrome extension are not affected: they never went
through Beehiiv.

## Why

> **To fill in (publisher):** the reasons for leaving Beehiiv and choosing
> Substack, and any other platform considered.

## What moved, and how


| What                           | How                                                                                                                                                                                                                                        | Where it's tracked |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| Issues 1-16                    | Backfilled as web-only posts, email off, backdated to each issue's Sunday at 17:29 IST. Done **before** the subscriber import so nobody got the old issues by email.                                                                       | AIB-136r           |
| Subscribers                    | 2,632 active subscribers imported from the Beehiiv export, approved by Substack on review. The 313 inactive (unsubscribed or bounced) of 2,945 were left out.                                                                              | AIB-134j           |
| Domain                         | `newsletter.aibytes.io` CNAME to Substack (one-time $50). The five old Beehiiv and SendGrid DNS records were removed on 6 Nov 2026. `aibytes.io` and `www` still serve the GitHub Pages app, so Substack's root-domain redirects stay off. | AIB-134j           |
| Sender and replies             | Sender name `aiBytes_`. Reply-to and public contact address `contact@aibytes.io`, a Cloudflare Email Routing alias. Paid subscriptions off.                                                                                                | AIB-134j           |
| Subscribe links                | The aibytes.io app, docs and social bios point at Substack.                                                                                                                                                                                | AIB-134j           |
| Beehiiv automations            | Turned off, including the Beehiiv welcome email, so nobody gets a double send.                                                                                                                                                             | AIB-134j           |
| Remaining publication settings | Header and footer, welcome email, tags, About page, logo, Google Analytics.                                                                                                                                                                | AIB-139y           |
| Tooling                        | `generate-newsletter-content` builds a Substack export (`scripts/substack_export.py`) instead of the Beehiiv export. The thumbnail is now the Substack social image.                                                                       | AIB-134j           |


## What we gave up

Substack's editor takes no custom HTML or CSS. The issue is rebuilt from the
editor's own blocks, on the publication's theme (cream `#FFF7ED`, orange
`#FF6719`, Spectral). That costs:

- **The issue's own design.** The cobalt palette, the cards, the masthead with
its `0x..` issue number, and the section numbers are gone from the sent issue.
They live on only in the repo's issue HTML.
- **A second link colour.** Every link is orange, so the grey attribution links
can't exist. Text that shouldn't be orange can't be a link: Viral on X links
only the handle, and HN titles are plain bold.
- **Native blocks between two pasted halves.** The Beehiiv export came in two
parts so a subscribe form, ads or polls could sit between them. The Substack
body is one paste, and buttons are added by hand after it.

The layout choice is its own taste record:
`newsletter/artifacts/2026-Nov-03-Substack-design-taste.html`.

## What we gained

> Beehiiv was getting way expensive as the number of subscribers increased.   
> I was subconsciously inserting ads to recover the cost which I didn't like.  
> Substack also offered better growth opportunities than beehiiv and I don't have to worry about cost just keep building and providing value to end users.

## How to go back

AIB-135b removes the Beehiiv tooling only after Issue 17 has gone out from
Substack. Before removing anything it tags the last commit with the full Beehiiv
tooling as `beehiiv-final`, so `git checkout beehiiv-final -- <path>` restores
any piece. Past issues keep their Beehiiv exports under `newsletter/issues/`.

Subscribers would have to be exported from Substack and imported again, and the
`newsletter.aibytes.io` CNAME pointed back.

## How we'll know it worked

Compare Issue 17 and the issues after it with the Beehiiv baseline: opens,
clicks and unsubscribes (AIB-134j, "Monitor the stats on the next issue").

> **To fill in after Issue 17:** the Beehiiv baseline and Issue 17's numbers.