"""Fail deployment when public pages bypass the shared Showcase design system."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DESIGN_STYLESHEET = "/design-system.css"
PUBLIC_DESIGN_STYLESHEET_FILE = ROOT / "design-system.css"
STYLESHEET_LINK_RX = re.compile(
    r"<link\b(?=[^>]*\brel=[\"']stylesheet[\"'])[^>]*>", re.IGNORECASE
)
SHOWCASE_AMBIENCE = (
    'class="scanlines"',
    'class="vignette"',
    'class="rust-stain a"',
    'class="glitch-line"',
    'class="corner tl"',
)


def require(text: str, needle: str, source: Path) -> None:
    if needle not in text:
        raise SystemExit(f"{source.relative_to(ROOT)}: missing required design contract: {needle}")


def require_absent(text: str, needle: str, source: Path) -> None:
    if needle in text:
        raise SystemExit(f"{source.relative_to(ROOT)}: forbidden legacy styling: {needle}")


def fail(path: Path, message: str) -> None:
    try:
        display_path = path.resolve().relative_to(ROOT)
    except ValueError:
        display_path = path
    raise SystemExit(f"{display_path}: {message}")


def require_class(text: str, class_name: str, source: Path) -> None:
    if not re.search(rf'class=["\'][^"\']*\b{re.escape(class_name)}\b', text):
        fail(source, f"missing required design contract class: {class_name}")


def validate_public_page(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    if "<style" in html.lower():
        fail(path, "inline CSS is forbidden")
    if re.search(r"\sstyle\s*=", html, re.IGNORECASE):
        fail(path, "inline presentation attributes are forbidden")
    if "fonts.googleapis.com" in html or "fonts.gstatic.com" in html:
        fail(path, "page-owned font loading is forbidden")
    stylesheet_links = STYLESHEET_LINK_RX.findall(html)
    expected_href = re.compile(
        rf'\bhref=["\']{re.escape(PUBLIC_DESIGN_STYLESHEET)}(?:\?[^"\']*)?["\']',
        re.IGNORECASE,
    )
    if not any(expected_href.search(link) for link in stylesheet_links):
        fail(path, "must load the central design-system stylesheet")
    for required in SHOWCASE_AMBIENCE:
        require(html, required, path)
    for required in ("specimen", "specimen-header", "wordmark", "module-card"):
        require_class(html, required, path)
    require_class(html, "ddd-focus", path)
    if path.name == "404.html":
        require(html, 'class="hardware-button ddd-focus', path)


def validate_public_stylesheet() -> None:
    css = PUBLIC_DESIGN_STYLESHEET_FILE.read_text(encoding="utf-8")
    required_rules = {
        ".module-copy h1": r"color:\s*var\(--ddd-color-heading-3",
        ".hardware-button": r"text-decoration:\s*none",
    }
    for selector, declaration in required_rules.items():
        if selector not in css or not re.search(declaration, css):
            fail(PUBLIC_DESIGN_STYLESHEET_FILE, f"missing central design rule: {selector}")


def main() -> None:
    validate_public_stylesheet()
    for path in (ROOT / "index.html", ROOT / "404.html", ROOT / "bunnycdn_errors" / "404.html"):
        validate_public_page(path)
    print("public site design contract valid")


if __name__ == "__main__":
    main()