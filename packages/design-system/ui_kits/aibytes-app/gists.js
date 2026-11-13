// Sample gists for the kit, in the shape of content/gists/<slug>.json
// (packages/feed-schema/feed.d.ts). Hand-written sample text, not a real run's.
window.LEDGER_GISTS = (() => {
  const asOf = "2026-08-27T08:04:10Z";
  const base = { schema_version: 1, tags: [], depth: "full", created_at: asOf, updated_at: asOf };
  const gists = [
    { ...base, slug: "hn-show-hn-tinyeval", kind: "hn", source: "hackernews", category: "launches", title: "Show HN: TinyEval – an eval harness in a single Python file",
      url: "https://github.com/example/tinyeval", source_url: "https://news.ycombinator.com/item?id=50443587", image: { type: "none" }, front_page: true,
      lede: "TinyEval is a 300-line Python file that runs prompt evaluations against any OpenAI-compatible endpoint, with no dependencies to install.",
      sections: [
        { key: "key_points", points: ["One file you copy into a project; test cases are plain Python dicts.", "Scores by exact match, a regular expression, or a second model as judge.", "Prints a table and exits non-zero on a regression, so it drops into CI."] },
        { key: "discussion", points: [
          { stance: "agreed", text: "Most commenters like that it can be read in one sitting, unlike the larger eval frameworks.", url: "https://news.ycombinator.com/item?id=50443901" },
          { stance: "disputed", text: "Whether a model-as-judge score means much without a human-labelled baseline.", url: "https://news.ycombinator.com/item?id=50443950" },
          { stance: "counterpoint", text: "One reply argues the single-file rule will not survive the first request for parallel runs.", url: "https://news.ycombinator.com/item?id=50444010" }] },
      ],
      stats: { points: 1169, comments: 365, submitted_by: "mkrause", posted_at: "2026-08-26T13:00:00Z" }, stats_as_of: asOf,
      links: [{ role: "destination", title: "mkrause/tinyeval on GitHub", url: "https://github.com/example/tinyeval" }, { role: "discussion", title: "Show HN: TinyEval", url: "https://news.ycombinator.com/item?id=50443587" }],
      appearances: [{ item_id: "hn-tinyeval", edition_date: "2026-08-27" }, { item_id: "hn-tinyeval-issue-9", issue_slug: "issue-9" }] },
    { ...base, slug: "gh-officecli", kind: "repo", source: "github", category: "repos", title: "OfficeCLI",
      url: "https://github.com/example/officecli", source_url: "https://github.com/example/officecli", image: { type: "none" },
      lede: "OfficeCLI creates and edits Word, Excel and PowerPoint files from the command line, aimed at scripts and agents that need to produce real documents.",
      sections: [
        { key: "key_points", points: ["One command per action: add a slide, fill a table, replace text by style.", "Reads and writes the standard file formats directly; Office does not need to be installed.", "Ships a JSON mode so an agent can inspect a document before changing it."] },
        { key: "try_it", command: "pip install officecli && officecli docx new report.docx" },
        { key: "whats_open", points: [{ text: "Chart support in PowerPoint is the most requested feature.", url: "https://github.com/example/officecli/issues/12" }, { text: "Several reports of formulas being dropped when a sheet is rewritten.", url: "https://github.com/example/officecli/issues/31" }, { text: "A long thread on whether to add PDF export or leave it to other tools." }] },
      ],
      stats: { stars: 140273, stars_gained: 6400, forks: 9800, language: "Python", license: "MIT", created_on: "2026-06-12", contributors: 41, open_issues: 73, last_release: { tag: "v0.9.2", published_on: "2026-08-20" } }, stats_as_of: asOf,
      links: [{ role: "destination", title: "OfficeCLI repository", url: "https://github.com/example/officecli" }],
      appearances: [{ item_id: "gh-officecli", edition_date: "2026-08-27" }] },
    { ...base, slug: "ph-chatcut", kind: "launch", source: "producthunt", category: "launches", title: "ChatCut",
      url: "https://chatcut.io", source_url: "https://www.producthunt.com/products/chatcut", image: { type: "none" },
      lede: "ChatCut is a video editor that runs inside ChatGPT: you describe the cut, it edits on a real timeline, and the project exports as XML for a desktop editor.",
      sections: [
        { key: "key_points", points: ["Edits are made on a visible timeline, so each change can be checked and undone.", "Exports XML that opens in Premiere and Final Cut.", "Works on footage you upload; it does not generate video."] },
        { key: "who_its_for", text: "People who cut interviews, demos and social clips and want a first assembly without learning an editor." },
        { key: "pricing", text: "Free for exports up to 720p; a paid plan removes the limit." },
      ],
      stats: { upvotes: 776, comments: 42 }, stats_as_of: asOf,
      links: [{ role: "destination", title: "chatcut.io", url: "https://chatcut.io" }, { role: "discussion", title: "ChatCut", url: "https://www.producthunt.com/products/chatcut" }],
      appearances: [{ item_id: "ph-chatcut", edition_date: "2026-08-27" }] },
  ];
  return Object.fromEntries(gists.map((g) => [g.appearances[0].item_id, g]));
})();
