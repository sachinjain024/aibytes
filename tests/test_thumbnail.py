"""Tests for the generate-followup-thumbnail skill's prepare_hero.py.

Offline, on synthetic images: a cream canvas with a navy headline, a gray
`aiBytes_` block in the top-right, and a white sparkle where Gemini puts its
watermark. Needs Pillow and skips without it.
"""

import importlib.util
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover
    Image = None

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / ".claude" / "skills" / "generate-followup-thumbnail" / "scripts" / "prepare_hero.py"

CREAM = (250, 245, 235)
NAVY = (26, 26, 46)
GRAY = (150, 150, 155)


def load_script():
    spec = importlib.util.spec_from_file_location("prepare_hero", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def hero(size=(2730, 1536), attribution_right=0.97, headline_left=0.2, sparkle=True):
    """A stand-in hero: headline, attribution block, optional Gemini sparkle."""
    w, h = size
    im = Image.new("RGB", size, CREAM)
    d = ImageDraw.Draw(im)
    d.rectangle((int(w * headline_left), int(h * 0.18), int(w * 0.8), int(h * 0.3)), fill=NAVY)
    ax1 = int(w * attribution_right)
    d.rectangle((ax1 - int(w * 0.09), int(h * 0.06), ax1, int(h * 0.09)), fill=GRAY)
    if sparkle:
        cx, cy = w - int(112 * w / 2730), h - int(112 * w / 2730)
        r = int(45 * w / 2730)
        d.polygon([(cx, cy - r), (cx + r // 3, cy), (cx, cy + r), (cx - r // 3, cy)], fill=(255, 255, 255))
        d.polygon([(cx - r, cy), (cx, cy - r // 3), (cx + r, cy), (cx, cy + r // 3)], fill=(255, 255, 255))
    return im


@unittest.skipUnless(Image is not None, "needs Pillow")
class TestPrepareHero(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ph = load_script()

    def test_issue_number_from_folder(self):
        self.assertEqual(self.ph.issue_number("newsletter/issues/2026/week-48-Issue-19"), 19)
        with self.assertRaises(ValueError):
            self.ph.issue_number("newsletter/issues/2026/week-48")

    def test_gemini_watermark_is_filled(self):
        im = hero()
        box = self.ph.remove_gemini_watermark(im)
        inside = im.crop((box[0] + 1, box[1] + 1, box[2], box[3]))
        lightest = max(sum(p) for p in inside.getdata())
        self.assertLessEqual(lightest, sum(CREAM) + 6)

    def test_attribution_moves_inside_the_safe_area(self):
        im = hero(attribution_right=0.97)
        dx = self.ph.move_attribution(im)
        self.assertGreater(dx, 0)
        (x0, y0, x1, y1), _ = self.ph.find_attribution(im)
        self.assertLessEqual(x1, int(im.width * self.ph.ATTRIBUTION_RIGHT) + 1)

    def test_attribution_already_inside_is_left_alone(self):
        im = hero(attribution_right=0.85)
        self.assertEqual(self.ph.move_attribution(im), 0)

    def test_headline_is_never_taken_for_the_attribution(self):
        im = Image.new("RGB", (2730, 1536), CREAM)
        ImageDraw.Draw(im).rectangle((2100, 60, 2700, 400), fill=NAVY)
        self.assertIsNone(self.ph.find_attribution(im))

    def test_margin_warnings(self):
        self.assertEqual(self.ph.margin_warnings(hero(sparkle=False)), [])
        cut = self.ph.margin_warnings(hero(headline_left=0.02, sparkle=False))
        self.assertTrue(any(w.startswith("cut:") and "left" in w for w in cut))
        tight = self.ph.margin_warnings(hero(headline_left=0.10, sparkle=False))
        self.assertTrue(any(w.startswith("tight:") and "left" in w for w in tight))

    def test_cli_writes_both_variants(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp = pathlib.Path(tmp)
            gemini, grok = tmp / "gemini.png", tmp / "grok.png"
            hero().save(gemini)
            hero(size=(1920, 1080), attribution_right=0.85, sparkle=False).save(grok)
            proc = subprocess.run(
                [sys.executable, str(SCRIPT), "--issue-dir", "newsletter/issues/2026/week-48-Issue-19",
                 "--output-root", str(tmp / "out"), "--previews", str(tmp / "previews"),
                 "--gemini", str(gemini), "--grok", str(grok), "--move-attribution", "gemini"],
                capture_output=True, text=True)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            reports = {r["provider"]: r for r in json.loads(proc.stdout)}
            self.assertEqual(set(reports), {"gemini", "grok"})
            self.assertGreater(reports["gemini"]["attribution_moved_px"], 0)
            self.assertNotIn("watermark_box", reports["grok"])
            for provider in ("gemini", "grok"):
                path = tmp / "out" / "thumbnails" / f"issue-19-hero-{provider}.jpg"
                with Image.open(path) as out:
                    self.assertEqual(out.format, "JPEG")
                    self.assertEqual(out.width, 1456)
                self.assertLessEqual(path.stat().st_size, 200 * 1024)
                self.assertTrue((tmp / "previews" / f"issue-19-hero-{provider}-crop-3x2.png").is_file())

    def test_cli_needs_a_source(self):
        proc = subprocess.run([sys.executable, str(SCRIPT), "--issue-dir", "x/week-1-Issue-1"],
                              capture_output=True, text=True)
        self.assertNotEqual(proc.returncode, 0)


if __name__ == "__main__":
    unittest.main()
