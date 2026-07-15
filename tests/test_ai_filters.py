"""Offline unit tests for the AI keyword vocabulary and the skill scripts' filters/parsers.

No network. Skill scripts are loaded by file path (their scripts/ dirs are
not packages).
"""

import importlib.util
import pathlib
import re
import sys
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SKILLS = REPO_ROOT / ".claude" / "skills"
sys.path.insert(0, str(SKILLS / "shared"))

import ai_keywords


def load_script(skill, script):
    path = SKILLS / skill / "scripts" / script
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fetch_hn = load_script("hn-fetch-items", "fetch_hn_items.py")
fetch_gh = load_script("gh-fetch-items", "fetch_gh_items.py")


class TestSharedVocabulary(unittest.TestCase):
    def test_compile_patterns_flattens_groups_and_applies_flags(self):
        compiled = ai_keywords.compile_patterns(
            (r"foo",), (r"bar", r"baz"), flags=re.IGNORECASE
        )
        self.assertEqual([p.pattern for p in compiled], ["foo", "bar", "baz"])
        self.assertTrue(all(p.flags & re.IGNORECASE for p in compiled))

    def test_domains_match_hosts_not_substrings(self):
        for host in ("openai.com", "blog.openai.com", "huggingface.co"):
            self.assertTrue(ai_keywords.DOMAINS.search(host), host)
        for host in ("notopenai.com", "openai.com.evil.example", "example.com"):
            self.assertFalse(ai_keywords.DOMAINS.search(host), host)


class TestHNStoryFilter(unittest.TestCase):
    def story(self, title, url="https://example.com/post"):
        return {"title": title, "url": url}

    def test_matches_ai_titles(self):
        for title in (
            "OpenAI releases GPT-6",
            "Show HN: A local LLM inference engine",
            "The A.I. bubble",
            "Fine-tuning embedding models at home",
        ):
            self.assertTrue(fetch_hn.is_ai_story(self.story(title)), title)

    def test_acronyms_stay_case_sensitive_in_prose(self):
        for title in (
            "Repairing air conditioners with rags",
            "Sailing against the wind",
            "A new algorithm for graph traversal",
        ):
            self.assertFalse(fetch_hn.is_ai_story(self.story(title)), title)

    def test_ai_domain_matches_regardless_of_title(self):
        story = self.story("Weekly company update", "https://openai.com/blog/update")
        self.assertTrue(fetch_hn.is_ai_story(story))


class TestGHRepoFilter(unittest.TestCase):
    def repo(self, name, description):
        return {"name": name, "description": description}

    def test_matches_lowercase_repo_vocabulary(self):
        for name, desc in (
            ("acme/awesome-llm-apps", None),
            ("acme/ai-job-search", "Job search on your machine"),
            ("stablyai/orca", "ADE for a fleet of parallel coding agents"),
            ("acme/herdr", "agent multiplexer that lives in your terminal"),
            ("acme/dcmcp", "This is an MCP server for terminal control"),
        ):
            self.assertTrue(fetch_gh.is_ai_repo(self.repo(name, desc)), name)

    def test_ignores_non_ai_repos(self):
        for name, desc in (
            ("oven-sh/bun", "Incredibly fast JavaScript runtime and bundler"),
            ("abseil/abseil-cpp", "Abseil Common Libraries (C++)"),
            ("actions/checkout", "Action for checking out a repo"),
            ("datadog/datadog-agent", "Main repository for the monitoring agent"),
        ):
            self.assertFalse(fetch_gh.is_ai_repo(self.repo(name, desc)), name)


TRENDING_FIXTURE = """
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/acme/llm-toolkit" data-view-component="true" class="Link"><svg></svg>
      <span data-view-component="true" class="text-normal">acme /</span>
      llm-toolkit</a>
  </h2>
  <p class="col-9 color-fg-muted my-1 tmp-pr-4">
    An LLM &amp; agent framework
  </p>
  <div class="f6 color-fg-muted mt-2">
    <span itemprop="programmingLanguage">Python</span>
    <a href="/acme/llm-toolkit/stargazers" class="Link"><svg></svg>
      12,345</a>
    <a href="/acme/llm-toolkit/forks" class="Link"><svg></svg>
      678</a>
    <span>1,234 stars this week</span>
  </div>
</article>
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/acme/no-frills" class="Link">acme / no-frills</a>
  </h2>
</article>
"""


class TestGHTrendingParser(unittest.TestCase):
    def test_parses_article_cards(self):
        repos = fetch_gh.parse_trending(TRENDING_FIXTURE)
        self.assertEqual(len(repos), 2)
        self.assertEqual(
            repos[0],
            {
                "name": "acme/llm-toolkit",
                "url": "https://github.com/acme/llm-toolkit",
                "description": "An LLM & agent framework",
                "language": "Python",
                "stars": 12345,
                "forks": 678,
                "period_stars": 1234,
            },
        )

    def test_missing_optional_fields_default(self):
        bare = fetch_gh.parse_trending(TRENDING_FIXTURE)[1]
        self.assertEqual(bare["name"], "acme/no-frills")
        self.assertIsNone(bare["description"])
        self.assertIsNone(bare["language"])
        self.assertEqual((bare["stars"], bare["forks"], bare["period_stars"]), (0, 0, 0))


if __name__ == "__main__":
    unittest.main()
