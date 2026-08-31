---
name: ph-download-api-specs
description: Download an offline mirror of the ProductHunt GraphQL v2 API documentation into newsletter/sources/producthunt/graphql-v2/specs. Use when the user wants to (re)download, refresh, or update the local ProductHunt API docs/specs.
---

# Download ProductHunt GraphQL v2 API Specs

Mirrors the ProductHunt GraphQL v2 documentation site
(http://api-v2-docs.producthunt.com.s3-website-us-east-1.amazonaws.com/) into a
self-contained local HTML copy that can be opened directly (file://) or hosted
by any static file server.

## Steps

1. From the repository root, run:

   ```bash
   python3 .claude/skills/ph-download-api-specs/scripts/download_ph_docs.py
   ```

   This crawls every page (queries, mutations, objects, enums, scalars,
   interfaces, input objects, directives), downloads all assets, localizes the
   one external CDN script (anchor-js), and rewrites all internal links to
   relative paths. Output goes to `newsletter/sources/producthunt/graphql-v2/specs/`.

   To write elsewhere, pass an output directory as the first argument.

2. Verify the download:
   - The script prints `Done: N pages, M assets` at the end (expect ~70 pages).
   - Spot-check that `newsletter/sources/producthunt/graphql-v2/specs/index.html` exists
     and that links in it are relative (no `href="/..."` remaining).

3. Report the page/asset counts and output path to the user. The copy can be
   previewed with e.g. `python3 -m http.server -d newsletter/sources/producthunt/graphql-v2/specs`.

## Notes

- Re-running the script overwrites the existing mirror in place — safe for refreshes.
- The site is a static graphql-docs export; if the crawl fails entirely, check
  whether the S3 website URL above is still live before debugging the script.
