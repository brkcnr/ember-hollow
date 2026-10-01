"""Make a single, offline HTML file from the editable source. Standard library only."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text()
html = html.replace(
    '<link rel="stylesheet" href="./style.css">',
    '<style>\n' + (root / "style.css").read_text() + '</style>',
)
for name in ("core", "sprites", "render", "status", "main"):
    source = (root / "js" / f"{name}.js").read_text()
    html = html.replace(
        f'<script src="./js/{name}.js"></script>',
        '<script>\n' + source + '</script>',
    )
(root / "standalone.html").write_text(html)
print("Created standalone.html: all artwork, styles and scripts included.")
