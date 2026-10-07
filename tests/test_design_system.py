"""Offline checks on Ledger's color tokens (packages/design-system).

Dark mode is written twice in tokens/colors.css: once under [data-theme="dark"]
for an explicit choice, and once under prefers-color-scheme for the OS default.
CSS cannot share one block between a selector and a media query, so the copy is
deliberate - and these tests are what stop the two from drifting apart.
"""

import pathlib
import re
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
COLORS = REPO_ROOT / "packages" / "design-system" / "tokens" / "colors.css"


def declarations(block):
    """The custom properties and color-scheme a CSS block sets, comments dropped."""
    block = re.sub(r"/\*.*?\*/", "", block, flags=re.S)
    pairs = (decl.split(":", 1) for decl in block.split(";") if ":" in decl)
    return {name.strip(): value.strip() for name, value in pairs}


def block_after(css, selector):
    """The body of the first `selector{...}` rule, without nested braces."""
    start = css.index(selector + "{") + len(selector) + 1
    return css[start:css.index("}", start)]


class ColorTokenTests(unittest.TestCase):

    def setUp(self):
        self.css = COLORS.read_text()

    def test_the_os_dark_block_matches_the_explicit_dark_block(self):
        explicit = declarations(block_after(self.css, '[data-theme="dark"]'))
        media = self.css[self.css.index("@media (prefers-color-scheme:dark)"):]
        system = declarations(block_after(media, ':root:not([data-theme="light"])'))
        self.assertEqual(system, explicit)

    def test_dark_overrides_every_light_color(self):
        light = declarations(block_after(self.css, ':root,[data-theme="light"]'))
        dark = declarations(block_after(self.css, '[data-theme="dark"]'))
        # --focus-ring is var(--accent), so it follows the theme by itself.
        self.assertEqual(set(light) - {"--focus-ring"}, set(dark))

    def test_an_explicit_light_choice_beats_a_dark_os(self):
        # The OS block must skip a root that asked for light, and the light
        # values must also apply to a nested [data-theme="light"] wrapper.
        self.assertIn(':root:not([data-theme="light"])', self.css)
        self.assertIn(':root,[data-theme="light"]{', self.css)


if __name__ == "__main__":
    unittest.main()
