"""Generate small common-text faces; keep the original Unicode faces as fallbacks.

Run manually with fonttools[woff] installed. This is not a build dependency.
The original OFL licences in public/fonts apply to the generated files too.
"""

from hashlib import sha256
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


FONT_DIR = Path(__file__).resolve().parents[1] / "public" / "fonts"
COMMON = set(range(0x20, 0x7F)) | {
    0xA0, 0xA3, 0xA9, 0xAE, 0xB0, 0xB7, 0xD7, 0xF7,
    0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022,
    0x2026, 0x20AC, 0x2122, 0x2191, 0x2193, 0x2212,
}
FACES = [
    (f"barlow-condensed-{weight}-latin", "Barlow Condensed", str(weight))
    for weight in (500, 600, 700, 800, 900)
] + [("dm-sans-400-800-latin", "DM Sans", "400 800")]


def unicode_ranges(points):
    runs = []
    for point in sorted(points):
        if runs and point == runs[-1][1] + 1:
            runs[-1][1] = point
        else:
            runs.append([point, point])
    return ", ".join(
        f"U+{start:04X}" if start == end else f"U+{start:04X}-{end:04X}"
        for start, end in runs
    )


def generate():
    css = ["/* Common text, with the original faces above retained for other characters. */"]
    for source, family, weight in FACES:
        original = TTFont(FONT_DIR / f"{source}.woff2")
        font = TTFont(FONT_DIR / f"{source}.woff2")
        font.recalcTimestamp = False
        points = COMMON & set(original.getBestCmap())
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=points)
        subsetter.subset(font)

        # Subsetting must retain the original glyph outlines, advances and axes.
        for point in points:
            before = original.getBestCmap()[point]
            after = font.getBestCmap()[point]
            assert original["hmtx"][before] == font["hmtx"][after]
            if "glyf" in original:
                assert original["glyf"][before].getCoordinates(original["glyf"])[0] == font["glyf"][after].getCoordinates(font["glyf"])[0]
        if "fvar" in original:
            assert [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in original["fvar"].axes] == [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in font["fvar"].axes]

        buffer = BytesIO()
        font.save(buffer)
        data = buffer.getvalue()
        filename = f"{source.removesuffix('-latin')}-core-{sha256(data).hexdigest()[:12]}.woff2"
        (FONT_DIR / filename).write_bytes(data)
        coverage = unicode_ranges(points)
        css.append(f"@font-face {{\n  font-family: '{family}';\n  font-style: normal;\n  font-weight: {weight};\n  font-display: swap;\n  src: url(/fonts/{filename}) format('woff2');\n  unicode-range: {coverage};\n}}")
        print(f"{source}: {len(data):,} bytes → {filename}")

    style = FONT_DIR.parents[1] / "app" / "fonts.css"
    marker = "/* Common text, with the original faces above retained for other characters. */"
    style.write_text(style.read_text().split(marker)[0].rstrip() + "\n\n" + "\n".join(css) + "\n")


if __name__ == "__main__":
    generate()
