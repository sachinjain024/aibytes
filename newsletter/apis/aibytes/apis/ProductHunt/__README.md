# ProductHunt GraphQL v2 API

Used by the `/ph-fetch-items` skill for the weekly top-products snapshot.

The `local` environment's `ph_access_token` holds a ProductHunt **developer
token** (from the API dashboard), which works directly as a Bearer token — just
run **Top Posts**. The **Get OAuth Token** request is only needed for OAuth
client credentials (key + secret pair); with a developer token it's redundant
(`ph_api_secret` is intentionally empty).

Keep `order: VOTES` in Top Posts — `RANKING` only ever returns the current
day's leaderboard. Offline API docs: `sources/producthunt/graphql-v2/specs/`.
