# Jev take

Status: draft. Not posted.
Issue: 11 (week of 27 Sep 2026)
Model: Claude Opus 5.5
Blind test: no. Written in the open, with no Grok draft beside it.
Type: take
UTM, for the held reply only: `utm_source=x&utm_medium=take&utm_campaign=issue-11&utm_content=jev-usecases`

Post as one thread. Tweet 7 carries the source links. Most figures come from roundup articles quoting each project's published calibration, not from the builders' own posts; check tweets 3 and 4 against the repos before posting. The resume example in tweet 2 is unattributed in its source; quote the original post instead if it can be found.

## Thread

### 0 (214)

Jev launched as "just a classifier." A week later people are using it to drive browsers, play Doom, and babysit coding agents.

8 things builders shipped with TypeSafe's Jev, and the one pattern behind all of them:

### 1 (227)

1/ Browser Use built Jev Ultrafast, an open-source web agent. Jev picks the action and the element, and a small LLM only writes text when it has to type.

Google Flights search, Zürich to London: 7.1 seconds, under half a cent.

### 2 (202)

2/ One developer ran their resume against all 6,245 YC companies.

25 seconds. $0.37. 156 founders worth emailing.

Nobody runs that job through an LLM, because the bill would be bigger than the payoff.

### 3 (265)

3/ Guardrails for coding agents are the busiest corner:

jev-auto-approve, a Claude Code hook, auto-approves read-only commands at p >= 0.95. It approved 0 of 8 state-changing ones in its calibration.

jev-secret-guard blocked 6 of 6 secrets, 0 of 6 benign strings.

### 4 (258)

4/ Real-time control, where latency is the whole game:

TypeSafe's Doom demo runs ~10 decisions a second for roughly $7 an hour.
Mobile Jev taps its way to an Uber payment screen in ~21 seconds and 9 actions.
A macOS computer-use agent costs ~$0.0002 a step.

### 5 (254)

5/ The quieter wins sit next to an LLM, not in place of it:

Reranking legal passages lifted top-1 from 5% to 18%, top-10 from 38% to 62%.
Model routing answers in ~1s where an LLM took 4 to 14s.
724 ads from 37 brands classified in ~40s for about $0.09.

### 6 (244)

6/ The pattern: every one of these was possible with an LLM. It was just too slow or too expensive to do thousands of times.

Will DePue said it best: "we've acclimated to AI's limitations and forgotten what products are possible without them."

### 7 (270)

7/ The caveat: "zero hallucinations" means zero out-of-schema answers, not zero wrong ones. Jev is System One. Don't ask it to reason, write, or know your niche domain.

Jev: typesafe.ai
20 use cases: marktechpost.com/2026/09/27/20-agentic-use-cases-of-typesafe-ais-jev/

## Single-tweet version

Jev is "just a classifier," and in a week people used it to:

run a Google Flights search in 7.1s
check a resume against 6,245 YC companies for $0.37
play Doom at 10 decisions/sec for ~$7/hr

Everything it does was already possible with LLMs. It was just too slow and expensive to bother.

## Held reply

Replace `<issue-11-url>` with the published Issue #11 URL.

https://<issue-11-url>?utm_source=x&utm_medium=take&utm_campaign=issue-11&utm_content=jev-usecases

## Sources

- MarkTechPost, 20 agentic use cases (auto-approve, secret-guard, Doom, Mobile Jev, computer use, reranking): https://www.marktechpost.com/2026/09/27/20-agentic-use-cases-of-typesafe-ais-jev/
- Browser Use, jev-ultrafast (7.1s Google Flights): https://github.com/browser-use/jev-ultrafast
- Flavio Copes, deep dive (6,245 YC companies, $0.37): https://flaviocopes.com/jev/
- KDnuggets, what everyone gets wrong (routing ~1s vs 4 to 14s, 724 ads, zero hallucinations caveat): https://www.kdnuggets.com/what-everyone-is-getting-wrong-about-typesafe-ais-jev
- TypeSafe, launch post (Doom ~$7/hr, pricing): https://typesafe.ai/blog/introducing-system-one-models-and-jev
- Will DePue, invisible orthodoxy: https://x.com/willdepue/status/2102100213049761885
