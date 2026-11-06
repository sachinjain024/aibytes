---
format: longclaw.ticket/v1
id: d0db81af-e84e-449c-9fd2-3a5ec3fb9fb9
key: AIB-130g
title: Connect to the Beehiiv MCP server
status: canceled
priority: p2
type: feature
created_at: 2026-10-23T22:28:44.114Z
updated_at: 2026-11-06T06:48:02.178Z
---

Connect Claude Code to a Beehiiv MCP server, so the weekly issue can go from the Beehiiv export into a Beehiiv post (title, subtitle, thumbnail, body) without copy-paste.

Split out of the Issue #14 ticket (AIB-104a), where it was a checklist item.

Find out whether Beehiiv offers an official MCP server or an API an MCP server can wrap, what it can do (create a draft post, set the thumbnail, schedule), and how the API key is stored. Like every credential here it lives in `.env` or the Keychain, never in a committed file.

## Checklist

- [ ] Find the Beehiiv MCP server or API and what it supports <!-- longclaw:item=ck_5721a01b -->
- [ ] Configure it for Claude Code, with the key in .env <!-- longclaw:item=ck_bcedc59f -->
- [ ] Try creating a draft post from an issue's Beehiiv export <!-- longclaw:item=ck_14a25eb2 -->

## Activity

<!-- longclaw:event
id: evt_6c3185b4
kind: create
occurred_at: 2026-10-23T22:28:44.114Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_83cf3da2
kind: update
occurred_at: 2026-11-06T06:48:02.178Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: todo
    to: canceled
-->
### You updated this ticket
<!-- /longclaw:event -->
