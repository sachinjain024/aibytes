"""The Pages deploy workflow cannot drift from what the build reads.

aibytes.io only changes when .github/workflows/pages.yml runs, and it runs on a
path filter. A directory the build reads but the filter misses means a change
that silently never reaches the site - the daily edition included. So the
filter is checked against the directories vite.config.js actually resolves,
and the fallback trigger against edition.yml's real name.

Stdlib only (the suite runs on 3.8 with no packages), so the YAML is read
line by line; the workflow keeps the simple shape this relies on.
"""

import pathlib
import re
import unittest

REPO = pathlib.Path(__file__).resolve().parents[1]
WORKFLOWS = REPO / ".github" / "workflows"
PAGES = WORKFLOWS / "pages.yml"
VITE_CONFIG = REPO / "apps" / "web" / "vite.config.js"


def block_list(text, key, after=None):
    """The `- item` lines under `key:`, optionally the first `key:` after `after:`."""
    lines = text.splitlines()
    start = 0
    if after:
        start = next(i for i, line in enumerate(lines) if line.strip() == after + ":")
    at = next(i for i in range(start, len(lines)) if lines[i].strip() == key + ":")
    indent = len(lines[at]) - len(lines[at].lstrip())
    items = []
    for line in lines[at + 1:]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if len(line) - len(line.lstrip()) <= indent:
            break
        if stripped.startswith("- "):
            items.append(stripped[2:].strip().strip('"').strip("'"))
    return items


def covered(path, patterns):
    """Whether a repo path is matched by one of the workflow's `dir/**` globs."""
    return any(p == path or (p.endswith("/**") and (path + "/").startswith(p[:-2])) for p in patterns)


class PagesWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.text = PAGES.read_text()
        self.paths = block_list(self.text, "paths", after="push")

    def test_pushes_to_main_deploy(self):
        self.assertEqual(block_list(self.text, "branches", after="push"), ["main"])

    def test_every_directory_the_build_reads_triggers_a_deploy(self):
        # path.resolve(here, "../../content") and friends: what the build reads
        # from outside apps/web, plus apps/web itself and the lockfile.
        outside = re.findall(r'path\.resolve\(here,\s*"\.\./\.\./([^"]+)"\)', VITE_CONFIG.read_text())
        self.assertIn("content", outside, "vite.config.js no longer reads content/ the way this test expects")
        needed = outside + ["apps/web", "packages/design-system", "package-lock.json"]
        for path in needed:
            with self.subTest(path=path):
                self.assertTrue(covered(path, self.paths), f"{path} is read by the build but not in pages.yml's paths")

    def test_the_manual_edition_fallback_triggers_a_deploy(self):
        # A push made with GITHUB_TOKEN does not start other workflows, so the
        # fallback's own push never would.
        name = re.search(r"^name:\s*(.+)$", (WORKFLOWS / "edition.yml").read_text(), re.M).group(1).strip()
        self.assertEqual(block_list(self.text, "workflows", after="workflow_run"), [name])

    def test_deploys_what_the_build_writes(self):
        self.assertRegex(self.text, r"path:\s*apps/web/dist\b")


if __name__ == "__main__":
    unittest.main()
