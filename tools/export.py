"""Make a single, offline HTML file from the editable source. Standard library only."""
from pathlib import Path
from base64 import b64encode

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text()
css = (root / "style.css").read_text()
font = b64encode((root / "assets" / "ember-pixel.woff").read_bytes()).decode("ascii")
css = css.replace("url('./assets/ember-pixel.woff')", "url('data:font/woff;base64," + font + "')")
html = html.replace(
    '<link rel="stylesheet" href="./style.css">',
    '<style>\n' + css + '</style>',
)
for name in ("core", "sprites", "render", "status", "main"):
    source = (root / "js" / f"{name}.js").read_text()
    html = html.replace(
        f'<script src="./js/{name}.js"></script>',
        '<script>\n' + source + '</script>',
    )
(root / "standalone.html").write_text(html)
print("Created standalone.html: all artwork, styles and scripts included.")
