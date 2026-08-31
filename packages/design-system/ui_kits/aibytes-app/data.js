window.LEDGER_DATA = (() => {
  const editions = {
    "2026-08-27": { label: "Wed, Aug 27, 2026", mid: "Wed, Aug 27", short: "Aug 27", updated: "4h ago", items: [
      { id: "ph-chatcut", rank: 1, category: "launches", source: "producthunt", source_url: "#ph", url: "#", title: "ChatCut", summary: "AI video editor inside ChatGPT with a real timeline and XML export.", tags: ["Video", "Dev Tool"], signals: { upvotes: 776, comments: 42 }, top: true },
      { id: "ph-relay", rank: 4, category: "launches", source: "producthunt", source_url: "#ph", url: "#", title: "Relay Agents", summary: "Build and deploy browser agents from plain-English runbooks.", tags: ["Agents", "Dev Tool"], signals: { upvotes: 431, comments: 23 } },
      { id: "ph-voiceloop", rank: 13, category: "launches", source: "producthunt", source_url: "#ph", url: "#", title: "VoiceLoop", summary: "Real-time voice agents with barge-in, built from a single prompt.", tags: ["Voice / Speech", "SDK"], signals: { upvotes: 254, comments: 11 } },
      { id: "hn-tinyeval", rank: 11, category: "launches", source: "hackernews", source_url: "#hn", url: "#", title: "Show HN: TinyEval – an eval harness in a single Python file", summary: "300 lines, no dependencies, runs against any OpenAI-compatible endpoint.", tags: ["Show HN", "Eval"], signals: { points: 212, comments: 87 } },
      { id: "gh-officecli", rank: 2, category: "repos", source: "github", source_url: "#gh", url: "#", title: "OfficeCLI", summary: "Create and edit Word, Excel, and PowerPoint files from the command line.", tags: ["CLI", "Open Source"], signals: { stars_gained: 6400 }, meta: { language: "Python" } },
      { id: "gh-inference-lite", rank: 6, category: "repos", source: "github", source_url: "#gh", url: "#", title: "inference-lite", summary: "Single-binary inference server for Mistral models on consumer GPUs.", tags: ["Inference", "Local LLM"], signals: { stars_gained: 2100 }, meta: { language: "Rust" } },
      { id: "gh-agent-traces", rank: 10, category: "repos", source: "github", source_url: "#gh", url: "#", title: "agent-traces", summary: "Record, replay, and diff agent runs across model versions.", tags: ["Agents", "Eval"], signals: { stars_gained: 1300 }, meta: { language: "TypeScript" } },
      { id: "gh-awesome-mcp", rank: 14, category: "repos", source: "github", source_url: "#gh", url: "#", title: "awesome-mcp-servers", summary: "A curated list of MCP servers, updated daily.", tags: ["MCP", "Open Source"], signals: { stars_gained: 900 } },
      { id: "tc-apple", rank: 7, category: "news", source: "techcrunch", source_url: "#tc", url: "#", title: "Apple holds talks with OpenAI over a revamped Siri", summary: "The deal would put a long-context model behind Siri as soon as next spring.", tags: ["Apple", "OpenAI"] },
      { id: "tc-anthropic", rank: 9, category: "news", source: "techcrunch", source_url: "#tc", url: "#", title: "Anthropic ships sandboxed execution for Claude Code teams", summary: "Enterprise plans get isolated runtimes and audit logs for agent sessions.", tags: ["Anthropic", "Claude Code", "Security"] },
      { id: "tc-euact", rank: 15, category: "news", source: "techcrunch", source_url: "#tc", url: "#", title: "EU begins enforcing AI Act rules for foundation models", summary: "Model providers now face documentation and incident-reporting duties.", tags: ["Policy"] },
      { id: "hn-claudecode", rank: 3, category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "Claude Code sends 33k tokens before you type anything", summary: "A teardown of the system prompt, tool schemas, and what they cost you.", tags: ["Claude Code", "Hot Take"], signals: { points: 699, comments: 412 } },
      { id: "hn-sqlite", rank: 5, category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "SQLite as a vector database is fine, actually", summary: "Benchmarks against pgvector and a case for boring infrastructure.", tags: ["Embeddings", "Opinion"], signals: { points: 512, comments: 233 } },
      { id: "hn-postmortem", rank: 8, category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "Postmortem: our agent deleted the staging database", summary: "What over-broad tool permissions cost us, and the guardrails we added.", tags: ["Agents", "Deep Dive"], signals: { points: 441, comments: 301 } },
      { id: "hn-offline", rank: 12, category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "Ask HN: Who runs LLMs fully offline in production?", summary: "Air-gapped deployments, quantization tradeoffs, and what breaks first.", tags: ["Local LLM"], signals: { points: 358, comments: 190 } }
    ]},
    "2026-08-26": { label: "Tue, Aug 26, 2026", mid: "Tue, Aug 26", short: "Aug 26", updated: null, items: [
      { id: "ph-plancast", category: "launches", source: "producthunt", source_url: "#ph", url: "#", title: "Plancast", summary: "Turn a product spec into a clickable prototype with one prompt.", tags: ["Dev Tool", "Agents"], signals: { upvotes: 389, comments: 31 }, top: true },
      { id: "ph-datale", category: "launches", source: "producthunt", source_url: "#ph", url: "#", title: "Datale", summary: "Natural-language SQL sessions that compile to dbt models.", tags: ["Dev Tool", "Code Gen"], signals: { upvotes: 276, comments: 18 } },
      { id: "hn-ragmail", category: "launches", source: "hackernews", source_url: "#hn", url: "#", title: "Show HN: I built a local-first RAG for my email", summary: "Everything on-device: embeddings, index, and a tiny reranker.", tags: ["Show HN", "RAG", "Local LLM"], signals: { points: 189, comments: 96 } },
      { id: "tc-openai-hw", category: "news", source: "techcrunch", source_url: "#tc", url: "#", title: "OpenAI's hardware team shows first device prototypes internally", summary: "A screenless companion device, according to two people familiar.", tags: ["OpenAI"] },
      { id: "tc-nvidia", category: "news", source: "techcrunch", source_url: "#tc", url: "#", title: "Nvidia earnings: data-center revenue up 64% on inference demand", summary: "Inference now outweighs training in hyperscaler orders, the company says.", tags: ["Nvidia"] },
      { id: "hn-context", category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "Context engineering is just cache management", summary: "An argument for treating prompts like a memory hierarchy.", tags: ["LLM", "Opinion"], signals: { points: 421, comments: 187 } },
      { id: "hn-agentbill", category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "The bill for our agents came due", summary: "Six months of agent infra in production: costs, failures, wins.", tags: ["Agents", "Deep Dive"], signals: { points: 533, comments: 264 } },
      { id: "hn-quant", category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "Quantization-aware training, explained with pictures", summary: "From fp16 to int4 without the hand-waving.", tags: ["Fine-tuning", "Tutorial"], signals: { points: 302, comments: 88 } }
    ]},
    "2026-08-25": { label: "Mon, Aug 25, 2026", mid: "Mon, Aug 25", short: "Aug 25", updated: null, items: [
      { id: "gh-llmlint", category: "repos", source: "github", source_url: "#gh", url: "#", title: "llmlint", summary: "Static analysis for prompts: catch injection risks in CI.", tags: ["Security", "CLI"], signals: { stars_gained: 1800 }, meta: { language: "Python" }, top: true },
      { id: "gh-vecpack", category: "repos", source: "github", source_url: "#gh", url: "#", title: "vecpack", summary: "Compress embedding indexes 4x with product quantization.", tags: ["Embeddings", "Library"], signals: { stars_gained: 1100 }, meta: { language: "Rust" } },
      { id: "gh-mcp-kit", category: "repos", source: "github", source_url: "#gh", url: "#", title: "mcp-kit", summary: "Batteries-included TypeScript SDK for building MCP servers.", tags: ["MCP", "SDK"], signals: { stars_gained: 740 }, meta: { language: "TypeScript" } },
      { id: "ph-briefly", category: "launches", source: "producthunt", source_url: "#ph", url: "#", title: "Briefly", summary: "Meeting notes that write themselves into your issue tracker.", tags: ["Dev Tool"], signals: { upvotes: 512, comments: 29 } },
      { id: "hn-goodhart", category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "Your evals are Goodharting you", summary: "Why leaderboard gains keep failing to show up in production.", tags: ["Eval", "Opinion"], signals: { points: 468, comments: 211 } }
    ]},
    "2026-08-22": { label: "Fri, Aug 22, 2026", mid: "Fri, Aug 22", short: "Aug 22", updated: null, items: [
      { id: "ph-stackpilot", category: "launches", source: "producthunt", source_url: "#ph", url: "#", title: "Stackpilot", summary: "AI code review that comments like your strictest teammate.", tags: ["Code Gen", "Dev Tool"], signals: { upvotes: 603, comments: 48 }, top: true },
      { id: "gh-tokencost", category: "repos", source: "github", source_url: "#gh", url: "#", title: "tokencost", summary: "Track LLM spend per feature with one decorator.", tags: ["SDK", "Open Source"], signals: { stars_gained: 950 }, meta: { language: "Python" } },
      { id: "tc-meta", category: "news", source: "techcrunch", source_url: "#tc", url: "#", title: "Meta releases open weights for a 7B on-device model", summary: "Benchmarks put it ahead of last year's mid-tier cloud models.", tags: ["Meta", "Model Release", "Open Source"] },
      { id: "hn-localgood", category: "hn", source: "hackernews", source_url: "#hn", url: "#", title: "Local models are good enough now", summary: "A working developer's honest audit of a cloud-free month.", tags: ["Local LLM", "Opinion"], signals: { points: 387, comments: 245 } }
    ]}
  };
  return {
    editions,
    order: ["2026-08-22", "2026-08-25", "2026-08-26", "2026-08-27"],
    categories: [
      { key: "launches", label: "New Products" },
      { key: "repos", label: "Trending Dev Projects" },
      { key: "news", label: "AI News" },
      { key: "hn", label: "HN Threads" }],
    sources: [
      { key: "producthunt", label: "Product Hunt" },
      { key: "hackernews", label: "Hacker News" },
      { key: "github", label: "GitHub" },
      { key: "techcrunch", label: "TechCrunch" }],
    tagGroups: {
      "What it is": ["Model Release", "Open Source", "Paper", "Benchmark", "Dataset", "Framework", "Library", "Dev Tool", "CLI", "SDK", "API"],
      "Domain": ["LLM", "Agents", "RAG", "Fine-tuning", "Inference", "Local LLM", "Vision", "Voice / Speech", "Video", "Image Gen", "Code Gen", "Embeddings", "Eval"],
      "Ecosystem": ["OpenAI", "Anthropic", "Google", "Meta", "Nvidia", "Hugging Face", "Mistral", "xAI", "Apple", "Microsoft", "Claude Code", "Cursor", "MCP"],
      "Business": ["Funding", "Acquisition", "Launch", "Pricing", "Policy", "Legal", "Security", "Privacy"],
      "Format": ["Show HN", "Tutorial", "Deep Dive", "Opinion", "Interview", "Hot Take"]
    }
  };
})();
