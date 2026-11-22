#!/usr/bin/env python3
"""Prepare the Gemini and Grok hero images for an aiBytes_ issue.

The publisher generates the hero in both models from the prompts in
references/hero-prompts.md and hands back the two originals. This script
turns each one into the file the repo keeps and Substack gets:

1. Gemini only: fills its sparkle watermark in the bottom-right corner by
   blending from the box's four edges (a flat fill leaves a seam).
2. With --move-attribution: finds the light-gray `aiBytes_` text in the
   top-right corner and, if it sits outside the safe area, moves it inward and
   fills the old spot.
3. Flags dark marks (headline, outlines) in the outer margins that Substack's
   crops cut off: 12% left and right (the 3:2 post page), 8% top and bottom
   (the 1.91:1 social preview).
4. Resizes to 1456px wide (Lanczos) and saves a progressive JPEG at quality
   85, stepping down until it is under 200KB.
5. Writes 3:2 and 1.91:1 crop previews and the two touched corners to
   --previews, outside the repo, for Claude to look at.

    python3 .claude/skills/generate-followup-thumbnail/scripts/prepare_hero.py \\
      --issue-dir newsletter/issues/2026/week-48-Issue-19 \\
      --gemini "~/Downloads/Tech Newsletter Cover Illustration.png" \\
      --grok .cache/thumbnails/issue-19-hero-grok.png \\
      --move-attribution gemini

Writes thumbnails/issue-{num}-hero-{gemini,grok}.jpg and prints a JSON report.
Needs Pillow. Never commit the originals.
"""

import argparse
import json
import pathlib
import re
import sys
import tempfile

try:
    from PIL import Image, ImageChops
except ImportError:  # pragma: no cover - reported by main()
    Image = ImageChops = None

PROVIDERS = ("gemini", "grok")
WIDTH = 1456
QUALITIES = (85, 80, 75, 70)
MAX_BYTES = 200 * 1024

# Safe area, as fractions of the image. Substack's post page crops a 16:9
# image to about 3:2 (8% off each side); 12% leaves room. The social preview
# crops to 1.91:1 (about 4% off top and bottom); 8% leaves room.
SAFE_X = 0.12
SAFE_Y = 0.08
# Where the attribution should end up: its right edge 13% in, as the prompts ask.
ATTRIBUTION_RIGHT = 0.87

# Gemini's sparkle, measured on its 2730px-wide output: the box runs from 175px
# to 50px in from the bottom-right corner. Scaled to the image's width.
GEMINI_REF_WIDTH = 2730
GEMINI_BOX_OUTER = 175
GEMINI_BOX_INNER = 50

DARK_LUMA = 90          # headline navy and outlines are darker than this
DARK_SHARE = 0.0005     # flag a margin when more of it than this is dark


def issue_number(issue_dir):
    m = re.search(r"Issue-(\d+)$", pathlib.Path(issue_dir).name)
    if not m:
        raise ValueError(f"{issue_dir}: folder name does not end in -Issue-N")
    return int(m.group(1))


def blend_fill(im, box):
    """Fill the inside of box with the average of the horizontal and vertical
    interpolations between its edge pixels."""
    x0, y0, x1, y1 = box
    px = im.load()
    for y in range(y0 + 1, y1):
        fy = (y - y0) / (y1 - y0)
        for x in range(x0 + 1, x1):
            fx = (x - x0) / (x1 - x0)
            left, right, top, bottom = px[x0, y], px[x1, y], px[x, y0], px[x, y1]
            px[x, y] = tuple(
                int(round(((left[c] * (1 - fx) + right[c] * fx) + (top[c] * (1 - fy) + bottom[c] * fy)) / 2))
                for c in range(3)
            )


def gemini_box(size):
    w, h = size
    scale = w / GEMINI_REF_WIDTH
    outer, inner = round(GEMINI_BOX_OUTER * scale), round(GEMINI_BOX_INNER * scale)
    return (w - outer, h - outer, w - inner, h - inner)


def remove_gemini_watermark(im):
    box = gemini_box(im.size)
    blend_fill(im, box)
    return box


def _is_attribution_pixel(p, bg):
    """Mid-gray text on the cream background: unsaturated, clearly different
    from the background, and lighter than the navy headline and outlines."""
    luma = (p[0] * 299 + p[1] * 587 + p[2] * 114) // 1000
    return (max(p) - min(p) < 30 and 100 <= luma <= 215
            and sum(abs(p[c] - bg[c]) for c in range(3)) > 60)


def find_attribution(im):
    """Bounding box of the gray attribution text in the top-right corner, or None.

    Returns None when what it finds is too big to be the attribution (a stray
    shape or the headline), so nothing gets smeared.
    """
    w, h = im.size
    x_start, y_end = int(w * 0.75), int(h * 0.15)
    region = im.crop((x_start, 0, w, y_end))
    px = region.load()
    bg = px[2, 2]
    xs, ys = [], []
    for y in range(region.height):
        for x in range(region.width):
            if _is_attribution_pixel(px[x, y], bg):
                xs.append(x)
                ys.append(y)
    if len(xs) < 20:
        return None
    box = (x_start + min(xs), min(ys), x_start + max(xs), max(ys))
    if box[2] - box[0] > w * 0.2 or box[3] - box[1] > h * 0.08:
        return None
    return box, bg


def move_attribution(im):
    """Move the attribution left until its right edge is inside the safe area.

    Returns the shift in pixels (0 when it was already inside), or None when no
    attribution was found.
    """
    found = find_attribution(im)
    if found is None:
        return None
    (x0, y0, x1, y1), bg = found
    w, h = im.size
    limit = int(w * ATTRIBUTION_RIGHT)
    if x1 <= limit:
        return 0
    dx = x1 - limit
    pad = max(2, w // 600)
    src = (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad + 1), min(h, y1 + pad + 1))
    text = im.crop(src)
    mask = ImageChops.difference(text, Image.new("RGB", text.size, bg)).convert("L").point(lambda v: 255 if v > 12 else 0)
    fill = (max(0, src[0] - 2), max(0, src[1] - 2), min(w - 1, src[2] + 2), min(h - 1, src[3] + 2))
    blend_fill(im, fill)
    im.paste(text, (src[0] - dx, src[1]), mask)
    return dx


def _dark_share(gray, box):
    part = gray.crop(box)
    return sum(part.histogram()[:DARK_LUMA]) / max(1, part.width * part.height)


def margin_warnings(im):
    """Name each edge whose margin carries dark marks (headline, outlines).

    "cut" means Substack's crop removes them: the strip outside a centred 3:2
    crop on the left and right, outside a centred 1.91:1 crop at the top and
    bottom. "tight" means they survive the crop but sit inside the safe margin.
    """
    w, h = im.size
    cut_x = max(0, (w - round(h * 1.5)) // 2)
    cut_y = max(0, (h - round(w / 1.91)) // 2)
    mx, my = int(w * SAFE_X), int(h * SAFE_Y)
    edges = {
        "left": ((0, 0, cut_x, h), (0, 0, mx, h)),
        "right": ((w - cut_x, 0, w, h), (w - mx, 0, w, h)),
        "top": ((0, 0, w, cut_y), (0, 0, w, my)),
        "bottom": ((0, h - cut_y, w, h), (0, h - my, w, h)),
    }
    gray = im.convert("L")
    out = []
    for name, (cut, margin) in edges.items():
        if cut[2] > cut[0] and cut[3] > cut[1] and _dark_share(gray, cut) > DARK_SHARE:
            out.append(f"cut: dark marks at the {name} edge fall outside Substack's crop")
        elif _dark_share(gray, margin) > DARK_SHARE:
            out.append(f"tight: dark marks in the {name} margin survive the crop but sit close to it")
    return out


def save_jpeg(im, path):
    """Resize to WIDTH and save under MAX_BYTES; returns (size, bytes, quality)."""
    out = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    for q in QUALITIES:
        out.save(path, "JPEG", quality=q, optimize=True, progressive=True)
        if path.stat().st_size <= MAX_BYTES:
            break
    return out, path.stat().st_size, q


def crops(im):
    """The centre crops Substack makes: 3:2 (post page) and 1.91:1 (social)."""
    w, h = im.size
    cw = min(w, round(h * 1.5))
    ch = min(h, round(w / 1.91))
    return (im.crop(((w - cw) // 2, 0, (w + cw) // 2, h)),
            im.crop((0, (h - ch) // 2, w, (h + ch) // 2)))


def prepare(provider, src, dest, previews, move=False):
    im = Image.open(src).convert("RGB")
    report = {"provider": provider, "source": str(src), "source_size": list(im.size)}
    w, h = im.size
    if provider == "gemini":
        report["watermark_box"] = list(remove_gemini_watermark(im))
    if move:
        report["attribution_moved_px"] = move_attribution(im)
    report["warnings"] = margin_warnings(im)
    out, size, quality = save_jpeg(im, dest)
    report.update({"path": str(dest), "size": list(out.size), "kb": round(size / 1024), "quality": quality})
    if previews is not None:
        previews.mkdir(parents=True, exist_ok=True)
        stem = dest.stem
        a, b = crops(out)
        a.save(previews / f"{stem}-crop-3x2.png")
        b.save(previews / f"{stem}-crop-1.91x1.png")
        side = out.width // 5
        out.crop((out.width - side, 0, out.width, side)).save(previews / f"{stem}-top-right.png")
        out.crop((out.width - side, out.height - side, out.width, out.height)).save(previews / f"{stem}-bottom-right.png")
        report["previews"] = str(previews)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--issue-dir", required=True, help="the issue folder, ending in -Issue-N")
    parser.add_argument("--gemini", help="the Gemini original")
    parser.add_argument("--grok", help="the Grok original")
    parser.add_argument("--move-attribution", nargs="*", choices=PROVIDERS, default=[],
                        help="move aiBytes_ inside the safe area for these providers")
    parser.add_argument("--output-root", help="write thumbnails/ under this folder instead of --issue-dir")
    parser.add_argument("--previews", help="folder for crop previews (default: a new temp folder)")
    args = parser.parse_args(argv)

    if Image is None:
        print("error: needs Pillow (python3 -m pip install Pillow)", file=sys.stderr)
        return 1
    sources = {p: getattr(args, p) for p in PROVIDERS if getattr(args, p)}
    if not sources:
        parser.error("pass --gemini and/or --grok")
    try:
        num = issue_number(args.issue_dir)
    except ValueError as err:
        print(f"error: {err}", file=sys.stderr)
        return 1
    root = pathlib.Path(args.output_root or args.issue_dir)
    previews = pathlib.Path(args.previews) if args.previews else pathlib.Path(tempfile.mkdtemp(prefix=f"hero-{num}-"))
    reports = []
    for provider, src in sources.items():
        src = pathlib.Path(src).expanduser()
        if not src.is_file():
            print(f"error: {src}: no such file", file=sys.stderr)
            return 1
        dest = root / "thumbnails" / f"issue-{num}-hero-{provider}.jpg"
        reports.append(prepare(provider, src, dest, previews, move=provider in args.move_attribution))
    print(json.dumps(reports, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
