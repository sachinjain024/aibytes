"""Offline checks on Ledger (packages/design-system): color tokens, and SideNav.

Dark mode is written twice in tokens/colors.css: once under [data-theme="dark"]
for an explicit choice, and once under prefers-color-scheme for the OS default.
CSS cannot share one block between a selector and a media query, so the copy is
deliberate - and these tests are what stop the two from drifting apart.
"""

import pathlib
import re
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DESIGN_SYSTEM = REPO_ROOT / "packages" / "design-system"
COLORS = DESIGN_SYSTEM / "tokens" / "colors.css"
COMPONENTS_CSS = DESIGN_SYSTEM / "components" / "components.css"
SIDENAV = DESIGN_SYSTEM / "components" / "navigation" / "SideNav"


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


class SideNavTests(unittest.TestCase):
    """The rail's ARIA and its fit between a sticky header and a sticky footer."""

    def setUp(self):
        self.jsx = SIDENAV.with_suffix(".jsx").read_text()

    def test_the_date_list_is_a_plain_group_not_a_listbox(self):
        # A listbox of <button>s is invalid: a listbox owns options, not buttons.
        # role="group" rather than no role, because a name on a role-less div
        # is not announced (aria-label is prohibited on generic).
        self.assertNotIn('role="listbox"', self.jsx)
        self.assertIn('className="ldg-nav__dates" role="group" aria-label="Editions"', self.jsx)

    def test_the_current_edition_is_marked_as_a_date(self):
        self.assertIn('aria-current={e.date === currentDate ? "date" : undefined}', self.jsx)

    def test_the_landmark_is_named_for_both_things_it_holds(self):
        self.assertIn('<aside className="ldg-sidenav" aria-label="Edition and categories">',
                      self.jsx)

    def test_the_rail_height_leaves_room_for_a_sticky_footer(self):
        rule = block_after(COMPONENTS_CSS.read_text(), ".ldg-sidenav")
        self.assertEqual(
            declarations(rule)["height"],
            "calc(100vh - var(--ldg-header-h,68px) - var(--ldg-footer-h,0px))")

    def test_the_types_and_prompt_document_the_footer_variable(self):
        for suffix in (".d.ts", ".prompt.md"):
            with self.subTest(file=suffix):
                self.assertIn("--ldg-footer-h", SIDENAV.with_suffix(suffix).read_text())


if __name__ == "__main__":
    unittest.main()
