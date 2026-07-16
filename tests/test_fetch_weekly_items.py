"""Offline tests for the all-source weekly fetch runner."""

import datetime as dt
import importlib.util
import pathlib
import types
import unittest


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = (
    REPO_ROOT
    / ".claude"
    / "skills"
    / "fetch-weekly-items"
    / "scripts"
    / "fetch_weekly_items.py"
)


def load_script():
    spec = importlib.util.spec_from_file_location(SCRIPT.stem, SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fetch_weekly = load_script()


class TestFetchWeeklyItems(unittest.TestCase):
    def test_registry_contains_current_weekly_sources(self):
        self.assertEqual(
            [spec.name for spec in fetch_weekly.SKILLS],
            [
                "ph-fetch-items",
                "hn-fetch-items",
                "tc-fetch-items",
                "gh-fetch-items",
            ],
        )

    def test_skip_aliases_resolve_to_skill_names(self):
        self.assertEqual(
            fetch_weekly.normalize_skips(["producthunt", "hacker-news", "github"]),
            {"ph-fetch-items", "hn-fetch-items", "gh-fetch-items"},
        )

    def test_snapshot_path_uses_iso_week_folder(self):
        spec = fetch_weekly.SKILLS[0]
        snapshot = fetch_weekly.snapshot_path("/tmp/aibytes", dt.date(2026, 7, 16), spec)
        self.assertEqual(
            snapshot,
            pathlib.Path("/tmp/aibytes/2026/07/weeks/week-29/producthunt/ph_data.json"),
        )

    def test_build_command_passes_only_supported_options(self):
        args = types.SimpleNamespace(
            date="2026-07-16",
            output_root="/tmp/aibytes",
            count=3,
            days=7,
            github_since="monthly",
            github_languages=["python"],
            techcrunch_no_hn=True,
        )
        commands = {spec.name: fetch_weekly.build_command(spec, args) for spec in fetch_weekly.SKILLS}

        self.assertIn("--days", commands["ph-fetch-items"])
        self.assertIn("--days", commands["hn-fetch-items"])
        self.assertIn("--days", commands["tc-fetch-items"])
        self.assertNotIn("--days", commands["gh-fetch-items"])

        self.assertIn("--no-hn", commands["tc-fetch-items"])
        self.assertIn("--since", commands["gh-fetch-items"])
        self.assertIn("monthly", commands["gh-fetch-items"])
        self.assertIn("--languages", commands["gh-fetch-items"])
        self.assertIn("python", commands["gh-fetch-items"])


if __name__ == "__main__":
    unittest.main()
