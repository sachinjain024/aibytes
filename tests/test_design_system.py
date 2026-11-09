"""Offline checks on Ledger (packages/design-system): color tokens, the
toolbar, and the app shell the app is built from.

Dark mode is written twice in tokens/token.css: once under [data-theme="dark"]
for an explicit choice, and once under prefers-color-scheme for the OS default.
CSS cannot share one block between a selector and a media query, so the copy is
deliberate - and these tests are what stop the two from drifting apart.
"""

import pathlib
import re
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DESIGN_SYSTEM = REPO_ROOT / "packages" / "design-system"
COLORS = DESIGN_SYSTEM / "tokens" / "token.css"
COMPONENTS_CSS = DESIGN_SYSTEM / "components" / "components.css"
STYLES = DESIGN_SYSTEM / "styles.css"
TOOLBAR_JSX = DESIGN_SYSTEM / "components" / "navigation" / "Toolbar.jsx"


def declarations(block):
    """The custom properties and color-scheme a CSS block sets, comments dropped."""
    block = re.sub(r"/\*.*?\*/", "", block, flags=re.S)
    pairs = (decl.split(":", 1) for decl in block.split(";") if ":" in decl)
    return {name.strip(): value.strip() for name, value in pairs}


def block_after(css, selector):
    """The body of the first `selector{...}` rule, without nested braces."""
    match = re.search(re.escape(selector) + r"\s*\{", css)
    if not match:
        raise AssertionError(f"Missing CSS selector: {selector}")
    start = match.end()
    return css[start:css.index("}", start)]


class ColorTokenTests(unittest.TestCase):

    def setUp(self):
        self.css = COLORS.read_text()

    def test_the_os_dark_block_matches_the_explicit_dark_block(self):
        explicit = declarations(block_after(self.css, '[data-theme="dark"]'))
        media = self.css[self.css.index("@media (prefers-color-scheme: dark)"):]
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
        self.assertIn(':root,[data-theme="light"]', self.css)


class SegmentedControlTests(unittest.TestCase):
    """Ranked | Grouped and grid | list sit in .ldg-seg, which clips its children."""

    def test_the_focus_ring_is_drawn_inside_so_overflow_cannot_clip_it(self):
        css = COMPONENTS_CSS.read_text()
        self.assertIn("overflow:hidden", block_after(css, ".ldg-seg"))
        self.assertIn(
            ".ldg-seg__btn:focus-visible,.ldg-seg .ldg-iconbtn:focus-visible"
            "{outline-offset:calc(-1 * var(--focus-w))}", css)



class ToolbarTests(unittest.TestCase):
    """The app toolbar pins with CSS sticky, under the masthead, at its column's width.

    It used to dock with a scroll listener and position:fixed, which painted over
    the masthead and came out 40px narrower than the column (PR #43 review)."""

    def setUp(self):
        self.css = STYLES.read_text()

    def test_the_slot_sticks_at_the_masthead_height(self):
        rule = declarations(block_after(self.css, "  .redesign .toolbar-slot"))
        self.assertEqual(rule["position"], "sticky")
        self.assertEqual(rule["top"], "var(--redesign-top)")

    def test_it_stacks_under_the_masthead(self):
        slot = int(declarations(block_after(self.css, "  .redesign .toolbar-slot"))["z-index"])
        masthead = int(declarations(block_after(self.css, "\n.masthead"))["z-index"])
        self.assertLess(slot, masthead)

    def test_the_masthead_is_as_tall_as_the_offset(self):
        header = declarations(COLORS.read_text())["--redesign-header"]
        self.assertEqual(declarations(block_after(self.css, "\n.masthead"))["height"], header)

    def test_nothing_docks_it_from_javascript(self):
        jsx = TOOLBAR_JSX.read_text()
        self.assertNotIn("toolbar--docked", self.css + jsx)
        self.assertNotIn("addEventListener('scroll'", jsx)



def rules(css, *selectors):
    """(selector, declarations) for every innermost rule whose selector is one of `selectors`, media queries included."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    return [(sel.strip(), declarations(body)) for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css) if sel.strip() in selectors]


class TopOffsetTests(unittest.TestCase):
    """Everything that clears the top bar clears the masthead plus a sticky save banner (AIB-75v).

    --redesign-header stays the masthead's height; the sticky SaveBanner writes its
    own height to --redesign-banner while it is mounted, and --redesign-top is the sum."""

    def setUp(self):
        self.css = STYLES.read_text()
        self.components = COMPONENTS_CSS.read_text()

    def test_the_top_is_the_masthead_plus_the_banner(self):
        tokens = declarations(COLORS.read_text())
        self.assertEqual(tokens["--redesign-top"], "calc(var(--redesign-header) + var(--redesign-banner, 0px))")

    def test_the_rail_drawer_and_backdrop_clear_the_top(self):
        for selectors in ((".sidebar",), (".sidebar-backdrop", ".sidebar-backdrop:not([hidden])")):
            found = [(sel, rule) for sel, rule in rules(self.css, *selectors) if {"top", "inset", "height"} & rule.keys()]
            self.assertTrue(found, selectors)
            for sel, rule in found:
                with self.subTest(sel):
                    for prop in ("top", "inset", "height") & rule.keys():
                        value = rule[prop]
                        self.assertNotIn("52px", value)
                        if prop in ("top", "inset") or "100dvh" in value:
                            self.assertIn("var(--redesign-top)", value)

    def test_the_sticky_banner_sits_under_the_masthead(self):
        rule = dict(rules(self.components, ".ldg-banner--sticky"))[".ldg-banner--sticky"]
        self.assertEqual(rule["position"], "sticky")
        self.assertEqual(rule["top"], "var(--redesign-header)")

    def test_it_stacks_masthead_banner_rail_toolbar(self):
        masthead = int(declarations(block_after(self.css, "\n.masthead"))["z-index"])
        banner = int(dict(rules(self.components, ".ldg-banner--sticky"))[".ldg-banner--sticky"]["z-index"])
        rail = max(int(r["z-index"]) for _, r in rules(self.css, ".sidebar") if "z-index" in r)
        toolbar = int(declarations(block_after(self.css, "  .redesign .toolbar-slot"))["z-index"])
        self.assertGreater(masthead, banner)
        self.assertGreater(banner, rail)
        self.assertGreater(rail, toolbar)


def rules_including(css, selector):
    """Declarations of every innermost rule whose comma-separated selector list includes `selector`."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    return [declarations(body) for sels, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css)
            if selector in (s.strip() for s in sels.split(","))]


class ProseLinkTests(unittest.TestCase):
    """Links in running text show without hover (AIB-75v, WCAG 1.4.1).

    The base `a` rule inherits the text colour with no underline, which suits
    nav, card, row and button links but hides a link inside a sentence. Links in
    a paragraph of the app's main column, or anywhere under `.ldg-prose`, take
    `--link` and an underline; hover thickens it. The base rule is unchanged."""

    def setUp(self):
        self.css = STYLES.read_text()

    def test_prose_links_are_coloured_and_underlined_at_rest(self):
        for selector in (".app-main p a", ".ldg-prose a"):
            with self.subTest(selector):
                found = rules_including(self.css, selector)
                self.assertTrue(found, selector)
                rule = {k: v for r in found for k, v in r.items()}
                self.assertEqual(rule["color"], "var(--link)")
                self.assertEqual(rule["text-decoration-line"], "underline")

    def test_hover_thickens_the_underline(self):
        for selector in (".app-main p a:hover", ".ldg-prose a:hover"):
            with self.subTest(selector):
                found = rules_including(self.css, selector)
                self.assertTrue(found, selector)
                self.assertIn("text-decoration-thickness", found[0])

    def test_the_base_link_rule_is_unchanged(self):
        base = rules_including(self.css, "a")
        self.assertTrue(base)
        self.assertEqual(base[0]["color"], "inherit")
        self.assertEqual(base[0]["text-decoration"], "none")


class SavesKitTests(unittest.TestCase):
    """UI kit screens 12-14 show the saves and sign-in states (AIB-75v)."""

    KIT = DESIGN_SYSTEM / "ui_kits" / "aibytes-app"
    SCREENS = {
        "12-saves-signed-out.html": ("saved0",),
        "13-signed-in-menu.html": ("signedIn0", "accountOpen0"),
        "14-mobile-banner.html": ("saved0", "menuOpen0"),
    }

    def test_each_screen_is_a_seeded_kit_page(self):
        for name, props in self.SCREENS.items():
            with self.subTest(name):
                html = (self.KIT / name).read_text()
                self.assertTrue(html.startswith("<!-- @dsCard "), "the card marker must be the first line")
                self.assertIn('src="App.jsx"', html)
                for prop in props:
                    self.assertIn(prop, html)

    def test_the_kit_app_wires_the_new_options(self):
        app = (self.KIT / "App.jsx").read_text()
        for needle in ("SaveBanner", "sticky", "onSaved=", "savedCount=", "savedActive=", "onSignIn=", "onSignOut=", 'starPos="visual"', "onToggleSave="):
            self.assertIn(needle, app)

    def test_the_readmes_list_them(self):
        readme = (self.KIT / "README.md").read_text()
        for name in self.SCREENS:
            self.assertIn(name, readme)
        ledger = (DESIGN_SYSTEM / "readme.md").read_text()
        for needle in ("starPos", "--redesign-top", "savedCount", "onSignIn"):
            self.assertIn(needle, ledger)


class RemovedComponentTests(unittest.TestCase):
    """Header, SideNav, Chip and Footer were replaced by the app shell (AIB-133k)."""

    NAMES = ("Header", "SideNav", "Chip", "Footer")

    def test_they_are_gone(self):
        for name in self.NAMES:
            with self.subTest(name):
                self.assertEqual(list((DESIGN_SYSTEM / "components").rglob(f"{name}.*")), [])

    def test_nothing_still_uses_them(self):
        pattern = re.compile(r"\b(%s)\b[ />,}]|ldg-(chip|header|sidenav|nav__|footer)" % "|".join(self.NAMES))
        roots = [DESIGN_SYSTEM / "components", DESIGN_SYSTEM / "ui_kits", REPO_ROOT / "apps" / "web" / "src"]
        for source in (f for root in roots for f in root.rglob("*") if f.suffix in (".jsx", ".js", ".html", ".css")):
            with self.subTest(source.name):
                self.assertIsNone(pattern.search(source.read_text()))


class AppShellTests(unittest.TestCase):
    """The app is built from Ledger, so Claude Design sees what ships."""

    SHELL = ("AppHeader", "Sidebar", "Toolbar", "FilterPanel", "ActiveFilters")
    APP = REPO_ROOT / "apps" / "web" / "src" / "App.jsx"

    def test_the_app_imports_its_shell_from_ledger(self):
        app = self.APP.read_text()
        for name in self.SHELL:
            with self.subTest(name):
                self.assertIn(f"@aibytes/design-system/components/navigation/{name}.jsx", app)

    def test_the_app_draws_none_of_the_shell_itself(self):
        # The shell's class names belong to Ledger; markup with them in the app
        # is a second copy that Claude Design never sees.
        shell_classes = re.compile(r'className=["{][^>]*(?<![\w-])(masthead|toolbar|sidebar|redesign-filters|active-filters|app-grid|app-rows)(?![\w-])')
        for source in (REPO_ROOT / "apps" / "web" / "src").rglob("*.jsx"):
            with self.subTest(source.name):
                self.assertIsNone(shell_classes.search(source.read_text()))

    def test_each_shell_component_ships_its_contract(self):
        for name in self.SHELL:
            with self.subTest(name):
                base = DESIGN_SYSTEM / "components" / "navigation" / name
                for suffix in (".jsx", ".d.ts", ".prompt.md"):
                    self.assertTrue(base.with_suffix(suffix).exists(), base.with_suffix(suffix))


if __name__ == "__main__":
    unittest.main()
